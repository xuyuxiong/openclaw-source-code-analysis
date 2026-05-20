# 状态持久化

OpenClaw 的文件持久化策略，零数据库、零云服务。

## 📁 状态文件

```
~/.homiclaw/
├── config.yaml               ← 配置
├── state/
│   ├── sessions/             ← 会话快照
│   ├── cron-jobs.json        ← Cron 任务
│   └── channels/             ← 通道状态
├── workspace/                ← 工作区
└── gateway-bundle/           ← Gateway 代码
```

## 💾 持久化时机

| 数据 | 时机 | 格式 |
|------|------|------|
| 会话历史 | 每次 Agent Turn 后 | JSON |
| 配置 | 修改时 | YAML |
| Cron 任务 | 添加/修改时 | JSON |
| 通道状态 | 连接/断开时 | JSON |

## 🔄 崩溃恢复

```
Gateway 崩溃 → systemd/launchd 重启 → 加载状态文件 → 恢复运行
- Session 历史从 JSON 恢复 ✅
- Cron 任务从 JSON 恢复 ✅
- 通道连接重新建立 ✅
- Lane Queue 状态丢失 ❌（内存）
- 进行中的 Tool 调用丢失 ❌（内存）
```

---

下一篇：[性能优化](./performance)
