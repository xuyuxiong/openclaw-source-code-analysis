# Cron 定时任务

深入 OpenClaw 的 Cron 调度系统，理解定时任务、唤醒事件、通知策略的完整实现。

## 🏗️ 架构总览

```
┌─────────────────────────────────────────┐
│            Cron Scheduler               │
│                                         │
│  ┌──────────┐  ┌──────────┐            │
│  │ Job Store │  │ Timer    │            │
│  │ (JSON)   │  │ Manager  │            │
│  └────┬─────┘  └────┬─────┘            │
│       │              │                  │
│       ↓              ↓                  │
│  ┌─────────────────────────┐            │
│  │     Job Executor        │            │
│  │  ┌─────┐ ┌────────────┐ │            │
│  │  │isol.│ │  wake      │ │            │
│  │  │sess.│ │  event     │ │            │
│  │  └─────┘ └────────────┘ │            │
│  └─────────────────────────┘            │
│       │                                 │
│       ↓                                 │
│  ┌─────────────────────────┐            │
│  │  Notification Manager   │            │
│  │  chat / dingtalk / none │            │
│  └─────────────────────────┘            │
└─────────────────────────────────────────┘
```

## 📦 Job 数据结构

```typescript
interface CronJob {
  jobId: string                       // 唯一 ID

  // 调度
  schedule: {
    kind: 'at' | 'every' | 'cron'
    at?: string                       // ISO-8601 时间 (kind=at)
    everyMs?: number                  // 间隔毫秒 (kind=every)
    expr?: string                     // cron 表达式 (kind=cron)
    tz?: string                       // 时区
  }

  // 执行
  payload: {
    kind: 'agentTurn'                 // 目前仅支持 agentTurn
    message: string                   // Agent 提示词
    model?: string                    // 可选模型
    timeoutSeconds?: number           // 超时
  }

  // 会话
  sessionTarget: 'isolated'           // 隔离会话

  // 通知
  delivery: { mode: 'none' }

  // 状态
  enabled: boolean
  lastRunAt?: number
  nextRunAt?: number
  runCount: number
}
```

## 🔄 调度类型

### 1. 一次性 (at)

```typescript
// 5 分钟后提醒
{
  schedule: { kind: 'at', at: '2026-05-20T12:30:00+08:00' },
  payload: { kind: 'agentTurn', message: '提醒用户开会' },
  sessionTarget: 'isolated',
  delivery: { mode: 'none' },
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
  delivery: { mode: 'none' },
  enabled: true
}
```

### 3. Cron 表达式 (cron)

```typescript
// 每周一早上 9 点
{
  schedule: { kind: 'cron', expr: '0 9 * * 1', tz: 'Asia/Shanghai' },
  payload: { kind: 'agentTurn', message: '生成本周工作计划' },
  sessionTarget: 'isolated',
  delivery: { mode: 'none' },
  enabled: true
}
```

## 🔧 执行流程

```
Timer 触发
    ↓
加载 Job 配置
    ↓
创建隔离 Session (isolated)
    ↓
系统注入通知标记 [notifyMode:xxx]
    ↓
调用 Agent Loop 执行 payload.message
    ↓
Agent 完成任务
    ↓
解析 [notifyMode:xxx] 标记
    ↓
├── [notifyMode:chat] → 推送到聊天会话
├── [notifyMode:all] → 推送聊天 + 钉钉通知
├── [notifyMode:dingtalk] → 仅钉钉通知
└── [notifyMode:none] → 仅桌面通知
    ↓
更新 Job 状态 (lastRunAt, runCount)
    ↓
计算下次执行时间 (nextRunAt)
```

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
```

## 🐛 常见问题

### Q: 定时任务执行失败会重试吗？

```
不会自动重试。可以通过 run 命令手动触发。
```

### Q: Gateway 重启后定时任务还在吗？

```
在。定时任务持久化在 JSON 文件中，
Gateway 重启后自动加载并恢复调度。
```

---

下一篇：[Node 设备系统](./node-system)