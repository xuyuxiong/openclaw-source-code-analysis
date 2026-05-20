# 本地部署

在个人电脑上部署 OpenClaw。

## 📋 前提条件

- macOS / Linux / Windows (WSL)
- Node.js 20+
- 至少一个 LLM API Key

## 🚀 安装

```bash
# npm
npm install -g homiclaw

# Homebrew (macOS)
brew install homiclaw
```

## 🔧 配置

```bash
# 交互式引导
homiclaw onboard

# 或手动编辑
vim ~/.homiclaw/config.yaml
```

## 🖥️ 运行

```bash
# 前台运行（开发）
homiclaw gateway start

# 守护进程
homiclaw gateway start --daemon

# 查看状态
homiclaw gateway status

# 查看日志
homiclaw gateway logs

# 停止
homiclaw gateway stop
```

## 🔧 macOS 自启动

```bash
# 安装 launchd 服务
homiclaw gateway install

# 开机自启
homiclaw gateway enable
```

---

下一篇：[Docker 部署](./docker)
