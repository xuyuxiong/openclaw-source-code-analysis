# 监控与日志

OpenClaw 的监控和日志系统。

## 📊 状态监控

```bash
# 总体状态
homiclaw status

# Gateway 详细状态
homiclaw gateway status

# 通道状态
homiclaw channels

# 模型列表
homiclaw models

# Cron 任务
homiclaw cron list

# 会话列表
homiclaw sessions list
```

## 📝 日志

```bash
# 实时日志
homiclaw gateway logs

# 带过滤
homiclaw gateway logs --filter "lane-queue"
homiclaw gateway logs --level debug
```

## 🔔 健康检查

```
Gateway 自动健康检查：
├── 通道连接状态
├── Provider 可用性
├── 内存使用
├── 磁盘使用
└── Cron 任务运行状态
```

---

📚 您已完成所有章节！返回 [首页](/) 继续探索。
