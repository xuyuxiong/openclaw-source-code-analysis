# 自定义插件开发

从零开发一个 OpenClaw 插件的完整指南。

## 🚀 快速开始

```bash
# 1. 创建插件项目
mkdir my-openclaw-plugin && cd my-openclaw-plugin
npm init -y

# 2. 安装 SDK
npm install @openclaw/plugin-sdk

# 3. 实现插件
# 见下方代码

# 4. 构建
npm run build

# 5. 安装到 OpenClaw
homiclaw plugins install ./my-openclaw-plugin
```

## 📦 完整的 Provider 插件示例

```typescript
import { ProviderPlugin, CompletionRequest, CompletionResponse, StreamChunk, ModelDefinition } from '@openclaw/plugin-sdk'

export default class MyProvider implements ProviderPlugin {
  name = 'my-provider'
  private apiKey: string = ''

  models: ModelDefinition[] = [
    {
      id: 'my-provider/fast',
      name: 'My Model (Fast)',
      contextWindow: 32768,
      inputPrice: 0.5,
      outputPrice: 1.5,
      capabilities: ['streaming', 'function_calling']
    },
    {
      id: 'my-provider/powerful',
      name: 'My Model (Powerful)',
      contextWindow: 128000,
      inputPrice: 5,
      outputPrice: 15,
      capabilities: ['streaming', 'function_calling', 'vision']
    }
  ]

  async validateAuth(): Promise<boolean> {
    this.apiKey = process.env.MY_PROVIDER_API_KEY || ''
    if (!this.apiKey) return false
    try {
      const res = await fetch('https://api.my-provider.com/models', {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      })
      return res.ok
    } catch {
      return false
    }
  }

  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    const res = await fetch('https://api.my-provider.com/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: request.model,
        messages: request.messages,
        tools: request.tools,
        temperature: request.temperature,
        max_tokens: request.maxTokens
      })
    })
    if (!res.ok) throw new Error(`API error: ${res.status}`)
    return await res.json()
  }

  async *completeStream(request: CompletionRequest): AsyncIterable<StreamChunk> {
    const res = await fetch('https://api.my-provider.com/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: request.model,
        messages: request.messages,
        tools: request.tools,
        temperature: request.temperature,
        max_tokens: request.maxTokens,
        stream: true
      })
    })
    // SSE 解析...
    const reader = res.body!.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') return
          try {
            const parsed = JSON.parse(data)
            const content = parsed.choices?.[0]?.delta?.content
            if (content) yield { type: 'text', text: content }
          } catch {}
        }
      }
    }
  }
}
```

## 🧪 测试插件

```typescript
import { createGateway } from '@openclaw/plugin-sdk/testing'

const gateway = createGateway({ provider: new MyProvider() })
const response = await gateway.complete({
  model: 'my-provider/fast',
  messages: [{ role: 'user', content: 'Hello' }]
})
console.log(response.content)
```

---

下一篇：[安全机制](../advanced/security)
