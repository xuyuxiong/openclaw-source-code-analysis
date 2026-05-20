# 安全与隔离理念

OpenClaw 的安全哲学：**默认安全，显式放宽**。

## 🛡️ 多层防御

```
Layer 1: 网络边界
  Gateway 仅监听 localhost (127.0.0.1)
  不直接暴露到公网

Layer 2: 通道边界
  Channel Plugin 处理入站消息
  消息标准化 → 去除敏感字段

Layer 3: Lane Queue 边界
  串行化避免竞态
  单 Session 单写

Layer 4: 工具执行边界
  Sandbox 隔离
  审批机制 (allowlist / full / deny)

Layer 5: Provider 边界
  API Key 加密存储
  请求审计日志
```

## 🔐 最小权限原则

```
默认权限：
  exec:    需审批 (allowlist)
  read:    允许 (但限制路径)
  write:   允许 (但限制工作区)
  web:     允许 (但阻止内网SSRF)
  cron:    允许
  nodes:   需审批

显式放宽：
  tools:
    exec:
      security: full    # 所有命令直接执行（危险！）
```

## 🏖️ Sandbox 沙箱

```
exec 工具的执行环境：
  ├── 文件系统隔离（限制在工作区）
  ├── 网络隔离（可选）
  ├── 资源限制（CPU / 内存 / 超时）
  └── 进程隔离（子进程）

read/write 工具的路径限制：
  ├── 允许：~/.homiclaw/workspace/
  ├── 允许：~/Desktop/
  ├── 允许：~/Documents/
  ├── 阻止：/etc/
  ├── 阻止：~/.ssh/
  └── 阻止：系统目录
```

## 📋 审批流程

```
LLM 请求执行: rm -rf /tmp/test
    ↓
Policy: allowlist → "rm" 不在白名单 → 需要审批
    ↓
Channel 发送审批请求给用户：
  "⚠️ exec 请求执行: rm -rf /tmp/test
   /approve 允许 | /deny 拒绝"
    ↓
用户回复 /approve → 执行
用户回复 /deny → 返回错误给 LLM
超时无回复 → 自动拒绝
```

---

下一篇：[Gateway 模式设计哲学](./gateway-pattern)