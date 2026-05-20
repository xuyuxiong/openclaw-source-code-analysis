# WhatsApp 通道

基于 Baileys 库的 WhatsApp Web 协议实现。

## 🔧 配置

```yaml
channels:
  whatsapp:
    enabled: true
    # 首次需要扫描 QR 码
```

## ⚠️ 注意事项

- 首次连接需要扫描 QR 码
- 会话状态保存在本地
- WhatsApp 不支持编辑消息，流式效果有限
- 需要保持连接活跃（心跳）

---

下一篇：[WebChat 通道](./webchat)
