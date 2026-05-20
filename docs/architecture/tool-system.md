# Tool 工具系统

深入 OpenClaw 的工具系统，理解工具注册、安全策略、审批流程的完整实现。

## 🏗️ 工具架构

```
LLM 请求工具调用 (function_call)
    ↓
Tool Dispatcher (openclaw-tools.ts)
    ↓ 安全策略检查
    ├── Policy: deny → 拒绝
    ├── Policy: allowlist → 检查白名单
    └── Policy: full → 允许执行
    ↓ 审批检查（如需）
    ├── ExecApprovalManager → 等待用户审批
    └── 自动通过
    ↓ 执行工具
Tool Implementation
    ↓ 结果
Agent Loop (继续或返回)
```

## 📦 全部内置工具

源码位置：`src/agents/tools/`

| 工具 | 文件 | 说明 |
|------|------|------|
| **exec** | `bash-tools.ts` | Shell 命令执行（支持 gateway/sandbox/node 三种 host） |
| **read** | 内置 | 读取文件内容 |
| **write** | 内置 | 写入文件 |
| **edit** | 内置 | 精确文本替换 |
| **image** | `image-tool.ts` | 图片分析 |
| **image-generate** | `image-generate-tool.ts` | 图片生成 |
| **pdf** | `pdf-tool.ts` | PDF 分析 |
| **web_search** | `web-search.ts` | 网页搜索 |
| **web_fetch** | `web-fetch.ts` | URL 抓取 |
| **cron** | `cron-tool.ts` | 定时任务管理 |
| **message** | `message-tool.ts` | 消息发送 |
| **nodes** | `nodes-tool.ts` | Node 设备控制 |
| **canvas** | `canvas-tool.ts` | Canvas 渲染 |
| **gateway** | `gateway-tool.ts` | Gateway 配置管理 |
| **tts** | `tts-tool.ts` | 文本转语音 |
| **sessions_spawn** | `sessions-spawn-tool.ts` | 子代理生成 |
| **sessions_send** | `sessions-send-tool.ts` | 跨会话消息 |
| **sessions_list** | `sessions-list-tool.ts` | 会话列表 |
| **sessions_history** | `sessions-history-tool.ts` | 会话历史 |
| **sessions_yield** | `sessions-yield-tool.ts` | 让出当前轮 |
| **session_status** | `session-status-tool.ts` | 会话状态 |
| **subagents** | `subagents-tool.ts` | 子代理管理 |
| **agents_list** | `agents-list-tool.ts` | Agent 列表 |

## 🔐 安全策略体系

### 三级策略

```typescript
// 源码: src/config/types.tools.ts
type ExecToolConfig = {
  host?: "sandbox" | "gateway" | "node";   // 执行位置
  security?: "deny" | "allowlist" | "full"; // 安全模式
  ask?: "off" | "on-miss" | "always";      // 审批模式
  node?: string;                            // 默认 Node ID
  safeBins?: string[];                      // 安全二进制（stdin-only）
  strictInlineEval?: boolean;               // 严格内联求值审批
  timeoutSec?: number;                      // 超时时间
  backgroundMs?: number;                    // 后台化时间
  applyPatch?: {
    enabled?: boolean;                      // apply_patch 子工具
    workspaceOnly?: boolean;               // 限制工作区
    allowModels?: string[];                // 允许的模型
  };
};
```

| 安全模式 | 行为 |
|---------|------|
| `deny` | 拒绝所有执行请求 |
| `allowlist` | 白名单内的命令直接执行，其他需审批 |
| `full` | 所有命令直接执行（⚠️ 危险） |

| 审批模式 | 行为 |
|---------|------|
| `off` | 不请求审批 |
| `on-miss` | 不在白名单时请求审批 |
| `always` | 所有命令都需审批 |

### 工具白名单（Profile）

```typescript
type ToolProfileId = "minimal" | "coding" | "messaging" | "full";

type ToolsConfig = {
  profile?: ToolProfileId;         // 基础 Profile
  allow?: string[];                // 额外允许
  alsoAllow?: string[];            // 追加允许（不替换）
  deny?: string[];                 // 拒绝
  byProvider?: Record<string, {    // 按 Provider 覆盖
    profile?: ToolProfileId;
    allow?: string[];
    alsoAllow?: string[];
    deny?: string[];
  }>;
};
```

### 循环检测

```typescript
// 源码: src/config/types.tools.ts
type ToolLoopDetectionConfig = {
  enabled?: boolean;              // 启用循环检测（默认 false）
  historySize?: number;           // 历史大小（默认 30）
  warningThreshold?: number;      // 告警阈值（默认 10）
  criticalThreshold?: number;     // 临界阈值（默认 20）
  globalCircuitBreakerThreshold?: number;  // 全局熔断（默认 30）
  detectors?: {
    genericRepeat?: boolean;      // 重复调用检测
    knownPollNoProgress?: boolean; // 轮询无进展检测
    pingPong?: boolean;           // 乒乓交替检测
  };
};
```

### Sub-agent 工具策略

```typescript
type ToolsConfig = {
  subagents?: {
    model?: string | { primary?: string; fallbacks?: string[] };
    tools?: {
      allow?: string[];
      alsoAllow?: string[];
      deny?: string[];       // deny 赢：即使上层 allow，子代理 deny 也生效
    };
  };
};
```

### 文件系统限制

```typescript
type FsToolsConfig = {
  workspaceOnly?: boolean;  // 限制 read/write/edit 到工作区
};

type ToolsConfig = {
  fs?: FsToolsConfig;
};
```

## 🔧 Exec 审批流程

```typescript
// 源码: src/gateway/exec-approval-manager.ts
class ExecApprovalManager {
  // 创建审批请求
  create(request, timeoutMs, id?): ExecApprovalRecord;

  // 注册并等待审批
  register(record, timeoutMs): Promise<ExecApprovalDecision | null>;

  // 用户审批
  resolve(id, decision): void;

  // 超时 → 自动拒绝 (null)
}

type ExecApprovalRecord = {
  id: string;
  request: ExecApprovalRequestPayload;
  createdAtMs: number;
  expiresAtMs: number;
  requestedByConnId?: string;
  requestedByDeviceId?: string;
  decision?: ExecApprovalDecision;
  resolvedBy?: string;
};
```

流程：
```
LLM 请求执行命令
    ↓
security = allowlist, 命令不在白名单
    ↓
ask = on-miss → 需要审批
    ↓
创建 ExecApprovalRecord
    ↓
发送审批请求到用户 Channel
  "⚠️ exec 请求执行: rm -rf /tmp/test
   /approve 允许 | /deny 拒绝"
    ↓
用户回复 /approve → resolve(id, "allow")
用户回复 /deny → resolve(id, "deny")
超时 → resolve(id, null) → 自动拒绝
    ↓
根据决策执行或拒绝
```

## 💡 设计要点

### 1. 三层 Host 路由

```
exec 命令可路由到三种执行环境：
├── host=gateway → 本机直接执行（默认）
├── host=sandbox → Docker 容器内执行（隔离）
└── host=node → 远程设备执行（Node App）
```

### 2. Safe Bins（安全二进制）

```
safeBins: ["git", "ls", "cat"]
→ 这些命令允许流式 stdin，不需要 allowlist 条目
→ 但 strictInlineEval 可阻止 "python -c" 等内联形式
```

### 3. 优雅的后台化

```
命令执行超过 backgroundMs → 自动转入后台
→ 返回后台标识给 Agent
→ 命令完成后 notifyOnExit 通知 Agent
```

---

下一篇：[Cron 定时任务](./cron-system)