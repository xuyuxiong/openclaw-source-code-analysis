# Telegram 通道

OpenClaw 联系最紧密的通道，基于 Telegram Bot API。

## 📐 架构

```
Telegram Server ←→ Telegram Bot API ←→ OpenClaw (Baileys/grammY)
     ↑                                    ↓
  用户消息                          Lane Queue → Agent Loop
     ↑                                    ↓
  用户收到回复 ←── Telegram Bot API ←── Channel Plugin
```

## 🔧 配置

```yaml
channels:
  telegram:
    enabled: true
    botToken: "123456:ABC-DEF"
    allowedUsers: []     # 空=允许所有
    allowedChats: []     # 空=允许所有
```

## 🎯 特性支持

- ✅ 文本消息（Markdown 格式）
- ✅ 图片/文件收发
- ✅ 流式编辑（每 N 字符更新消息）
- ✅ 内联键盘（按钮交互）
- ✅ 群组消息
- ✅ 回复引用
- ✅ 反应（emoji）

---

下一篇：[Discord 通道](./discord)
