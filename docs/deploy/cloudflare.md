# Cloudflare 部署

使用 Cloudflare Workers 部署 OpenClaw（实验性）。

## ⚠️ 限制

- Worker 执行时间限制（免费版 10ms CPU）
- 无持久文件系统
- 需要外部 KV 存储

## 🚀 部署

```bash
# 使用 Wrangler
npx wrangler deploy
```

适合轻量级 WebChat 场景，不适合 7×24 常驻 Gateway。

---

下一篇：[自托管 Provider](./self-hosted)
