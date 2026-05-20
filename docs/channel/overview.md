# 通道系统总览

深入 OpenClaw 的多通道架构，理解消息如何在不同平台间流转。

## 🏗️ 通道架构

```
┌─────────────────────────────────────────┐
│           Channel Manager               │
│                                         │
│  ┌──────────┐ ┌──────────┐ ┌─────────┐ │
│  │ Telegram  │ │ Discord  │ │WhatsApp │ │
│  │ Plugin    │ │ Plugin   │ │ Plugin  │ │
│  └─────┬────┘ └─────┬────┘ └────┬────┘ │
│        │             │           │       │
│  ┌─────┴─────────────┴───────────┴────┐ │
│  │     Message Normalizer             │ │
│  │     (统一消息格式)                    │ │
│  └────────────────┬───────────────────┘ │
│                   ↓                     │
│           Lane Queue → Agent Loop       │
└─────────────────────────────────────────┘
```

## 📊 通道对比

| 通道 | 协议 | 流式 | 多媒体 | 群组 | 自启动 |
|------|------|------|--------|------|--------|
| Telegram | Bot API | ✅ 编辑 | ✅ | ✅ | ✅ |
| Discord | WebSocket | ✅ 编辑 | ✅ | ✅ | ✅ |
| WhatsApp | Baileys | ❌ | ✅ | ✅ | ⚠️ 扫码 |
| Signal | signal-cli | ❌ | ✅ | ❌ | ✅ |
| Slack | Bolt API | ✅ 编辑 | ✅ | ✅ | ✅ |
| WebChat | WebSocket | ✅ 推送 | ✅ | ❌ | ✅ |
| iMessage | BlueBubbles | ❌ | ✅ | ❌ | ⚠️ macOS |

## 🔌 Channel Plugin 接口

```typescript
interface ChannelPlugin {
  name: string
  start(gateway: Gateway): Promise<void>
  stop(): Promise<void>
  send(message: OutboundMessage): Promise<void>
  onMessage(handler: InboundHandler): void
}
```

---

下一篇：[Channel Plugin 接口](./channel-plugin)
