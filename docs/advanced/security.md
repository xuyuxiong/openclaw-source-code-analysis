# 安全机制

OpenClaw 的多层安全防线，从网络到工具执行。

## 🛡️ 安全层级

```
Layer 1: 网络安全
  - Gateway 仅监听 localhost
  - 不直接暴露到公网
  - RPC 端口也绑定 localhost

Layer 2: 认证安全
  - 通道认证 (Bot Token / API Key)
  - Provider 认证 (API Key)
  - 用户认证 (allowedUsers / allowedChats)

Layer 3: 工具安全
  - exec: allowlist / full / deny
  - 文件操作: 路径白名单
  - 网络请求: SSRF 防护

Layer 4: 沙箱安全
  - 工具执行在受限环境中
  - 资源限制 (CPU / 内存 / 超时)
  - 文件系统隔离

Layer 5: 审计安全
  - 工具调用日志
  - API 调用日志
  - 敏感信息脱敏
```

## 🔧 安全配置

```yaml
# config.yaml
tools:
  exec:
    security: allowlist
    allowlist:
      - git
      - ls
      - cat
      - node
      - python3
  web_fetch:
    blockedHosts:
      - "localhost"
      - "127.0.0.1"
      - "10.*"
      - "192.168.*"
      - "*.internal"
```

---

下一篇：[Workspace 工作区](./workspace)
