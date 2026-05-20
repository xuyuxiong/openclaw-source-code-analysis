# Cron 定时任务

深入 OpenClaw 的 Cron 调度系统，理解定时任务、唤醒事件、通知策略的完整实现。

## 🏗️ 架构总览

```
┌──────────────────────────────────────────────┐
│            Cron Service (service.ts)          │
│                                               │
│  ┌──────────┐  ┌─────────────┐              │
│  │ Job Store │  │ Timer       │              │
│  │ (JSON)   │  │ (croner)    │              │
│  └────┬─────┘  └──────┬──────┘              │
│       │               │                      │
│       ↓               ↓                      │
│  ┌──────────────────────────────┐            │
│  │   Cron Lane (CommandQueue)   │            │
│  │   maxConcurrentRuns 控制     │            │
│  └──────────────┬───────────────┘            │
│                 ↓                             │
│  ┌──────────────────────────────┐            │
│  │   Isolated Agent Runner      │            │
│  │  ┌──────────┐ ┌───────────┐ │            │
│  │  │Skill     │ │Model      │ │            │
│  │  │Snapshot  │ │Selection  │ │            │
│  │  └──────────┘ └───────────┘ │            │
│  └──────────────┬───────────────┘            │
│                 ↓                             │
│  ┌──────────────────────────────┐            │
│  │   Delivery Dispatcher         │            │
│  │   none / announce / webhook  │            │
│  └──────────────┬───────────────┘            │
│                 ↓                             │
│  ┌──────────────────────────────┐            │
│  │   Run Log (JSONL) + Reaper   │            │
│  │   sessionRetention 清理       │            │
│  └──────────────────────────────┘            │
└──────────────────────────────────────────────┘
```

## 📦 Job 数据结构

```typescript
// 源码: src/cron/types-shared.ts
interface CronJobBase<TSchedule, TSessionTarget, TWakeMode, TPayload, TDelivery, TFailureAlert> {
  id: string                             // 唯一 ID
  agentId?: string                       // 多 Agent 时的 Agent ID
  sessionKey?: string                    // 关联 Session
  name: string                           // 人类可读名称
  description?: string                   // 描述
  enabled: boolean                       // 是否启用
  deleteAfterRun?: boolean               // 一次性任务运行后自动删除
  createdAtMs: number                    // 创建时间
  updatedAtMs: number                    // 更新时间
  schedule: TSchedule                    // 调度配置
  sessionTarget: TSessionTarget          // 会话目标
  wakeMode: TWakeMode                    // 唤醒模式
  payload: TPayload                      // 执行载荷
  delivery?: TDelivery                   // 投递配置
  failureAlert?: TFailureAlert           // 失败告警
}

// 调度类型
type CronSchedule =
  | { kind: 'at'; at: string }                              // 一次性
  | { kind: 'every'; everyMs: number; anchorMs?: number }    // 固定间隔
  | { kind: 'cron'; expr: string; tz?: string; staggerMs?: number }  // Cron 表达式

// 会话目标（4种模式）
type CronSessionTarget = 'main' | 'isolated' | 'current' | `session:${string}`

// 唤醒模式
type CronWakeMode = 'next-heartbeat' | 'now'

// 投递模式（3种）
type CronDeliveryMode = 'none' | 'announce' | 'webhook'

// 投递配置
type CronDelivery = {
  mode: CronDeliveryMode
  channel?: ChannelId | 'last'       // 投递通道
  to?: string                        // 投递目标
  accountId?: string                 // 多账号时的账户 ID
  bestEffort?: boolean               // 最佳努力发送
}

// 失败重试配置
type CronRetryConfig = {
  maxAttempts?: number;              // 最大重试次数，默认 3
  backoffMs?: number[];              // 退避延迟，默认 [30000, 60000, 300000]
  retryOn?: CronRetryOn[];           // 触发重试的错误类型
}
type CronRetryOn = 'rate_limit' | 'overloaded' | 'network' | 'timeout' | 'server_error';
```

## 🔄 调度类型

### 1. 一次性 (at)

```typescript
// 5 分钟后提醒，运行后自动删除
{
  schedule: { kind: 'at', at: '2026-05-20T12:30:00+08:00' },
  payload: { kind: 'agentTurn', message: '提醒用户开会' },
  sessionTarget: 'isolated',
  wakeMode: 'now',
  delivery: { mode: 'none' },
  deleteAfterRun: true,
  enabled: true
}
```

### 2. 固定间隔 (every)

```typescript
// 每 30 分钟检查一次
{
  schedule: { kind: 'every', everyMs: 30 * 60 * 1000 },
  payload: { kind: 'agentTurn', message: '检查邮箱是否有新邮件' },
  sessionTarget: 'isolated',
  wakeMode: 'now',
  delivery: { mode: 'none' },
  enabled: true
}
```

### 3. Cron 表达式 (cron)

```typescript
// 每周一早上 9 点（基于 croner 库）
{
  schedule: { kind: 'cron', expr: '0 9 * * 1', tz: 'Asia/Shanghai', staggerMs: 0 },
  payload: { kind: 'agentTurn', message: '生成本周工作计划' },
  sessionTarget: 'isolated',
  wakeMode: 'now',
  delivery: { mode: 'announce' },
  enabled: true
}
```

Cron 表达式使用 [croner](https://github.com/hexagon/croner) 库解析，支持标准 5 字段和 6 字段表达式。

`staggerMs` 参数可为同一 cron 表达式的多实例添加确定性延迟窗口，避免多个 Gateway 实例同时触发。

## 🔧 执行流程

```
Cron Timer 触发 (croner 库计算 nextRunAt)
    ↓
加载 Job 配置 (JSON Store)
    ↓
├── sessionTarget=isolated → 创建隔离 Session (Cron Lane)
├── sessionTarget=main → 唤醒主 Session
├── sessionTarget=current → 当前 Session
└── sessionTarget=session:xxx → 指定 Session
    ↓
wakeMode 决定唤醒策略
├── now → 立即触发 Agent Turn
└── next-heartbeat → 等待下次心跳轮询
    ↓
调用 Agent Loop 执行 payload.message
(通过 Cron Lane 排队，支持 maxConcurrentRuns 并发)
    ↓
Agent 完成任务 → 生成结果
    ↓
Delivery 投递
├── mode=none → 不投递（仅桌面通知）
├── mode=announce → 通过 Channel 推送消息
└── mode=webhook → HTTP POST 到指定 URL
    ↓
投递失败处理
├── failureDestination → 转发到备选目标
└── failureAlert → 连续失败 N 次后告警
    ↓
更新 Job 状态 (lastRunAt, nextRunAt, runCount)
    ↓
清理过期 Session (sessionRetention 配置)
    ↓
记录 Run Log (JSONL, 带 maxBytes/keepLines 轮转)
```

### 并发控制

Cron 任务在独立的 `CommandLane.Cron` 中执行，通过 `maxConcurrentRuns` 控制并发数：

```typescript
// 源码: src/gateway/server-lanes.ts → server-startup.ts
setCommandLaneConcurrency(CommandLane.Cron, cfg.cron?.maxConcurrentRuns ?? 1);
```

默认并发为 1（串行），可配置为更高值允许同时执行多个 Cron 任务。

## 💡 设计决策

### 为什么用 isolated Session？

```
定时任务不应干扰用户正在进行的对话。
isolated Session 是临时的，执行完即销毁。
不会污染用户 Session 的消息历史和上下文。
```

### 为什么通过 Agent Turn 执行？

```
1. Agent 可以使用工具（搜索、发消息等）
2. Agent 有完整的 System Prompt（SOUL.md / USER.md）
3. Agent 有工作区上下文
4. 支持多轮工具调用
5. 可选择模型（model 字段）
6. 技能快照（skills-snapshot）确保执行时技能可用
```

### 失败重试机制

```typescript
// 源码: src/config/types.cron.ts
type CronRetryConfig = {
  maxAttempts?: number;          // 最大重试次数，默认 3
  backoffMs?: number[];          // 退避延迟，默认 [30000, 60000, 300000]
  retryOn?: CronRetryOn[];       // 触发重试的错误类型
};

type CronRetryOn = 'rate_limit' | 'overloaded' | 'network' | 'timeout' | 'server_error';
```

一次性任务（`kind=at`）遇到瞬时错误时会自动重试，支持指数退避。

### Session 清理

```typescript
// 源码: src/config/types.cron.ts
type CronConfig = {
  sessionRetention?: string | false;  // 默认 "24h"
  runLog?: {
    maxBytes?: number | string;       // 默认 2_000_000 (~2MB)
    keepLines?: number;               // 默认 2000
  };
};
```

## 🐛 常见问题

### Q: 定时任务执行失败会重试吗？

```
一次性任务（kind=at）遇到瞬时错误会自动重试：
- rate_limit（429）
- overloaded（503）
- network（网络错误）
- timeout（超时）
- server_error（5xx）

退避策略：30s → 60s → 300s，最多重试 3 次。
可通过 retry.maxAttempts 和 retry.backoffMs 配置。

周期性任务（kind=every/cron）不自动重试，
下次调度时间到了会重新执行。
可通过 failureAlert 配置连续失败告警。
```

### Q: Gateway 重启后定时任务还在吗？

```
在。Cron 任务持久化在 state/cron-jobs.json 中。
Gateway 重启后：
1. 加载所有 Job 定义
2. 重新计算 nextRunAt（通过 croner 库）
3. 恢复 Timer 调度
4. 未执行的 at 类任务仍会触发
```

### Q: delivery 的三种模式有什么区别？

| 模式 | 行为 | 场景 |
|------|------|------|
| `none` | 不推送结果到任何通道 | 内部检查、静默任务 |
| `announce` | 通过 Channel 推送消息给用户 | 需要通知用户的任务 |
| `webhook` | HTTP POST 到指定 URL | 集成外部系统 |

---

下一篇：[Node 设备系统](./node-system)