# Lane Queue 命令队列

Lane Queue 是 OpenClaw 最核心的并发控制机制，确保同一 Lane 中的消息串行处理，避免竞态条件。

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

## 🏗️ 四条 Lane

源码定义了 4 条 Lane（`src/process/lanes.ts`）：

```typescript
export const enum CommandLane {
  Main = "main",         // 主会话：用户消息、自动回复
  Cron = "cron",         // 定时任务：Cron 执行
  Subagent = "subagent", // 子代理：spawn 的独立执行
  Nested = "nested",     // 嵌套调用：工具内部的二次调用
}
```

```
Main Lane:    用户消息 → Agent 回复 → 工具调用 → ...  (串行)
Cron Lane:    定时任务1 → 定时任务2 → ...             (串行，可配置并发)
Subagent Lane: 子代理1 → 子代理2 → ...               (串行)
Nested Lane:  嵌套调用排队                             (串行)

不同 Lane 之间并行执行 ✅
同一 Lane 内部串行执行 ✅（可配置 maxConcurrent 并发）
```

## 🔧 源码实现

### 核心数据结构

```typescript
// 源码: src/process/command-queue.ts
type LaneState = {
  lane: string;
  queue: QueueEntry[];        // 等待队列
  activeTaskIds: Set<number>;  // 正在执行的任务 ID
  maxConcurrent: number;       // 最大并发数（默认 1）
  draining: boolean;           // 是否正在排空
  generation: number;          // 代际计数（clear 后递增，隔离旧任务）
};

type QueueEntry = {
  task: () => Promise<unknown>;
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
  enqueuedAt: number;          // 入队时间戳
  warnAfterMs: number;         // 排队超时告警阈值
  onWait?: (waitMs: number, queuedAhead: number) => void;  // 排队回调
};
```

### 核心调度：pump 函数

```typescript
function drainLane(lane: string) {
  const state = getLaneState(lane);
  const pump = () => {
    while (state.activeTaskIds.size < state.maxConcurrent && state.queue.length > 0) {
      const entry = state.queue.shift();
      const taskId = nextTaskId++;
      state.activeTaskIds.add(taskId);
      // 异步执行 task...
      void (async () => {
        try {
          const result = await entry.task();
          entry.resolve(result);
        } catch (err) {
          entry.reject(err);
        } finally {
          state.activeTaskIds.delete(taskId);
          pump(); // 任务完成后继续 pump
        }
      })();
    }
  };
  pump();
}
```

### 动态并发控制

```typescript
// 可在运行时调整并发数
function setCommandLaneConcurrency(lane: string, maxConcurrent: number) {
  const state = getLaneState(lane);
  state.maxConcurrent = Math.max(1, Math.floor(maxConcurrent));
  drainLane(lane); // 立即尝试 pump
}

// 源码: src/gateway/server-startup.ts
setCommandLaneConcurrency(CommandLane.Cron, cfg.cron?.maxConcurrentRuns ?? 1);
```

## 🛡️ 关键机制

### Drain（优雅排空）

Gateway 重启时，通过 drain 机制优雅等待当前任务完成：

```typescript
// 标记 Gateway 正在排空
markGatewayDraining();

// 新任务入队会抛出 GatewayDrainingError
class GatewayDrainingError extends Error {
  constructor() {
    super("Gateway is draining for restart; new tasks are not accepted");
  }
}
```

### Clear（清空队列）

Lane 可以被清空，正在排队的任务会被拒绝，但**正在执行的不会中断**：

```typescript
class CommandLaneClearedError extends Error {
  constructor(lane?: string) {
    super(lane ? `Command lane "${lane}" cleared` : "Command lane cleared");
  }
}

clearCommandLane(lane);  // 清空指定 Lane
clearAllCommandLanes();  // 清空所有 Lane
```

### 代际隔离（Generation）

每次 `clear` 后 `generation++`，旧代任务完成后不会 pump 新队列，避免新旧任务混淆：

```typescript
const taskGeneration = state.generation;
// 任务完成时
const completedCurrentGeneration = completeTask(state, taskId, taskGeneration);
if (completedCurrentGeneration) {
  pump();  // 只在同一代内 pump
}
```

## 📊 并发默认值

| Lane | 默认并发 | 说明 | 配置 |
|------|---------|------|------|
| Main | 1 | 用户消息严格串行 | 不可修改 |
| Cron | 1 | 定时任务默认串行 | `cron.maxConcurrentRuns` |
| Subagent | 1 | 子代理串行 | 不可修改 |
| Nested | 1 | 嵌套调用串行 | 不可修改 |

## 📊 对比

| 机制 | 粒度 | 行为 | 适用场景 |
|------|------|------|---------|
| **Mutex** | 全局 | 同一时刻只有一个操作 | 太粗，浪费并发 |
| **Queue** | 全局 | 所有操作排队 | 太粗，不同职责不必要串行 |
| **Lane** | 4 通道 | 同一 Lane 串行，不同 Lane 并行 | ✅ 粒度刚好 |
| **Lane+并发** | 4 通道 | 同一 Lane 可配并发数 | ✅ 灵活性最高 |

## 🐛 常见问题

### Q: 为什么 Cron Lane 的默认并发是 1？

```
定时任务通常涉及文件操作和 LLM 调用。
如果并发执行多个 Cron 任务：
1. 多个 LLM 调用同时进行，增加 API 费用
2. 文件操作可能出现竞态
3. 系统资源消耗增加

如果需要并发（如多个独立的定时任务），
可以配置 cron.maxConcurrentRuns。
```

### Q: Gateway 重启时正在执行的任务怎么办？

```
正在执行的任务会被等待完成（drain）。
排队中的任务会被丢弃（GatewayDrainingError）。
Gateway 重启后，Cron 任务会重新调度，
但丢失的排队任务不会自动重试。
```

---

下一篇：[Provider 提供者系统](./provider-system)