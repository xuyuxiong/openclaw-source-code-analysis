# Node System 架构

OpenClaw 的 Node System 提供了分布式计算能力，允许在多个节点上运行 Agent 和工具，实现负载均衡和高可用。

## 🎯 设计目标

- **分布式执行**：跨节点执行 Agent 和工具
- **负载均衡**：智能路由到最优节点
- **故障转移**：节点故障时自动切换
- **资源隔离**：节点间资源隔离

## 🔧 核心概念

### 1. 节点类型

#### 本地节点
- **定义**：运行在同一台机器上的节点
- **特点**：低延迟，共享文件系统
- **用途**：开发测试，单机部署

#### 远程节点
- **定义**：运行在远程机器上的节点
- **特点**：高延迟，独立文件系统
- **用途**：生产环境，横向扩展

#### 浏览器节点
- **定义**：运行在浏览器中的节点
- **特点**：无服务器，按需启动
- **用途**：边缘计算，客户端执行

### 2. 节点发现

#### 发现机制
```typescript
interface NodeDiscovery {
  mdns: {
    mode: "off" | "minimal" | "full"
  }
  wideArea: {
    enabled: boolean
    domain?: string
  }
}
```

#### 发现流程
1. **mDNS广播**：本地网络节点发现
2. **DNS-SD**：广域网节点发现
3. **手动配置**：静态节点配置
4. **API注册**：通过API注册节点

### 3. 节点路由

#### 路由策略
```typescript
interface NodeRouting {
  browser: {
    mode: "auto" | "manual" | "off"
    node?: string
  }
}
```

#### 路由算法
- **就近原则**：选择延迟最低的节点
- **负载均衡**：选择负载最低的节点
- **功能匹配**：选择支持所需功能的节点
- **故障转移**：节点故障时自动切换

## 🏗️ 架构组件

### 1. 节点管理器

#### 节点注册
```typescript
interface NodeRegistration {
  id: string
  name: string
  type: "local" | "remote" | "browser"
  capabilities: string[]
  status: "online" | "offline" | "busy"
  load: number
  latency: number
}
```

#### 节点状态
- **在线**：节点可用
- **离线**：节点不可用
- **忙碌**：节点负载高
- **维护**：节点维护中

### 2. 任务调度器

#### 任务类型
- **Agent执行**：运行Agent循环
- **工具调用**：执行工具命令
- **文件操作**：文件读写操作
- **网络请求**：外部API调用

#### 调度策略
- **轮询**：简单的轮询调度
- **权重**：基于节点能力的权重调度
- **最少连接**：选择连接数最少的节点
- **一致性哈希**：保证相同任务路由到相同节点

### 3. 通信层

#### 通信协议
- **WebSocket**：实时双向通信
- **HTTP/2**：高效请求响应
- **gRPC**：高性能RPC调用
- **WebRTC**：浏览器节点通信

#### 数据传输
- **序列化**：JSON、MessagePack、Protobuf
- **压缩**：Gzip、Brotli压缩
- **加密**：TLS端到端加密
- **缓存**：结果缓存减少重复计算

## 🛡️ 安全模型

### 1. 身份认证

#### 节点认证
- **证书认证**：TLS客户端证书
- **令牌认证**：JWT令牌
- **API密钥**：预共享密钥
- **零信任**：每次请求验证

### 2. 权限控制

#### 权限模型
```typescript
interface NodePermissions {
  allowCommands: string[]
  denyCommands: string[]
  allowAgents: string[]
  denyAgents: string[]
  maxConcurrency: number
  maxMemory: number
}
```

#### 权限检查
- **命令白名单**：只允许特定命令
- **Agent白名单**：只允许特定Agent
- **资源限制**：CPU、内存限制
- **网络限制**：网络访问控制

### 3. 审计日志

#### 日志内容
- **节点操作**：节点注册、注销
- **任务执行**：任务开始、结束、失败
- **资源使用**：CPU、内存、网络使用
- **安全事件**：认证失败、权限拒绝

## 📊 监控和指标

### 1. 节点指标

#### 系统指标
- **CPU使用率**：节点CPU使用情况
- **内存使用**：节点内存使用情况
- **磁盘使用**：节点磁盘使用情况
- **网络带宽**：节点网络使用情况

#### 应用指标
- **任务队列**：待处理任务数
- **响应时间**：任务平均响应时间
- **成功率**：任务成功完成率
- **错误率**：任务失败率

### 2. 健康检查

#### 健康状态
- **健康**：节点正常运行
- **警告**：节点性能下降
- **严重**：节点不可用
- **未知**：节点状态未知

#### 检查机制
- **心跳检测**：定期心跳包
- **负载检查**：负载过高检测
- **响应检查**：响应时间检查
- **功能检查**：功能可用性检查

## 🚀 部署模式

### 1. 单节点部署

#### 本地开发
```yaml
nodes:
  local:
    type: local
    capabilities: ["exec", "fs", "network"]
```

#### 生产部署
```yaml
nodes:
  production:
    type: remote
    host: "node1.example.com"
    capabilities: ["exec", "fs", "network"]
    maxConcurrency: 10
```

### 2. 多节点集群

#### 负载均衡
```yaml
nodes:
  node1:
    type: remote
    host: "node1.example.com"
    weight: 2
  node2:
    type: remote
    host: "node2.example.com"
    weight: 1
  node3:
    type: browser
    weight: 1
```

#### 高可用
```yaml
nodes:
  primary:
    type: remote
    host: "primary.example.com"
    priority: 1
  secondary:
    type: remote
    host: "secondary.example.com"
    priority: 2
  tertiary:
    type: remote
    host: "tertiary.example.com"
    priority: 3
```

### 3. 混合部署

#### 本地+远程
```yaml
nodes:
  local:
    type: local
    capabilities: ["exec", "fs"]
  remote:
    type: remote
    host: "remote.example.com"
    capabilities: ["network", "gpu"]
```

#### 边缘计算
```yaml
nodes:
  edge1:
    type: browser
    region: "us-west"
  edge2:
    type: browser
    region: "eu-central"
  central:
    type: remote
    host: "central.example.com"
```

## 🔧 配置示例

### 1. 基础配置

```json5
{
  "gateway": {
    "nodes": {
      "browser": {
        "mode": "auto"
      }
    }
  }
}
```

### 2. 高级配置

```json5
{
  "gateway": {
    "nodes": {
      "browser": {
        "mode": "manual",
        "node": "gpu-node-1"
      },
      "allowCommands": ["python", "node", "bash"],
      "denyCommands": ["rm", "sudo", "su"]
    }
  }
}
```

### 3. 集群配置

```json5
{
  "gateway": {
    "nodes": {
      "browser": {
        "mode": "off"
      },
      "allowCommands": ["*"],
      "denyCommands": []
    }
  },
  "nodes": {
    "cluster1": {
      "type": "remote",
      "host": "cluster1.example.com",
      "port": 8080,
      "auth": {
        "type": "token",
        "token": "secret-token"
      }
    }
  }
}
```

## 🛠️ 故障排除

### 1. 节点连接问题

#### 连接失败
```bash
# 检查节点状态
openclaw nodes list

# 测试节点连接
openclaw nodes test node1

# 查看节点日志
openclaw logs node1
```

#### 性能问题
```bash
# 查看节点负载
openclaw nodes stats

# 查看任务队列
openclaw nodes queue

# 查看资源使用
openclaw nodes resources
```

### 2. 调试工具

#### 节点调试
```bash
# 启用调试模式
DEBUG=openclaw:nodes* openclaw gateway

# 性能分析
node --inspect openclaw gateway

# 网络调试
tcpdump -i any port 8080
```

## 📚 相关文档

- [Gateway Core 架构](./gateway-core.md)
- [Agent Runtime 架构](../runtime/agent-runtime.md)
- [配置系统详解](../advanced/configuration.md)
- [部署指南](../deploy/overview.md)
- [监控和日志](../deploy/monitoring.md)