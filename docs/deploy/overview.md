# 部署总览

OpenClaw 支持多种部署方式，从本地开发到生产环境。

## 📊 部署方式对比

| 方式 | 难度 | 成本 | 可用性 | 适合场景 |
|------|------|------|--------|---------|
| 本地 | ⭐ | 免费 | 依赖电脑 | 个人使用 |
| Docker | ⭐⭐ | 免费 | 较高 | 个人/团队 |
| VPS | ⭐⭐⭐ | $5-20/月 | 高 | 7×24 运行 |
| Cloudflare | ⭐⭐⭐ | 免费 | 高 | 轻量部署 |

## 🚀 本地部署（最简）

```bash
npm install -g homiclaw
homiclaw onboard
homiclaw gateway start
```

## 🐳 Docker 部署

```yaml
# docker-compose.yml
services:
  openclaw:
    image: openclaw/gateway:latest
    volumes:
      - ./config:/root/.homiclaw
    ports:
      - "3271:3271"
    restart: unless-stopped
```

## ☁️ VPS 部署

```bash
# 1. SSH 到 VPS
ssh user@your-vps

# 2. 安装 Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 3. 安装 OpenClaw
npm install -g homiclaw

# 4. 配置 systemd
sudo homiclaw gateway install

# 5. 启动
homiclaw gateway start
```

## 🔧 生产环境建议

```
1. 使用 systemd / launchd 管理 Gateway 进程
2. 配置日志轮转 (logrotate)
3. 定期备份 ~/.homiclaw/ 目录
4. 监控内存和 CPU 使用
5. 配置 Ollama 本地模型作为 fallback
6. 启用审计日志
```

---

下一篇：[本地部署](./local)
