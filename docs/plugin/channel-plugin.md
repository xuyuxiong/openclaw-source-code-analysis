# Channel 插件

深入理解如何开发消息通道插件。

## 🔧 最小实现

```typescript
import { ChannelPlugin, Gateway, InboundHandler, OutboundMessage } from '@openclaw/plugin-sdk'

export class EchoChannel implements ChannelPlugin {
  name = 'echo'
  private handler?: InboundHandler

  async start(gateway: Gateway): Promise<void> {
    this.handler = gateway.onInboundMessage
    console.log('Echo channel started')
  }

  async stop(): Promise<void> {
    this.handler = undefined
  }

  async send(message: OutboundMessage): Promise<void> {
    console.log('Outbound:', message.content)
  }

  // 模拟收到消息
  receive(text: string): void {
    this.handler?.({
      channel: 'echo',
      userId: 'test',
      channelId: 'test',
      content: text,
      metadata: {}
    })
  }
}
```

## 📝 消息格式转换

入站和出站都需要格式转换：
- **入站**：平台格式 → InboundMessage
- **出站**：OutboundMessage → 平台格式

关键考虑：
- Markdown 变体（各平台不同）
- 长消息分片
- 媒体处理
- 流式更新机制

---

下一篇：[Skill 技能系统](./skill-system)
