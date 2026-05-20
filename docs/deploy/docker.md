# Docker 部署

使用 Docker 部署 OpenClaw。

## 🐳 Docker Compose

```yaml
version: '3.8'
services:
  openclaw:
    image: openclaw/gateway:latest
    container_name: openclaw
    volumes:
      - ./config:/root/.homiclaw
    ports:
      - "3271:3271"
    environment:
      - LOG_LEVEL=info
    restart: unless-stopped
```

## 🚀 启动

```bash
docker compose up -d

# 查看日志
docker compose logs -f

# 停止
docker compose down
```

---

下一篇：[Cloudflare 部署](./cloudflare)
