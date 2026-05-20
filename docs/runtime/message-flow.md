# 消息处理流程

一条消息从用户发送到 AI 回复的完整链路。

## 🔄 完整流程

```
Telegram: "今天天气怎么样？"
    ↓ 1. Channel Plugin 接收
    ↓ 2. 消息标准化 (InboundMessage)
    ↓ 3. 路由到 Session
    ↓ 4. 入队 Lane Queue
    ↓ 5. 构建 System Prompt
    ↓ 6. 拼接消息历史
    ↓ 7. 调用 LLM Provider
    ↓ 8. 流式接收响应
    ↓ 9. 如果有 Tool Call → 执行工具 → 回到 6
    ↓ 10. 纯文本回复
    ↓ 11. 出站消息标准化
    ↓ 12. Channel Plugin 发送
    ↓
Telegram: "北京今天晴，25°C ☀️"
```

## 📝 消息标准化

不同通道的消息格式不同，OpenClaw 统一为 InboundMessage：

```typescript
interface InboundMessage {
  channel: string           // "telegram" | "discord" | ...
  userId: string            // 用户 ID
  channelId: string         // 频道/群组 ID
  content: string           // 消息文本
  media?: MediaAttachment   // 附件（图片/文件/语音）
  replyTo?: string          // 回复的消息 ID
  metadata: Record<string, any>  // 通道特定字段
}
```

### 通道差异处理

```
Telegram: Markdown → OpenClaw 统一格式
Discord:  Markdown (变体) → OpenClaw 统一格式
WhatsApp: 纯文本 + WhatsApp 格式 → OpenClaw 统一格式
Signal:   纯文本 → OpenClaw 统一格式
WebChat:  纯文本 → OpenClaw 统一格式

出站时反向转换：
OpenClaw 统一格式 → 通道特定格式
```

## 🔀 多媒体消息

```
用户发送图片 (Telegram)
    ↓ 1. Channel Plugin 下载图片
    ↓ 2. 保存到临时文件
    ↓ 3. InboundMessage.media = { type: 'image', url: '/tmp/xxx.jpg' }
    ↓ 4. Agent Loop 识别 media
    ↓ 5. 使用 image 工具分析
    ↓ 6. LLM 返回图片描述
    ↓ 7. 回复包含图片分析结果
```

## 📊 性能关键路径

```
延迟关键路径：
  Channel 接收 → Lane 排队 → LLM 调用 → 流式推送

优化策略：
  1. Lane 排队通常 < 1ms（内存操作）
  2. LLM 调用是主要延迟（2-10s）
  3. 流式推送让用户看到"正在输入"
  4. 上下文缓存减少重复发送
```

---

下一篇：[Agent Runtime](./agent-runtime)
