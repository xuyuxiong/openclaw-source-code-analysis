# RPC 通信

OpenClaw Gateway 与 CLI 之间的 RPC 通信机制。

## 🏗️ 架构

```
homiclaw CLI ←── RPC (localhost:3272) ──→ Gateway
```

## 📡 RPC 接口

```typescript
// CLI 命令 → Gateway 调用
gateway.status()              // 状态查询
gateway.config.get(path)      // 读取配置
gateway.config.patch(data)    // 修改配置
gateway.restart()             // 重启 Gateway
gateway.cron.list()           // 列出 Cron 任务
gateway.cron.add(job)         // 添加 Cron 任务
gateway.sessions.list()       // 列出会话
```

## 🔒 安全

- RPC 仅监听 localhost
- 不暴露到网络
- Gateway 启动时生成临时 Token

---

下一篇：[状态持久化](./state-persistence)
