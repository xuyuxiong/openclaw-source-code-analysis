# Provider 提供者系统

深入 OpenClaw 的 Provider 架构，理解如何将 LLM 调用抽象为可插拔的 Provider 插件。

## 🏗️ Provider 架构

```
┌─────────────────────────────────────────────────┐
│                  Agent Runtime                   │
│                   ↓ 调用                         │
│            ┌─────────────────┐                   │
│            │ Provider Manager│ ← 路由 + 负载均衡  │
│            └────────┬────────┘                   │
│                     │                             │
│     ┌───────┬───────┼───────┬───────┐            │
│     ↓       ↓       ↓       ↓       ↓            │
│  ┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐      │
│  │OpenAI││Anthr.││Google││Ollama││Mistrl│      │
│  │Plugin││Plugin││Plugin││Plugin││Plugin│      │
│  └──────┘└──────┘└──────┘└──────┘└──────┘      │
│     ↓       ↓       ↓       ↓       ↓            │
│   OpenAI  Claude   Gemini  本地    Mistral       │
│   API      API     API    模型     API           │
└─────────────────────────────────────────────────┘
```

## 🔌 Provider Plugin 接口

```typescript
interface ProviderPlugin {
  // 提供者标识
  name: string                         // "openai" | "anthropic" | "google" | ...

  // 模型列表
  models: ModelDefinition[]

  // 补全（非流式）
  complete(request: CompletionRequest): Promise<CompletionResponse>

  // 补全（流式）
  completeStream(request: CompletionRequest): AsyncIterable<StreamChunk>

  // 认证检查
  validateAuth(): Promise<boolean>
}

interface ModelDefinition {
  id: string                  // "openai/gpt-4"
  name: string                // "GPT-4"
  contextWindow: number       // 上下文窗口大小
  inputPrice: number          // 输入价格 / 1M tokens
  outputPrice: number         // 输出价格 / 1M tokens
  capabilities: string[]      // ["vision", "function_calling", "streaming"]
}

interface CompletionRequest {
  model: string               // 模型 ID
  messages: Message[]         // 消息数组
  tools?: ToolDefinition[]    // 工具定义
  temperature?: number
  maxTokens?: number
  stream: boolean             // 是否流式
}

interface CompletionResponse {
  content: string             // 文本内容
  toolCalls?: ToolCall[]      // 工具调用
  usage: TokenUsage           // Token 使用量
  model: string               // 实际使用的模型
  finishReason: string        // "stop" | "tool_calls" | "length"
}
```

## 🔄 模型选择流程

```
用户消息到达
    ↓
1. 检查 Session 级别模型覆盖
   /model anthropic/claude-sonnet-4
    ↓
2. 检查配置文件默认模型
   agents.defaults.model: "openai/gpt-4"
    ↓
3. Provider Manager 匹配 Provider
   "openai/gpt-4" → OpenAI Plugin
    ↓
4. 检查 Provider 可用性
   apiKey 有效? → 是 → 继续
                → 否 → 回退到备选 Provider
    ↓
5. 构建请求并发送
```

### 回退机制

```yaml
# 配置回退链
providers:
  openai:
    apiKey: sk-xxx
    fallback: anthropic
  anthropic:
    apiKey: sk-yyy
    fallback: google
  google:
    apiKey: sk-zzz
```

```
OpenAI 请求 → 超时/429 → 回退到 Anthropic
Anthropic 请求 → 超时/429 → 回退到 Google
```

## 📊 Token 计数与费用

```typescript
// Token 计数在两个地方发生：
// 1. 发送前估算（检查上下文窗口）
// 2. 响应后精确统计（来自 LLM API 返回）

class TokenCounter {
  // 估算（发送前）
  estimateTokens(messages: Message[]): number {
    // 粗略估算：1 token ≈ 4 英文字符 / 0.75 英文单词
    // 中文：1 token ≈ 1.5 字
    return messages.reduce((sum, msg) => {
      return sum + Math.ceil(msg.content.length / 4)
    }, 0)
  }

  // 精确统计（响应后）
  recordUsage(sessionKey: string, usage: TokenUsage): void {
    const session = this.sessions.get(sessionKey)
    session.tokenUsage.input += usage.input
    session.tokenUsage.output += usage.output
    session.cost += this.calculateCost(usage, session.model)
  }

  // 费用计算
  calculateCost(usage: TokenUsage, model: string): number {
    const definition = this.getModelDefinition(model)
    const inputCost = (usage.input / 1_000_000) * definition.inputPrice
    const outputCost = (usage.output / 1_000_000) * definition.outputPrice
    return inputCost + outputCost
  }
}
```

## 🔧 流式响应处理

```
LLM API (SSE Stream)
    ↓ chunk 1: "你"
    ↓ chunk 2: "好"
    ↓ chunk 3: "！"
    ↓ chunk 4: [Tool Call: exec]
    ↓ done

StreamingProcessor:
    ├── 文本块 → 立即推送到 Channel（打字效果）
    ├── Tool Call → 累积参数，完成后执行
    └── 结束 → 记录完整响应到 Session
```

```typescript
// 流式处理伪代码
async function* processStream(stream: AsyncIterable<StreamChunk>) {
  let fullContent = ''
  let toolCalls: ToolCall[] = []

  for await (const chunk of stream) {
    if (chunk.type === 'text') {
      fullContent += chunk.text
      yield { type: 'text', text: chunk.text }  // 推送到 Channel
    }
    else if (chunk.type === 'tool_call') {
      toolCalls.push(chunk.toolCall)
      yield { type: 'tool_call', toolCall: chunk.toolCall }
    }
  }

  // 流结束后执行工具调用
  for (const toolCall of toolCalls) {
    const result = await executeTool(toolCall)
    yield { type: 'tool_result', result }
  }
}
```

## 🆚 Provider 对比

| Provider | 流式 | 工具调用 | Vision | 价格档 |
|----------|------|---------|--------|--------|
| OpenAI | ✅ | ✅ | ✅ | $ |
| Anthropic | ✅ | ✅ | ✅ | $$$ |
| Google | ✅ | ✅ | ✅ | $ |
| Ollama | ✅ | ✅ | ⚠️ | 免费 |
| Mistral | ✅ | ✅ | ⚠️ | $$ |

## 🐛 常见问题

### Q: 如何添加自托管模型？

```yaml
providers:
  ollama:
    baseUrl: http://localhost:11434
    models:
      - id: ollama/llama3
        name: Llama 3
        contextWindow: 8192
```

### Q: Provider 插件加载失败怎么办？

```
Gateway 会跳过加载失败的 Provider，不影响其他 Provider。
查看日志: homiclaw gateway logs | grep "provider"
```

### Q: 如何限制特定 Session 使用特定模型？

```
在 Session 中使用 /model 命令切换：
/model anthropic/claude-sonnet-4

或在配置中设置路由规则。
```

---

下一篇：[Tool 工具系统](./tool-system)