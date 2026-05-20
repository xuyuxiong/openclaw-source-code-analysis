# 整体架构

深入 OpenClaw 的整体架构设计，理解 Gateway 模式、消息流、模块关系。

## 🏗️ 架构全景

OpenClaw 采用 **Hub-and-Spoke**（中心辐射）架构：一个 Gateway 守护进程作为中心，连接所有消息通道和 LLM 提供者。

```
                    ┌──────────────── 用户 ────────────────┐
                    │                                      │
     Telegram ──────┤                                      │
     Discord ───────┤                                      │
     WhatsApp ──────┤                                      │
     Signal ────────┤                                      │
     Slack ─────────┤                                      │
     WebChat ───────┤         ┌─────────────────────┐     │
     iMessage ──────┼─────────│    OpenClaw Gateway  │─────┘
                    │         │                       │
                    │         │  ┌─── Lane Queue ──┐  │
                    │         │  │  串行消息处理     │  │
                    │         │  └────────┬────────┘  │
                    │         │           ↓            │
                    │         │  ┌─── Agent RT ────┐  │
                    │         │  │  会话 · 上下文   │  │
                    │         │  │  工具 · 子代理   │  │
                    │         │  └────────┬────────┘  │
                    │         │           ↓            │
                    │         │  ┌─── Tools ───────┐  │
                    │         │  │ exec · read     │  │
                    │         │  │ write · search  │  │
                    │         │  │ image · cron    │  │
                    │         │  └─────────────────┘  │
                    │         │                       │
                    │         └───────────┬───────────┘
                    │                     │
          ┌─────────┼─────────┬──────────┼──────────┐
          ↓         ↓         ↓          ↓          ↓
      ┌────────┐┌────────┐┌────────┐┌────────┐┌────────┐
      │ OpenAI ││Anthropic││ Google ││ Ollama ││ Mistral│
      └────────┘└────────┘└────────┘└────────┘└────────┘
                        LLM Providers
```

## 📐 设计原则

### 1. 单 Gateway 单写

一个 Gateway 进程管理所有通道，对同一个 Session **串行写入**（Lane Queue），避免并发冲突。

### 2. 插件优先

Provider、Channel、Tool 全部是插件，核心不硬编码任何第三方依赖。

### 3. 进程隔离

Gateway 主进程负责路由和编排，工具执行在沙箱中，LLM 调用走网络，权限边界清晰。

### 4. 本地优先

所有状态持久化在本地文件系统，不依赖外部数据库或云服务。

## 🔄 核心数据流

### 1. 消息入站流

```
Telegram Bot
    ↓ onMessage
Channel Plugin (消息标准化)
    ↓ normalize
Inbound Handler (路由到 Session)
    ↓ route
Lane Queue (排队)
    ↓ dequeue (串行)
Agent Loop (处理消息)
    ↓
LLM Provider (调用模型)
    ↓
Tool Call (如果需要)
    ↓
Reply (生成回复)
    ↓
Outbound Handler
    ↓
Channel Plugin (发送回复)
    ↓
Telegram API (发回用户)
```

### 2. Agent 循环流

```
用户消息
    ↓
构建上下文 (System Prompt + History + Workspace Files)
    ↓
调用 LLM
    ↓
收到响应
    ├── 纯文本 → 直接回复
    ├── Tool Call → 执行工具 → 回到"调用 LLM"
    └── 多轮 Tool Call → 循环直到纯文本响应
```

### 3. 工具调用流

```
LLM 返回 Tool Call
    ↓
Tool Dispatcher (路由到具体工具)
    ↓
权限检查 (Policy)
    ├── 允许 → 沙箱执行 → 返回结果
    ├── 审批 → 请求用户批准 → 执行/拒绝
    └── 禁止 → 返回错误
    ↓
结果附加到上下文
    ↓
继续 Agent 循环
```

## 📦 模块依赖

```
┌────────────────────────────────────────────────────────┐
│                       CLI (homiclaw)                   │
│  start / stop / status / onboard / config / update     │
├────────────────────────────────────────────────────────┤
│                     Gateway Core                       │
│                                                        │
│  ┌──────────┐ ┌──────────┐ ┌───────────┐ ┌─────────┐ │
│  │ Lane     │ │ Session  │ │ Agent     │ │ Cron    │ │
│  │ Queue    │ │ Manager  │ │ Runtime   │ │ Scheduler│ │
│  └──────────┘ └──────────┘ └───────────┘ └─────────┘ │
│  ┌──────────┐ ┌──────────┐ ┌───────────┐ ┌─────────┐ │
│  │ Tool     │ │ Provider │ │ Node      │ │ Heartbeat│ │
│  │ Dispatch │ │ Manager  │ │ Manager   │ │ System  │ │
│  └──────────┘ └──────────┘ └───────────┘ └─────────┘ │
├────────────────────────────────────────────────────────┤
│                   Plugin SDK (接口层)                   │
│  ChannelPlugin / ProviderPlugin / ToolDefinition      │
├────────────────────────────────────────────────────────┤
│                  Infrastructure                        │
│  Config / State / RPC / Logger / Sandbox / Audit      │
└────────────────────────────────────────────────────────┘
         ↑                   ↑                   ↑
    Channel Plugins    Provider Plugins    Tool Implementations
    (Telegram, etc.)   (OpenAI, etc.)     (exec, read, etc.)
```

## 🔑 关键抽象

### Channel Plugin（通道插件）

```typescript
interface ChannelPlugin {
  name: string                              // 通道标识
  start(gateway: Gateway): Promise<void>    // 启动连接
  stop(): Promise<void>                     // 断开连接
  send(message: OutboundMessage): Promise<void>  // 发送消息
  onMessage(handler: InboundHandler): void  // 注册入站回调
}
```

### Provider Plugin（提供者插件）

```typescript
interface ProviderPlugin {
  name: string                              // 提供者标识
  models: ModelDefinition[]                 // 支持的模型列表
  complete(request: CompletionRequest): Promise<CompletionResponse>  // 补全
  completeStream(request: CompletionRequest): AsyncIterable<Chunk>   // 流式
}
```

### Tool Definition（工具定义）

```typescript
interface ToolDefinition {
  name: string                              // 工具名
  description: string                       // 工具描述
  parameters: JSONSchema                    // 参数 Schema
  execute(params: any, context: ToolContext): Promise<ToolResult>
}
```

## 📊 并发模型

```
Gateway (单进程)
    │
    ├── Lane 1 (Telegram:UserA) ── 串行 ──────┐
    │     └── Agent Turn 1 → Tool → Agent Turn 2│
    │                                           │ ← 同一用户的
    ├── Lane 2 (Discord:UserB) ── 串行 ──────┐ │   消息串行处理
    │     └── Agent Turn 1                    │ │
    │                                         │ │
    ├── Lane 3 (WebChat:UserC) ── 串行 ────┐ │ │
    │     └── Agent Turn 1                  │ │ │
    │                                       │ │ │
    └── Tool Execution (沙箱, 并行) ────────┘─┘─┘
```

**核心规则**：同一 Session 的消息串行处理（Lane Queue），不同 Session 之间并行。

---

下一篇：[Gateway 核心](./gateway-core)