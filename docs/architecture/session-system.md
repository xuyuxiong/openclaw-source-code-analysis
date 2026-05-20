# Session System 架构

OpenClaw 的 Session System 提供了跨通道、跨时间的会话状态管理，支持复杂的对话场景和持久化存储。

## 🎯 设计目标

- **跨通道会话**：支持同一用户在不同通道间的会话共享
- **持久化存储**：会话状态持久化到磁盘
- **上下文管理**：智能的上下文窗口管理
- **安全隔离**：会话间的完全隔离

## 🔧 核心概念

### 1. 会话标识

#### 会话键结构
会话使用复合键进行唯一标识：
```
accountId:channel:threadId
```

#### 键标准化
- **账户ID标准化**：`normalizeAccountId()`处理不同通道的ID格式
- **通道标准化**：统一通道标识符
- **线程ID支持**：支持群组和频道的线程概念

#### 会话键示例
```
# Telegram私聊
telegram:123456789:private

# Discord群组
discord:987654321:123456789012345678

# Slack频道
slack:T1234567890:C1234567890:thread_ts_1234567890.123456
```

### 2. 会话状态

#### 状态存储
```typescript
interface SessionState {
  id: string
  accountId: string
  channel: string
  threadId?: string
  
  // 对话历史
  messages: Message[]
  
  // 工具调用历史
  toolCalls: ToolCall[]
  
  // Agent状态
  agentId: string
  model: string
  systemPrompt: string
  
  // 元数据
  createdAt: Date
  lastActivity: Date
  metadata: Record<string, any>
}
```

#### 存储后端
- **SQLite**：默认存储后端
- **JSON文件**：人类可读的备份格式
- **内存缓存**：高性能的内存缓存
- **外部存储**：支持Redis等外部存储

### 3. 上下文管理

#### 上下文压缩
- **Token限制**：基于模型的token限制
- **智能压缩**：保留重要信息，压缩次要内容
- **摘要生成**：长对话生成摘要
- **引用保留**：保留重要的引用和链接

#### 上下文窗口
```typescript
interface ContextWindow {
  maxTokens: number
  currentTokens: number
  compressionRatio: number
  summary?: string
}
```

## 🏗️ 架构组件

### 1. 会话管理器

#### 会话创建
```typescript
interface SessionManager {
  createSession(params: {
    accountId: string
    channel: string
    threadId?: string
    agentId?: string
  }): Promise<Session>
  
  getSession(sessionKey: string): Promise<Session | null>
  
  updateSession(sessionKey: string, updates: Partial<Session>): Promise<void>
  
  deleteSession(sessionKey: string): Promise<void>
}
```

#### 会话生命周期
1. **创建**：首次消息时自动创建
2. **激活**：消息处理时激活
3. **空闲**：超时后进入空闲状态
4. **清理**：长时间空闲后清理

### 2. 消息存储

#### 消息结构
```typescript
interface Message {
  id: string
  role: "user" | "assistant" | "system" | "tool"
  content: string
  timestamp: Date
  metadata?: Record<string, any>
  
  // 工具调用相关
  toolCalls?: ToolCall[]
  toolResults?: ToolResult[]
}
```

#### 存储优化
- **增量存储**：只存储变化的部分
- **压缩存储**：消息内容压缩
- **索引优化**：快速查询索引
- **分页加载**：大会话分页加载

### 3. 工具调用追踪

#### 调用记录
```typescript
interface ToolCall {
  id: string
  tool: string
  arguments: any
  timestamp: Date
  sessionId: string
}

interface ToolResult {
  callId: string
  result: any
  error?: string
  timestamp: Date
}
```

#### 调用链追踪
- **调用树**：工具调用的层级关系
- **依赖关系**：工具间的依赖关系
- **执行时间**：每个工具的执行时间
- **资源使用**：工具的资源消耗

## 🛡️ 安全模型

### 1. 会话隔离

#### 隔离级别
- **用户隔离**：不同用户完全隔离
- **通道隔离**：同一用户不同通道隔离
- **线程隔离**：同一通道不同线程隔离
- **Agent隔离**：不同Agent完全隔离

#### 权限控制
```typescript
interface SessionPermissions {
  // 会话可见性
  visibility: "self" | "tree" | "agent" | "all"
  
  // 工具权限
  allowTools: string[]
  denyTools: string[]
  
  // 资源限制
  maxMessages: number
  maxTokens: number
  maxAge: number
}
```

### 2. 数据加密

#### 加密策略
- **静态加密**：磁盘存储加密
- **传输加密**：网络传输加密
- **内存加密**：敏感数据内存加密
- **密钥管理**：安全的密钥存储

### 3. 审计日志

#### 日志内容
- **会话操作**：创建、更新、删除
- **消息记录**：所有消息的完整记录
- **工具调用**：工具调用的详细记录
- **权限检查**：权限检查的结果

## 📊 性能优化

### 1. 缓存策略

#### 多级缓存
- **L1缓存**：内存中的热点会话
- **L2缓存**：本地磁盘的会话缓存
- **L3缓存**：远程存储的会话备份

#### 缓存失效
- **LRU策略**：最近最少使用
- **TTL策略**：基于时间的失效
- **主动失效**：配置变更时主动失效

### 2. 压缩算法

#### 消息压缩
- **Gzip**：通用压缩算法
- **Brotli**：更高的压缩比
- **Zstd**：更快的压缩速度
- **自定义**：针对对话优化的压缩

### 3. 索引优化

#### 索引类型
- **时间索引**：基于时间的快速查询
- **用户索引**：基于用户的快速查询
- **内容索引**：基于内容的模糊搜索
- **标签索引**：基于标签的分类查询

## 🚀 配置示例

### 1. 基础配置

```json5
{
  "sessions": {
    "storage": {
      "type": "sqlite",
      "path": "~/.openclaw/sessions.db"
    },
    "cleanup": {
      "maxAge": "30d",
      "cleanupInterval": "1h"
    }
  }
}
```

### 2. 高级配置

```json5
{
  "sessions": {
    "storage": {
      "type": "sqlite",
      "path": "~/.openclaw/sessions.db",
      "compression": true,
      "encryption": true
    },
    "context": {
      "maxTokens": 4000,
      "compressionRatio": 0.8,
      "summaryEnabled": true
    },
    "cleanup": {
      "maxAge": "7d",
      "maxMessages": 1000,
      "cleanupInterval": "30m"
    },
    "cache": {
      "enabled": true,
      "maxSize": "100MB",
      "ttl": "1h"
    }
  }
}
```

### 3. 集群配置

```json5
{
  "sessions": {
    "storage": {
      "type": "redis",
      "host": "redis.example.com",
      "port": 6379,
      "password": "secret"
    },
    "cache": {
      "enabled": true,
      "type": "redis",
      "ttl": "30m"
    }
  }
}
```

## 🔧 故障排除

### 1. 会话问题

#### 会话丢失
```bash
# 检查会话存储
openclaw sessions list

# 查看会话详情
openclaw sessions show <session-id>

# 恢复会话
openclaw sessions restore <session-id>
```

#### 上下文过长
```bash
# 查看上下文大小
openclaw sessions context <session-id>

# 手动压缩上下文
openclaw sessions compress <session-id>

# 清理会话
openclaw sessions cleanup
```

### 2. 性能问题

#### 查询缓慢
```bash
# 重建索引
openclaw sessions reindex

# 清理过期会话
openclaw sessions purge

# 优化数据库
openclaw sessions vacuum
```

### 3. 调试工具

#### 会话调试
```bash
# 启用调试模式
DEBUG=openclaw:sessions* openclaw gateway

# 查看会话统计
openclaw sessions stats

# 导出会话数据
openclaw sessions export <session-id> > session.json
```

## 📚 相关文档

- [Gateway Core 架构](./gateway-core.md)
- [Agent Runtime 架构](./agent-runtime.md)
- [配置系统详解](../advanced/configuration.md)
- [内存管理](../advanced/state-persistence.md)
- [安全配置](../advanced/security.md)