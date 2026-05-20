# Signal 通道

基于 signal-cli 的 Signal 通道实现。

## 🔧 配置

```yaml
channels:
  signal:
    enabled: true
    phoneNumber: "+1234567890"
```

## ⚠️ 注意事项

- 需要注册 Signal 账号
- signal-cli 是 Java 程序，需要 JRE
- 不支持流式（Signal 无编辑消息 API）

---

下一篇：[Slack 通道](./slack)
