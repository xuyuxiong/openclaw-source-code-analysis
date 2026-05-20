# Lane Queue 命令队列

Lane Queue 是 OpenClaw 最核心的并发控制机制，确保同一会话的消息串行处理，避免竞态条件。

## 🎯 为什么需要 Lane Queue

### 没有 Lane Queue 的问题

```
用户快速发 3 条消息（A → B → C）：

没有 Lane Queue（并发处理）：
────────────────────────────────────────────
Agent 处理 A ──── 读上下文(空) ──── 调用 LLM ──── 写回复 A'
Agent 处理 B ──── 读上下文(空) ──── 调用 LLM ──── 写回复 B'  ← B 看不到 A 的上下文！
Agent 处理 C ──── 读上下文(空) ──── 调用 LLM ──── 写回复 C'  ← C 也看不到 A、B！
────────────────────────────────────────────
结果：三条回复重复、矛盾、丢失上下文
```

### 有 Lane Queue（串行处理）

```
有 Lane Queue（串行处理）：
────────────────────────────────────────────
消息 A 入队 ──→ 处理 A ──→ 回复 A' ──→ 上下文更新
消息 B 入队 ──────────────────────────→ 处理 B（看到 A 的上下文） ──→ 回复 B'
消息 C 入队 ─────────────────────────────────────────────────────→ 处理 C ──→ 回复 C'
────────────────────────────────────────────
结果：每条回复都有完整上下文，回复连贯
```

## 🏗️ Lane 的概念

**Lane** = 一个逻辑队列，按 Session 粒度划分。同一 Session 的所有操作在同一个 Lane 中串行执行。

```
Lane 1 (Telegram:UserA):  A1 → A2 → A3 → ...
Lane 2 (Discord:UserB):   B1 → B2 → ...
Lane 3 (WebChat:UserC):   C1 → ...

不同 Lane 之间并行执行 ✅
同一 Lane 内部串行执行 ✅
```

## 🔧 源码实现

### 核心数据结构

```typescript
class LaneQueue {
  // Lane 映射：sessionKey → 任务队列
  private lanes: Map<string, Promise<void>> = new Map()

  // 将任务放入指定 Lane
  async enqueue(sessionKey: string, task: () => Promise<void>): Promise<void> {
    // 获取或创建当前 Lane 的尾部 Promise
    const current = this.lanes.get(sessionKey) || Promise.resolve()

    // 将新任务接到尾部
    const next = current.then(() => task()).catch(err => {
      logger.error(`Lane task failed for ${sessionKey}:`, err)
    })

    this.lanes.set(sessionKey, next)

    // 任务完成后清理（如果没有后续任务）
    next.finally(() => {
      if (this.lanes.get(sessionKey) === next) {
        this.lanes.delete(sessionKey)
      }
    })

    return next
  }
}
```

### 入队流程

```
InboundMessage
    ↓
normalizeMessage()          ← 标准化
    ↓
buildSessionKey(msg)        ← 计算 SessionKey: "telegram:12345:67890"
    ↓
laneQueue.enqueue(key, async () => {
    session = getOrCreateSession(key)   ← 获取会话
    session.context.addUserMessage(msg) ← 更新上下文
    response = await agentLoop.run(session) ← Agent 循环
    await sendReply(response)           ← 发送回复
})
```

### Lane Key 的计算

```typescript
function buildSessionKey(message: InboundMessage): string {
  // 格式: channel:userId:channelId
  // 例如: telegram:12345:67890
  //       discord:98765:111222
  //       webchat:default:default
  return `${message.channel}:${message.userId}:${message.channelId}`
}
```

同一用户在同一条通道的消息共享一个 Lane。

## 🔄 特殊场景

### 1. 工具调用中的 Lane

```
Agent Turn 1: 用户消息 → LLM → Tool Call(exec) ──→ 沙箱执行
                                                    ↓ (不等 Lane)
Agent Turn 2: Tool Result → LLM → 文本回复 ←──────┘
```

工具执行**不在 Lane 内串行等待**，但 Agent 继续循环需要回到 Lane。

### 2. 子代理的 Lane

```
主代理 Lane:  用户消息 → 主代理 → spawn 子代理 ──→ 子代理独立 Lane
                                                    ↓
主代理 Lane:  ← 子代理结果 ← 主代理继续 ←────────────┘
```

子代理有自己的 Lane，不阻塞主代理的 Lane。

### 3. Cron 任务的 Lane

```
Cron 任务 → 新建独立 Session → 独立 Lane → 处理完毕 → Lane 释放
```

Cron 任务的 Lane 与用户 Session 隔离。

### 4. 心跳的 Lane

```
Heartbeat → 入队到对应 Session 的 Lane → 检查是否有待处理事项
         → 无事可做 → HEARTBEAT_OK
         → 有事处理 → 执行任务
```

## 📊 并发控制策略

```
Session 粒度串行 ───────────────────────────┐
                                            │
同一 Session 的消息：A → B → C（串行）      │
不同 Session 的消息：A / B / C（并行）      │
                                            │
工具执行：独立沙箱，不占 Lane                │
子代理：独立 Lane                           │
Cron：独立 Session，独立 Lane               │
                                            │
Lane 最大深度：防止堆积                      │
    → 超过阈值时拒绝新消息                  │
    → 返回 "我正在处理，请稍等"              │
─────────────────────────────────────────────┘
```

## 💡 设计决策

### 为什么不是全串行？

```
全串行：所有用户排队，A 处理完才处理 B → 响应慢，浪费 LLM 并发能力

Lane Queue 同 Session 串行 + 跨 Session 并行 → 平衡正确性和性能
```

### 为什么不用数据库队列？

```
1. 本地优先原则 — OpenClaw 不依赖外部数据库
2. 低延迟 — 内存操作比数据库快 100x
3. 简单可靠 — 不需要保证持久化（崩溃重启即可）
4. 单写保证 — 单进程不需要分布式锁
```

### 为什么不是 Actor 模型？

```
Lane Queue 本质上是 Actor 模型的简化版：
- 每个 Lane = 一个 Actor
- 消息队列 = Actor 的 Mailbox
- 串行执行 = Actor 的消息处理

OpenClaw 选择了更轻量的 Promise 链实现，而非完整的 Actor 框架。
```

## 🐛 常见问题

### Q: 如果一条消息处理很慢（比如 Tool 执行 5 分钟），后续消息怎么办？

```
后续消息排在 Lane 队列中，等待前一条处理完。
如果 Lane 队列超过深度阈值，新消息会被拒绝并返回提示。
```

### Q: Gateway 重启后 Lane 状态会丢失吗？

```
会。Lane 是纯内存的，重启后清空。
但 Session 历史持久化在文件系统中，重启后可以恢复上下文。
```

---

下一篇：[Provider 提供者系统](./provider-system)