# Sandbox 沙箱执行

OpenClaw 工具执行的安全沙箱机制。

## 🏖️ 沙箱目标

```
1. 文件系统隔离 — 限制可访问路径
2. 网络隔离 — 阻止内网访问 (SSRF)
3. 资源限制 — CPU / 内存 / 超时
4. 进程隔离 — 子进程无法影响 Gateway
```

## 🔧 exec 工具沙箱

```yaml
tools:
  exec:
    security: allowlist
    allowlist:
      - git
      - ls
      - cat
      - head
      - tail
      - grep
      - node
      - python3
      - npm
    blockedFlags:
      - "--no-preserve-root"  # rm -rf / 保护
    timeout: 15                # 默认超时（秒）
    maxOutput: 100000          # 最大输出字符
```

## 📁 文件路径限制

```
允许访问：
  ~/.homiclaw/workspace/    ← 工作区
  ~/Desktop/                ← 桌面
  ~/Documents/              ← 文档
  /tmp/                     ← 临时文件

阻止访问：
  /etc/                     ← 系统配置
  ~/.ssh/                   ← SSH 密钥
  ~/.gnupg/                 ← GPG 密钥
  ~/.homiclaw/config.yaml   ← 配置文件（含 API Key）
```

---

下一篇：[性能优化](./performance)
