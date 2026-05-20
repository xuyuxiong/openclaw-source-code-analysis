# Gateway 核心

Gateway 是 OpenClaw 的主进程，负责一切：生命周期管理、通道连接、消息路由、Agent 编排。

## 🏗️ Gateway 启动流程

```
homiclaw gateway start
    │
    ├── 1. 加载配置 (config.yaml)
    │     └── 验证 Schema → 合并默认值 → 环境变量覆盖
    │
    ├── 2. 初始化状态 (State Store)
    │     └── 加载会话历史 → 迁移旧格式 → 恢复会话
    │
    ├── 3. 启动 RPC Server
    │     └── 监听 localhost:3272 → CLI 通信端口
    │
    ├── 4. 注册内置工具
    │     └── exec / read / write / web_search / image / cron / ...
    │
    ├── 5. 加载 Provider 插件
    │     └── OpenAI / Anthropic / Google / Ollama / ...
    │
    ├── 6. 加载 Channel 插件
    │     └── Telegram / Discord / WhatsApp / WebChat / ...
    │
    ├── 7. 启动 Cron Scheduler
    │     └── 加载定时任务 → 开始调度
    │
    ├── 8. 启动 Control UI (WebChat)
    │     └── 静态资源 → WebSocket
    │
    ├── 9. 启动 Node Service (设备管理)
    │     └── 配对 → 通知 → 摄像头/屏幕
    │
    └── 10. 启动 Heartbeat
          └── 定期检查 → 主动通知
```

## 🔑 核心数据结构

### Gateway State

```typescript
interface GatewayState {
  // 运行状态
  status: 'starting' | 'running' | 'stopping' | 'stopped'
  uptime: number
  pid: number

  // 通道状态
  channels: Map<string, ChannelStatus>

  // 会话索引
  sessions: Map<string, SessionState>

  // Provider 状态
  providers: Map<string, ProviderStatus>

  // 工具注册表
  tools: Map<string, ToolDefinition>

  // Cron 任务
  cronJobs: CronJob[]
}
```

### Session State

```typescript
interface SessionState {
  key: string              // 会话标识 (channel:user:id)
  channel: string          // 通道名
  model: string            // 当前模型
  history: Message[]       // 消息历史
  context: ContextWindow   // 上下文窗口
  toolResults: Map<string, ToolResult>  // 工具调用结果缓存
  createdAt: number
  lastActiveAt: number
  tokenUsage: TokenUsage   // Token 使用统计
  cost: number             // 费用
}
```

## 🔄 消息处理主循环

```typescript
// 简化的消息处理主循环
async function handleInboundMessage(message: InboundMessage) {
  // 1. 标准化消息
  const normalized = normalizeMessage(message)

  // 2. 路由到 Session
  const sessionKey = buildSessionKey(normalized)
  const session = getOrCreateSession(sessionKey)

  // 3. 入队 Lane Queue（串行化）
  await laneQueue.enqueue(sessionKey, async () => {
    // 4. 更新上下文
    session.context.addUserMessage(normalized)

    // 5. Agent 循环
    const response = await agentLoop.run(session)

    // 6. 发送回复
    await outboundHandler.send(response, session.channel)
  })
}
```

## 📊 配置系统

### 配置层级

```
环境变量 (最高优先级)
    ↓ 覆盖
命令行参数
    ↓ 覆盖
~/.homiclaw/config.yaml (用户配置)
    ↓ 合并
默认值 (最低优先级)
```

### 配置 Schema（核心字段）

```yaml
# Gateway
gateway:
  port: 3271                # WebChat 端口
  rpcPort: 3272             # RPC 端口

# Agents
agents:
  defaults:
    model: openai/gpt-4    # 默认模型
    thinking: off           # 思考模式

# Channels
channels:
  telegram:
    enabled: true
    botToken: xxx
  discord:
    enabled: false

# Providers
providers:
  openai:
    apiKey: sk-xxx
  anthropic:
    apiKey: sk-xxx

# Tools
tools:
  exec:
    enabled: true
    approval: allowlist     # allowlist / full / deny
  web_search:
    enabled: true

# Cron
cron:
  enabled: true
  maxJobs: 50
```

### 配置热更新

```bash
# 运行时修改配置（不打断 Gateway）
homiclaw config patch agents.defaults.model anthropic/claude-sonnet-4

# 查看当前配置
homiclaw config get agents.defaults.model
```

## 🛡️ 安全边界

Gateway 的安全策略分为多层：

```
┌──────────────────────────────────────┐
│           网络边界                    │
│  Gateway 只监听 localhost            │
│  不直接暴露到公网                    │
├──────────────────────────────────────┤
│           通道边界                    │
│  Channel Plugin 处理入站消息          │
│  消息标准化 → 去敏感字段             │
├──────────────────────────────────────┤
│           Lane Queue 边界            │
│  串行化避免并发写入                   │
│  单 Session 单写                     │
├──────────────────────────────────────┤
│           工具执行边界                │
│  Sandbox 隔离执行                    │
│  审批机制（allowlist / full / deny） │
├──────────────────────────────────────┤
│           Provider 边界              │
│  API Key 加密存储                    │
│  请求审计日志                        │
└──────────────────────────────────────┘
```

## 🐛 常见问题

### Q: Gateway 崩溃后会自动重启吗？

```
通过 systemd/launchd 管理 Gateway 时，崩溃后会自动重启。
homiclaw gateway start --daemon 会注册系统服务。
```

### Q: 如何查看 Gateway 占用的端口？

```bash
lsof -i :3271    # WebChat
lsof -i :3272    # RPC
```

### Q: 配置修改后需要重启吗？

```
使用 homiclaw config patch 修改的配置会热更新，
不需要重启 Gateway。只有通道启停需要重启。
```

---

下一篇：[Session 会话系统](./session-system)