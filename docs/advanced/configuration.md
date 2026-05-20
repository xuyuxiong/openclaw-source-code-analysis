# 配置系统

OpenClaw 的分层配置系统，支持热更新。

## 📐 配置层级

```
环境变量 (最高优先级)
    ↓ 覆盖
命令行参数
    ↓ 覆盖
~/.homiclaw/config.yaml (用户配置)
    ↓ 合并
默认值 (最低优先级)
```

## 📝 核心配置

```yaml
# Gateway
gateway:
  port: 3271
  rpcPort: 3272

# Agents
agents:
  defaults:
    model: openai/gpt-4
    thinking: off

# Channels
channels:
  telegram: { enabled: true, botToken: xxx }
  discord: { enabled: false }
  webchat: { enabled: true }

# Providers
providers:
  openai: { apiKey: sk-xxx }
  anthropic: { apiKey: sk-yyy }

# Tools
tools:
  exec: { security: allowlist }
  web_search: { enabled: true }

# Cron
cron: { enabled: true, maxJobs: 50 }

# Heartbeat
heartbeat: { enabled: true, intervalMs: 1800000 }
```

## 🔄 热更新

```bash
# 修改配置（不打断 Gateway）
homiclaw config patch agents.defaults.model anthropic/claude-sonnet-4

# 查看配置
homiclaw config get agents.defaults.model

# 重启 Gateway（仅通道变更需要）
homiclaw gateway restart
```

---

下一篇：[Sandbox 沙箱执行](./sandbox)
