# Lane Queue 串行化

Lane Queue 是 OpenClaw 最独特的设计，也是一种哲学：**同一 Lane 串行，不同 Lane 并行**。

## 💡 核心理念

```
LLM 需要完整上下文才能给出好的回复
  → 上下文必须是一致的
  → 一致性要求串行写入
  → 串行写入 = Lane Queue
```

类比：银行柜台
```
Bank Teller Model:
  每个柜台（Lane）一次只服务一个客户
  客户排队等候
  不同柜台可以并行
  但同一柜台必须串行
```

## 🏗️ 四条 Lane

源码定义了 4 条 Lane（`src/process/lanes.ts`）：

```typescript
export const enum CommandLane {
  Main = "main",       // 主会话：用户消息、自动回复
  Cron = "cron",       // 定时任务：Cron 执行
  Subagent = "subagent", // 子代理：spawn 的独立执行
  Nested = "nested",   // 嵌套调用：工具内部的二次调用
}
```

```
Main Lane:    用户消息 → Agent 回复 → 工具调用 → ...  (串行)
Cron Lane:    定时任务1 → 定时任务2 → ...             (串行，可配置并发)
Subagent Lane: 子代理1 → 子代理2 → ...               (串行)
Nested Lane:  嵌套调用排队                             (串行)
```

## 🔄 并发控制

CommandQueue 并非简单串行——每条 Lane 支持独立的 `maxConcurrent`：

```typescript
// 源码: src/process/command-queue.ts
type LaneState = {
  lane: string;
  queue: QueueEntry[];        // 等待队列
  activeTaskIds: Set<number>;  // 正在执行的任务
  maxConcurrent: number;       // 最大并发数
  draining: boolean;           // 是否正在排空
  generation: number;          // 代际计数（用于 clear 后隔离）
};

// 核心调度：pump 函数
while (state.activeTaskIds.size < state.maxConcurrent && state.queue.length > 0) {
  const entry = state.queue.shift();
  const taskId = nextTaskId++;
  state.activeTaskIds.add(taskId);
  // 异步执行 task...
  // 完成后从 activeTaskIds 删除，再调用 pump
}
```

默认配置：
| Lane | 默认并发 | 说明 |
|------|---------|------|
| Main | 1 | 用户消息严格串行 |
| Cron | 1 | 定时任务默认串行，可配置 `cron.maxConcurrentRuns` |
| Subagent | 1 | 子代理串行 |
| Nested | 1 | 嵌套调用串行 |

```typescript
// 源码: src/gateway/server-startup.ts
setCommandLaneConcurrency(CommandLane.Cron, cfg.cron?.maxConcurrentRuns ?? 1);
```

## 🛡️ 关键机制

### Drain（排空）

Gateway 重启时，通过 `drain` 机制优雅等待当前任务完成：

```typescript
// 标记 Gateway 正在排空
markGatewayDraining();

// 新任务入队会抛出 GatewayDrainingError
const entry = queue.shift();
if (gatewayDraining) throw new GatewayDrainingError();
```

### Clear（清空）

Lane 可以被清空，正在排队的任务会被拒绝（`CommandLaneClearedError`），但正在执行的不会中断：

```typescript
clearCommandLane(lane);  // 清空指定 Lane
clearAllCommandLanes();  // 清空所有 Lane
```

### 代际隔离

每次 `clear` 后 `generation++`，旧代任务完成后不会 pump 新队列：

```typescript
const taskGeneration = state.generation;
// 任务完成时
if (completedCurrentGeneration) {
  pump();  // 只在同一代内 pump
}
```

## 📊 Lane vs Mutex vs Queue

| 机制 | 粒度 | 行为 | 适用场景 |
|------|------|------|---------|
| **Mutex** | 全局 | 同一时刻只有一个操作 | 太粗，浪费并发 |
| **Queue** | 全局 | 所有操作排队 | 太粗，不同 Session 不必要串行 |
| **Lane** | 多通道 | 同一 Lane 串行，不同 Lane 并行 | ✅ 粒度刚好 |
| **Lane+并发** | 多通道 | 同一 Lane 可配并发数 | ✅ 灵活性最高 |

```
Mutex: A → B → C → D → E → F   (全部串行)
Queue: A → B → C → D → E → F   (同上)
Lane:  Main:  A → D → F         (用户消息串行)
       Cron:  B → E             (定时任务串行)
       Sub:   C                  (子代理)
       → 三条 Lane 并行 ✅
Lane+: Main:  A → D → F         (concurrent=1)
       Cron:  [B,G] → [E,H]     (concurrent=2，两两并行)✅
```

## 💡 为何不用乐观锁

```
乐观锁：先并发执行，冲突时重试

LLM 场景的冲突代价极高：
  - 每次 LLM 调用花费 $0.01-0.30
  - 每次调用耗时 2-10 秒
  - 冲突重试 = 白花钱 + 用户等更久

串行化虽然排队，但不会浪费 LLM 调用。
```

---

下一篇：[插件优先架构](./plugin-first)