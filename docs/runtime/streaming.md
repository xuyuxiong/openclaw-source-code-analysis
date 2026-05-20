# Streaming 流式响应

深入 OpenClaw 的流式响应机制，让用户看到"实时打字"效果。

## 🔄 流式渲染流程

```
LLM API (SSE Stream)
    ↓ chunk: "你"
    ↓ chunk: "好"
    ↓ chunk: "！"
    ↓ chunk: [Tool Call: exec]
    ↓ chunk: done
    ↓
StreamingProcessor:
    ├── 文本块 → 流式推送到 Channel
    ├── Tool Call → 累积参数
    └── 结束 → 写入 Session 历史
```

## 🔧 实现细节

```typescript
async function* processStream(
  stream: AsyncIterable<StreamChunk>,
  channel: ChannelPlugin,
  session: Session
) {
  let fullContent = ''
  let toolCalls: ToolCall[] = []
  let toolCallBuffer = new Map<string, { name: string, args: string }>()

  for await (const chunk of stream) {
    if (chunk.type === 'text') {
      fullContent += chunk.text
      // 立即推送到 Channel（打字效果）
      await channel.streamText(chunk.text)
      yield { type: 'text_delta', text: chunk.text }
    }
    else if (chunk.type === 'tool_call_start') {
      toolCallBuffer.set(chunk.id, { name: chunk.name, args: '' })
    }
    else if (chunk.type === 'tool_call_args') {
      const buffer = toolCallBuffer.get(chunk.id)!
      buffer.args += chunk.args
    }
    else if (chunk.type === 'tool_call_end') {
      const buffer = toolCallBuffer.get(chunk.id)!
      toolCalls.push({
        id: chunk.id,
        name: buffer.name,
        arguments: JSON.parse(buffer.args)
      })
    }
  }

  // 持久化到 Session
  session.addAssistantMessage(fullContent, toolCalls)
}
```

## 📊 通道的流式支持

| 通道 | 流式方式 | 体验 |
|------|---------|------|
| WebChat | WebSocket 推送 | 逐字显示 |
| Telegram | 编辑消息 | 每 N 字符更新一次 |
| Discord | 编辑消息 | 每 N 字符更新一次 |
| WhatsApp | 不支持 | 发送完整消息 |
| Signal | 不支持 | 发送完整消息 |
| Slack | 编辑消息 | 每 N 字符更新一次 |

---

下一篇：[Compaction 上下文压缩](./compaction)
