# 快速上手

5 分钟内让 OpenClaw 跑起来，发送第一条消息。

## 📦 安装

```bash
# npm 全局安装
npm install -g homiclaw

# 或使用 Homebrew (macOS)
brew install homiclaw

# 验证安装
homiclaw --version
```

## 🔧 初始化配置

```bash
# 交互式引导配置
homiclaw onboard

# 会依次配置：
# 1. LLM Provider（选择 OpenAI / Anthropic / Google 等）
# 2. API Key
# 3. 聊天通道（Telegram / Discord / WebChat 等）
# 4. 工作区路径
```

### 最小配置

编辑 `~/.homiclaw/config.yaml`:

```yaml
# LLM 提供者
providers:
  openai:
    apiKey: sk-xxx

# 默认模型
agents:
  defaults:
    model: openai/gpt-4

# 通道
channels:
  webchat:
    enabled: true
  telegram:
    enabled: false
    botToken: ""
```

## 🚀 启动 Gateway

```bash
# 前台启动（开发调试）
homiclaw gateway start

# 守护进程模式
homiclaw gateway start --daemon

# 查看状态
homiclaw gateway status
```

启动后访问 `http://localhost:3271` 打开 WebChat。

## 💬 发送第一条消息

### WebChat

1. 浏览器打开 `http://localhost:3271`
2. 在输入框输入 "你好"
3. 等待 AI 回复

### Telegram

```bash
# 配置 Telegram Bot
homiclaw onboard --channel telegram

# 创建 Bot: 找 @BotFather → /newbot → 获取 token
# 填入 token 后重启 Gateway
homiclaw gateway restart
```

在 Telegram 中给你的 Bot 发消息即可。

## 🔧 常用命令

```bash
# 状态
homiclaw status            # 总体状态
homiclaw gateway status    # Gateway 状态
homiclaw models            # 可用模型列表

# 通道管理
homiclaw channels          # 通道状态
homiclaw onboard --channel discord   # 添加 Discord

# 配置
homiclaw config get agents.defaults.model    # 查看配置
homiclaw config patch agents.defaults.model openai/gpt-4  # 修改配置

# 更新
homiclaw update             # 自更新
```

## 🛠️ 工作区

OpenClaw 的工作区是 AI 助手的工作目录，默认在 `~/.homiclaw/workspace/`：

```
~/.homiclaw/
├── config.yaml          # 主配置
├── workspace/           # 工作区
│   ├── AGENTS.md        # Agent 行为定义
│   ├── SOUL.md          # Agent 人格
│   ├── USER.md          # 用户信息
│   ├── TOOLS.md         # 工具备注
│   ├── MEMORY.md        # 长期记忆
│   └── memory/          # 日常记忆
│       └── 2026-05-20.md
├── gateway-bundle/      # Gateway 代码包
├── skills/              # 技能包
└── sessions/            # 会话数据
```

## 🐛 常见问题

### Q: 启动失败，端口被占用？

```bash
# 检查端口占用
lsof -i :3271
# 修改端口
homiclaw config patch gateway.port 3272
```

### Q: API Key 无效？

```bash
# 验证 API Key
homiclaw models
# 如果列表为空，检查 config.yaml 中的 apiKey
```

### Q: Telegram Bot 不回复？

```
1. 检查 botToken 是否正确
2. 检查 Gateway 日志: homiclaw gateway logs
3. 确保 Gateway 重启后生效: homiclaw gateway restart
```

---

下一章：[源码目录结构](./structure)