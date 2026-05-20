# 快速开始指南

本指南将帮助你在 5 分钟内启动并运行 OpenClaw。

## 🚀 安装

### 方式一：npm 安装（推荐）
```bash
npm install -g openclaw
```

### 方式二：源码安装
```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
npm install
npm run build
npm link
```

### 验证安装
```bash
openclaw --version
# 输出：openclaw v1.0.0
```

## ⚙️ 初始配置

### 1. 创建配置文件
```bash
# 创建默认配置
openclaw config init

# 查看配置位置
openclaw config path
# 输出：/Users/yourname/.openclaw/config.json5
```

### 2. 基础配置
编辑配置文件 `~/.openclaw/config.json5`：

```json5
{
  // Gateway配置
  "gateway": {
    "port": 18789,
    "bind": "loopback",
    "controlUi": {
      "enabled": true
    }
  },
  
  // 默认Agent配置
  "agents": {
    "defaults": {
      "model": "openai/gpt-4",
      "thinkingDefault": "medium"
    },
    "list": [
      {
        "id": "assistant",
        "name": "通用助手",
        "default": true
      }
    ]
  },
  
  // 通道配置
  "channels": {
    "telegram": {
      "enabled": false,
      "botToken": "YOUR_BOT_TOKEN"
    },
    "discord": {
      "enabled": false,
      "botToken": "YOUR_BOT_TOKEN"
    }
  }
}
```

### 3. 配置 OpenAI
```bash
# 设置环境变量
export OPENAI_API_KEY="your-openai-api-key"

# 或者添加到配置
openclaw config set agents.defaults.model openai/gpt-4
```

## 🏃 启动服务

### 启动 Gateway
```bash
# 启动Gateway（前台运行）
openclaw gateway

# 后台运行
openclaw gateway --daemon

# 指定端口
openclaw gateway --port 8080

# 查看状态
openclaw status
```

### 验证启动
打开浏览器访问：http://localhost:18789

你应该能看到 OpenClaw 的控制界面。

## 💬 首次对话

### 方式一：使用 CLI
```bash
# 启动交互式对话
openclaw chat

# 或者发送单条消息
openclaw chat "你好，OpenClaw！"
```

### 方式二：使用 HTTP API
```bash
# 发送消息
curl -X POST http://localhost:18789/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "你好！"}],
    "model": "openai/gpt-4"
  }'
```

### 方式三：使用 WebSocket
```javascript
// 浏览器控制台
const ws = new WebSocket('ws://localhost:18789/ws');
ws.onmessage = (event) => {
  console.log('收到消息:', event.data);
};
ws.send(JSON.stringify({
  type: 'chat',
  content: '你好！'
}));
```

## 🔗 连接通道

### 配置 Telegram
1. 创建机器人：https://t.me/BotFather
2. 获取 token
3. 更新配置：

```json5
{
  "channels": {
    "telegram": {
      "enabled": true,
      "botToken": "123456789:ABCdefGHIjklMNOpqrSTUvwxyz"
    }
  }
}
```

4. 重启服务：
```bash
openclaw gateway restart
```

### 配置 Discord
1. 创建应用：https://discord.com/developers/applications
2. 获取 bot token
3. 更新配置：

```json5
{
  "channels": {
    "discord": {
      "enabled": true,
      "botToken": "MTIzNDU2Nzg5MABC.def.GHIjklMNOpqrSTUvwxyz"
    }
  }
}
```

## 🎯 常用命令

### 会话管理
```bash
# 查看活跃会话
openclaw sessions list

# 查看会话详情
openclaw sessions show <session-id>

# 清理过期会话
openclaw sessions cleanup
```

### 配置管理
```bash
# 查看当前配置
openclaw config show

# 修改配置
openclaw config set gateway.port 8080

# 验证配置
openclaw config validate
```

### 调试工具
```bash
# 查看日志
openclaw logs

# 性能监控
openclaw metrics

# 健康检查
openclaw health
```

## 🐛 常见问题

### 端口被占用
```bash
# 检查端口占用
lsof -i :18789

# 修改端口
openclaw config set gateway.port 8080
```

### 认证失败
```bash
# 检查API密钥
echo $OPENAI_API_KEY

# 测试API连接
openclaw test openai
```

### 通道连接失败
```bash
# 检查通道配置
openclaw config get channels

# 测试通道连接
openclaw test telegram
```

## 📁 目录结构

启动后，OpenClaw 会创建以下目录：

```
~/.openclaw/
├── config.json5          # 主配置文件
├── sessions.db           # 会话数据库
├── workspace/            # 工作目录
│   ├── agents/          # Agent配置
│   ├── skills/          # 技能文件
│   └── logs/            # 日志文件
├── cache/               # 缓存目录
└── plugins/             # 插件目录
```

## 🎉 下一步

现在你已经成功启动了 OpenClaw，可以：

1. **配置更多通道**：添加 Slack、WhatsApp 等
2. **创建自定义 Agent**：配置专用 Agent
3. **安装技能**：添加自定义技能
4. **部署到生产**：配置生产环境

## 📚 继续学习

- [配置详解](../advanced/configuration.md)
- [通道配置](../channel/overview.md)
- [Agent创建](../guide/structure.md)
- [部署指南](../deploy/overview.md)
- [故障排除](../guide/debugging.md)