# Compaction 上下文压缩

当对话历史过长时，OpenClaw 使用 Compaction 压缩旧消息，避免超出 Token 预算。

## 🎯 为什么需要压缩

```
GPT-4 上下文窗口: 128K tokens
System Prompt: ~2K tokens
工具定义: ~3K tokens
每轮对话: ~500 tokens

50 轮对话 ≈ 25K tokens → 还好
200 轮对话 ≈ 100K tokens → 接近上限
300+ 轮 → 必须压缩
```

## 🔄 压缩流程

```
1. 检测 Token 是否超预算
2. 选择需要压缩的消息（旧消息优先）
3. 调用 LLM 生成摘要
4. 用摘要替换旧消息
5. 保留最近 N 轮对话完整
```

```
压缩前 (120K tokens):
├── 消息 1-180: 早期对话 (100K tokens)
└── 消息 181-200: 近期对话 (20K tokens)

压缩后 (35K tokens):
├── [摘要]: 早期对话要点 (5K tokens)
├── 消息 181-200: 近期对话 (20K tokens)
└── 预留空间 (10K tokens)
```

## 💡 压缩策略

```typescript
function shouldCompact(messages: Message[], budget: number): boolean {
  const tokens = estimateTokens(messages)
  return tokens > budget * 0.8  // 80% 阈值触发
}

function compact(messages: Message[], budget: number): Message[] {
  const systemMsg = messages.filter(m => m.role === 'system')
  const recentMsgs = messages.slice(-20)  // 保留最近 20 条

  const oldMsgs = messages.filter(m => m.role !== 'system')
    .slice(0, -20)  // 旧消息

  // 用 LLM 生成摘要
  const summary = await llm.summarize(oldMsgs)

  return [
    ...systemMsg,
    { role: 'system', content: `[之前对话摘要] ${summary}` },
    ...recentMsgs
  ]
}
```

## 🐛 常见问题

### Q: 压缩会丢失信息吗？

```
是的，LLM 摘要可能丢失精确数字、代码、日期。
建议用户用 MEMORY.md 记录重要信息，它不会被压缩。
```

### Q: 可以关闭压缩吗？

```
不建议。超出 Token 预算会导致 API 错误。
可以调整压缩阈值和保留消息数量。
```

---

下一篇：[错误处理与重试](./error-handling)
