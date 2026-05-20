# Channel Plugin 接口

深入理解如何开发自定义 Channel 插件。

## 🔌 开发一个最简 Channel 插件

```typescript
import { ChannelPlugin, InboundMessage, OutboundMessage, Gateway } from '@openclaw/plugin-sdk'

export class MyChannelPlugin implements ChannelPlugin {
  name = 'my-channel'

  private handler?: InboundHandler

  async start(gateway: Gateway): Promise<void> {
    // 1. 初始化连接
    // 2. 注册消息回调
    this.handler = gateway.onInboundMessage
  }

  async stop(): Promise<void> {
    // 断开连接
  }

  async send(message: OutboundMessage): Promise<void> {
    // 将 OpenClaw 消息转换为平台格式并发送
  }

  // 收到平台消息时调用
  private onPlatformMessage(raw: any): void {
    const inbound: InboundMessage = {
      channel: 'my-channel',
      userId: raw.user.id,
      channelId: raw.channel.id,
      content: raw.text,
      metadata: {}
    }
    this.handler?.(inbound)
  }
}
```

## 📝 消息格式转换

### 入站：平台格式 → OpenClaw 格式

```typescript
// Telegram → OpenClaw
function normalizeTelegramMessage(msg: TelegramMessage): InboundMessage {
  return {
    channel: 'telegram',
    userId: String(msg.from.id),
    channelId: String(msg.chat.id),
    content: msg.text || '',
    media: msg.photo ? { type: 'image', fileId: msg.photo[0].file_id } : undefined,
    replyTo: msg.reply_to_message?.message_id,
    metadata: { messageId: msg.message_id }
  }
}
```

### 出站：OpenClaw 格式 → 平台格式

```typescript
// OpenClaw → Telegram
async function sendToTelegram(message: OutboundMessage): Promise<void> {
  await telegramBot.sendMessage(message.channelId, message.content, {
    parse_mode: 'Markdown',
    reply_to_message_id: message.replyTo
  })
}
```

---

下一篇：[Telegram 通道](./telegram)
