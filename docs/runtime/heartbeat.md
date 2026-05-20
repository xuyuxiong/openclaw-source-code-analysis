# Heartbeat 心跳机制

OpenClaw 的 Heartbeat 让 AI 助手具备主动性，不只是被动回复。

## 🔄 工作原理

```
Gateway 每 ~30 分钟轮询主 Session：

发送消息: "Read HEARTBEAT.md if it exists.
           Follow it strictly.
           If nothing needs attention, reply HEARTBEAT_OK."

Agent 响应:
├── HEARTBEAT_OK → 无事可做，静默
├── 主动消息 → "你有新邮件..." / "15分钟后有会议..."
│   └── 推送到 Channel 通知用户
└── 工具调用 → 执行检查任务 → 根据结果决定是否通知
```

## 📋 HEARTBEAT.md

```markdown
# HEARTBEAT.md

## 定期检查
- [ ] 检查是否有未读重要邮件
- [ ] 检查日历是否有即将到来的会议
- [ ] 检查天气（如果用户可能出门）

## 静默规则
- 23:00-08:00 除非紧急，否则不通知
- 没有新信息时不发消息
```

## ⚙️ 配置

```yaml
# config.yaml
heartbeat:
  enabled: true
  intervalMs: 1800000    # 30 分钟
  prompt: "Read HEARTBEAT.md..."
```

---

下一篇：[错误处理与重试](./error-handling)
