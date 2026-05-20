# Session 会话系统

深入 OpenClaw 的 Session 管理，理解会话创建、上下文构建、消息历史、Token 计费的完整机制。

## 🏗️ Session 是什么

Session 是 OpenClaw 管理一次对话的完整上下文。每个用户 + 通道 = 一个 Session。

```
SessionKey = "channel:userId:channelId"

telegram:12345:67890     ← Telegram 用户 12345 在群组 67890
discord:98765:111222     ← Discord 用户 98765 在频道 111222
webchat:default:default  ← WebChat 默认会话
```

## 📦 Session 数据结构

```typescript
interface Session {
  // 标识
  key: string                    // 唯一标识
  channel: string                // 通道名
  userId: string                 // 用户 ID
  channelId: string              // 通道/群组 ID

  // 模型
  model: string                  // 当前使用模型
  modelOverride: string | null   // 临时模型覆盖

  // 消息历史
  messages: Message[]            // 消息数组

  // 上下文
  systemPrompt: string           // 系统提示词
  workspaceFiles: string[]       // 工作区文件列表

  // 工具状态
  pendingToolCalls: Map<string, ToolCall>
  toolResults: Map<string, ToolResult>

  // 统计
  tokenUsage: {
    input: number                // 输入 Token
    output: number               // 输出 Token
    total: number                // 总 Token
  }
  cost: number                   // 估算费用

  // 生命周期
  createdAt: number
  lastActiveAt: number
  turns: number                  // 对话轮次
}
```

## 🔄 Session 生命周期

```
1. 创建
   用户发第一条消息
   → getOrCreateSession(key)
   → 加载工作区文件 (AGENTS.md / SOUL.md / USER.md / MEMORY.md)
   → 构建系统提示词
   → 初始化消息历史

2. 活跃
   每条消息更新 lastActiveAt
   → 更新 tokenUsage
   → 上下文窗口管理（压缩或截断）

3. 空闲
   超时无消息
   → Session 保留在内存中
   → 历史持久化到磁盘

4. 恢复
   用户再次发消息
   → 从磁盘恢复历史
   → 重新构建上下文

5. 重置
   用户请求 /reset 或上下文过长
   → 清空消息历史
   → 保留系统提示词和工作区文件
```

## 📝 上下文构建

每轮 Agent 循环，Session 的上下文按以下顺序构建发送给 LLM：

```
System Prompt
├── 身份定义 (SOUL.md / IDENTITY.md)
├── 行为规范 (AGENTS.md)
├── 用户信息 (USER.md)
├── 工具备注 (TOOLS.md)
├── 时间信息 (当前时间 / 时区)
├── 技能文件 (SKILL.md 内容)
└── 通道信息 (通道类型 / 特殊指令)

Conversation History
├── User Message 1
├── Assistant Message 1
├── Tool Call 1
├── Tool Result 1
├── Assistant Message 2
├── ...
└── User Message N (最新消息)
```

### 上下文窗口管理

```
┌──────────────────────────────────────────────┐
│              Token 预算 (Token Budget)        │
│                                              │
│  ┌─────────────┐  ┌───────────────────────┐ │
│  │ System      │  │ Conversation History  │ │
│  │ Prompt      │  │ (动态调整)             │ │
│  │ (固定)      │  │                       │ │
│  │ ~2000       │  │ ~6000 tokens          │ │
│  │ tokens      │  │                       │ │
│  └─────────────┘  └───────────────────────┘ │
│                                              │
│  预留 ~2000 tokens 给 LLM 输出               │
└──────────────────────────────────────────────┘

当 History 超出预算时：
1. 首先尝试 Compaction（压缩旧消息）
2. 如果压缩后仍超长，截断最早的消息
3. 始终保留 System Prompt 和最近 N 轮对话
```

## 🧠 Compaction 上下文压缩

当对话历史过长时，OpenClaw 使用 Compaction 压缩旧消息：

```
压缩前的消息历史（100 条消息，12000 tokens）：
┌───────────────────────────────────────┐
│ 消息 1-80: 早期对话（可以压缩）        │
│ 消息 81-100: 近期对话（保留）         │
└───────────────────────────────────────┘

压缩后（2000 tokens 摘要 + 近期消息）：
┌───────────────────────────────────────┐
│ [摘要]: 早期对话要点... (2000 tokens)  │
│ 消息 81-100: 近期对话（完整保留）      │
└───────────────────────────────────────┘
```

Compaction 使用 LLM 生成摘要，调用方式：

```
调用 LLM: "请总结以下对话的关键信息..."
    ↓
生成摘要（替代 80 条旧消息）
    ↓
将摘要作为 system message 插入历史
    ↓
删除被摘要替代的旧消息
```

## 💾 持久化

```
~/.homiclaw/sessions/
├── telegram_12345_67890.json      ← Session 快照
├── discord_98765_111222.json
└── webchat_default_default.json

每个 Session 文件内容：
{
  "key": "telegram:12345:67890",
  "messages": [...],              ← 消息历史
  "model": "openai/gpt-4",
  "tokenUsage": { "input": 5000, "output": 2000 },
  "cost": 0.12,
  "lastActiveAt": 1716182400000
}
```

持久化时机：
- 每次 Agent Turn 结束后保存
- Gateway 优雅关闭时保存所有活跃 Session
- 崩溃恢复时从磁盘加载

## 🐛 常见问题

### Q: Session 重置后工作区文件还在吗？

```
在。/reset 只清空消息历史，System Prompt 和工作区文件
(AGENTS.md / SOUL.md / USER.md) 不受影响。
```

### Q: 多设备登录共用一个 Session 吗？

```
不是。SessionKey = channel:userId:channelId
同一用户在不同通道（Telegram / Discord）是不同 Session。
同一用户在同一通道的不同群组也是不同 Session。
```

### Q: 上下文压缩会丢失重要信息吗？

```
可能有损失。Compaction 用 LLM 生成摘要，关键事实通常保留，
但精确的数字、日期、代码可能丢失。
建议用户用 MEMORY.md 记录重要信息，它不会被压缩。
```

---

下一篇：[Lane Queue 命令队列](./lane-queue)