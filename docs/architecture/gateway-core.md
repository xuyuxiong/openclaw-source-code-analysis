# Gateway Core 架构详解

Gateway Core 是 OpenClaw 的核心运行时，负责管理所有消息流、Agent 执行和系统资源。

## 🎯 设计目标

- **单一端口**：通过一个端口处理所有 WebSocket 和 HTTP 请求
- **高并发**：支持数千个并发连接
- **零停机**：支持配置热重载
- **安全隔离**：多层安全边界保护

## 🔧 核心组件

### 1. 网络层 (Port 18789)

#### 多路复用设计
- **单一端口**：18789 处理所有流量
- **协议升级**：HTTP → WebSocket 自动升级
- **路径路由**：
  - `/` - Control UI
  - `/ws` - WebSocket API
  - `/v1/chat/completions` - OpenAI兼容API
  - `/v1/responses` - OpenResponses API

#### 绑定模式
```typescript
type GatewayBindMode = 
  | "auto"      // 自动选择（回环优先）
  | "lan"       // 局域网绑定
  | "loopback"  // 仅本地
  | "custom"    // 自定义IP
  | "tailnet"   // Tailscale网络
```

### 2. Lane队列系统

#### 4条执行Lane
```typescript
export const enum CommandLane {
  Main = "main",      // 主用户交互
  Cron = "cron",      // 定时任务
  Subagent = "subagent",  // 子代理
  Nested = "nested"   // 嵌套调用
}
```

#### Lane调度策略
- **Main Lane**：用户消息，最高优先级
- **Cron Lane**：定时任务，后台执行
- **Subagent Lane**：子代理调用，独立执行
- **Nested Lane**：嵌套调用，避免继承Cron上下文

#### 队列管理
- **并发控制**：每条Lane独立并发限制
- **优先级**：Main > Subagent > Nested > Cron
- **隔离性**：Lane间完全隔离，避免相互影响

### 3. Agent Runtime

#### Agent循环
```typescript
AgentLoop {
  1. 接收消息
  2. 构建系统提示
  3. LLM调用
  4. 工具调用（如有）
  5. 响应处理
  6. 上下文压缩
}
```

#### 上下文管理
- **Compaction**：动态上下文压缩
- **Token管理**：基于模型限制的token管理
- **会话状态**：跨消息的持久化状态

### 4. 会话系统

#### 会话标识
- **复合键**：`accountId:channel:threadId`
- **标准化**：统一处理不同通道的ID格式
- **跨通道**：支持跨通道路由

#### 会话生命周期
1. **创建**：首次消息创建会话
2. **激活**：消息处理时激活
3. **空闲**：超时后进入空闲状态
4. **清理**：长时间空闲后清理

## 🛡️ 安全架构

### 1. 认证授权

#### 认证模式
```typescript
type GatewayAuthMode = 
  | "none"      // 无认证
  | "token"     // 令牌认证
  | "password"  // 密码认证
  | "trusted-proxy"  // 受信代理
```

#### 认证配置
```typescript
interface GatewayAuthConfig {
  mode: GatewayAuthMode
  token?: SecretInput
  password?: SecretInput
  allowTailscale?: boolean
  rateLimit?: {
    maxAttempts: number
    windowMs: number
    lockoutMs: number
  }
}
```

### 2. 工具安全

#### 执行边界
- **沙箱执行**：隔离的工具运行环境
- **权限控制**：allow/deny列表机制
- **审批流程**：可配置的审批策略

#### 安全检查
- **路径限制**：工作目录限制
- **命令白名单**：只允许预定义命令
- **超时保护**：防止长时间运行

### 3. 网络安全

#### TLS配置
```typescript
interface GatewayTlsConfig {
  enabled: boolean
  autoGenerate: boolean
  certPath?: string
  keyPath?: string
  caPath?: string
}
```

#### 安全头
- **HSTS**：HTTP严格传输安全
- **CORS**：跨域资源共享控制
- **CSP**：内容安全策略

## 🔄 配置系统

### 1. 配置层级

```typescript
// 优先级从高到低
1. 环境变量 (OPENCLAW_*)
2. 命令行参数
3. 用户配置文件 (~/.openclaw/config.json5)
4. 默认值
```

### 2. 热重载

#### 重载模式
```typescript
type GatewayReloadMode = 
  | "off"      // 禁用重载
  | "restart"  // 重启进程
  | "hot"      // 热重载
  | "hybrid"   // 混合模式
```

#### 重载流程
1. **检测变化**：文件系统监控
2. **验证配置**：类型安全验证
3. **应用配置**：无中断更新
4. **回滚机制**：失败时自动回滚

### 3. 配置验证

#### 运行时验证
- **类型检查**：TypeScript类型验证
- **值域检查**：配置值范围验证
- **依赖检查**：配置依赖关系验证

## 📊 监控和指标

### 1. 运行时指标

#### 连接指标
- **活跃连接数**：当前WebSocket连接数
- **消息吞吐量**：每秒消息数
- **响应延迟**：消息处理延迟

#### 系统指标
- **内存使用**：堆内存使用情况
- **CPU使用**：CPU使用率
- **文件描述符**：打开的文件数

### 2. 健康检查

#### HTTP端点
- **/health** - 基础健康检查
- **/health/detailed** - 详细健康状态
- **/metrics** - Prometheus指标

#### 通道健康
- **连接状态**：通道连接状态
- **消息队列**：队列长度和延迟
- **错误率**：通道错误率

## 🚀 部署模式

### 1. 本地部署
```bash
# 开发模式
openclaw gateway --bind loopback

# 生产模式
openclaw gateway --bind lan --tls
```

### 2. 容器部署
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 18789
CMD ["openclaw", "gateway"]
```

### 3. 云部署

#### Cloudflare Workers
- **无服务器**：自动扩缩容
- **全球部署**：就近访问
- **零配置**：自动HTTPS

#### 自托管
- **Docker**：容器化部署
- **Kubernetes**：集群部署
- **Systemd**：系统服务

## 🔧 故障排除

### 1. 常见问题

#### 端口冲突
```bash
# 检查端口占用
lsof -i :18789

# 修改端口
openclaw gateway --port 8080
```

#### 认证失败
```bash
# 检查token
openclaw config get gateway.auth.token

# 重置token
openclaw config set gateway.auth.token new-token
```

### 2. 调试工具

#### 日志级别
```bash
# 调试模式
DEBUG=openclaw:* openclaw gateway

# 详细日志
openclaw gateway --verbose
```

#### 性能分析
```bash
# CPU分析
node --prof openclaw gateway

# 内存分析
node --inspect openclaw gateway
```

## 📚 相关文档

- [Agent Runtime 架构](../runtime/agent-runtime.md)
- [通道系统概述](../channel/overview.md)
- [配置系统详解](../advanced/configuration.md)
- [部署指南](../deploy/overview.md)
- [安全配置](../advanced/security.md)