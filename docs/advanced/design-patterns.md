# 设计模式

OpenClaw 源码中用到的设计模式。

## 🏗️ 模式一览

| 模式 | 应用场景 | 模块 |
|------|---------|------|
| **插件** | Provider / Channel / Tool | 插件系统 |
| **观察者** | 消息事件 / 状态变更 | 通道系统 |
| **策略** | 安全策略 (allowlist/full/deny) | 工具系统 |
| **命令** | CLI 命令 / RPC 调用 | CLI |
| **队列** | Lane Queue 串行化 | 核心 |
| **工厂** | Session 创建 | Session 管理 |
| **代理** | Provider 代理 | Provider 系统 |
| **单例** | Gateway 实例 | 核心 |
| **状态机** | Gateway 生命周期 | Gateway |
| **中间件** | 消息处理管道 | Channel |

## 🔍 详细解析

### 插件模式 (Plugin)

```typescript
// Gateway 不硬编码 Provider，通过接口解耦
interface ProviderPlugin {
  complete(request): Promise<Response>
}

// OpenAI / Anthropic / Google 只需实现接口
class OpenAIProvider implements ProviderPlugin { ... }
class AnthropicProvider implements ProviderPlugin { ... }
```

### 策略模式 (Strategy)

```typescript
// exec 工具的安全策略
type SecurityPolicy = 'full' | 'allowlist' | 'deny'

function checkPolicy(policy: SecurityPolicy, command: string): boolean {
  switch (policy) {
    case 'full': return true
    case 'allowlist': return allowlist.includes(command)
    case 'deny': return false
  }
}
```

### 队列模式 (Queue / Lane)

```typescript
// Lane Queue：同一 Session 串行
class LaneQueue {
  private lanes = new Map<string, Promise<void>>()
  
  async enqueue(key: string, task: () => Promise<void>) {
    const current = this.lanes.get(key) || Promise.resolve()
    const next = current.then(() => task())
    this.lanes.set(key, next)
    return next
  }
}
```

---

下一篇：[部署总览](../deploy/overview)
