# Provider 插件

深入理解如何开发 LLM Provider 插件。

## 🔄 调用流程

```
Agent Runtime
    ↓ complete() / completeStream()
Provider Plugin
    ↓ HTTP 请求
LLM API (OpenAI / Anthropic / ...)
    ↓ 响应
Provider Plugin
    ↓ 标准化
CompletionResponse / StreamChunk
    ↓
Agent Runtime
```

## 🔧 关键实现

### 流式响应

```typescript
async *completeStream(request: CompletionRequest): AsyncIterable<StreamChunk> {
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({ ...params, stream: true })
  })

  const reader = response.body!.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const line = decoder.decode(value)
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6))
      if (data.choices?.[0]?.delta?.content) {
        yield { type: 'text', text: data.choices[0].delta.content }
      }
    }
  }
}
```

### 错误处理

```typescript
private async handleApiError(error: any): Promise<never> {
  if (error.status === 401) throw new AuthError('Invalid API Key')
  if (error.status === 429) throw new RateLimitError('Rate limited', error.headers['retry-after'])
  if (error.status >= 500) throw new ServerError('Provider server error')
  throw new UnknownError(error.message)
}
```

---

下一篇：[Channel 插件](./channel-plugin)
