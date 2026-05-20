# Sandbox 沙箱执行

OpenClaw 工具执行的安全沙箱机制，支持 Docker 容器隔离和 SSH 远程执行。

## 🏖️ 三种执行环境

```
exec 命令可路由到三种环境：

1. gateway — 本机直接执行
   ├── 最快，无隔离
   ├── 适合信任的命令
   └── 安全策略: allowlist / full

2. sandbox — Docker 容器内执行
   ├── 文件系统隔离
   ├── 网络隔离
   ├── 资源限制（CPU/内存/PID）
   └── 安全策略: deny (默认) → allowlist

3. node — 远程设备执行
   ├── 通过 Node App 执行
   ├── 需要配对设备
   └── 适合移动设备场景
```

## 🔧 Docker 沙箱配置

```typescript
// 源码: src/config/types.sandbox.ts
type SandboxDockerSettings = {
  image?: string;                    // Docker 镜像
  containerPrefix?: string;          // 容器名前缀
  workdir?: string;                  // 工作目录 (默认 /workspace)
  readOnlyRoot?: boolean;            // 只读根文件系统
  tmpfs?: string[];                  // tmpfs 挂载
  network?: string;                  // 网络模式: bridge|none|custom
  user?: string;                     // 容器用户 (uid:gid)
  capDrop?: string[];                // 丢弃 Linux 能力
  env?: Record<string, string>;      // 额外环境变量
  setupCommand?: string;             // 容器创建后执行一次的命令
  pidsLimit?: number;                // PID 限制
  memory?: string | number;          // 内存限制 (e.g. "512m", "2g")
  memorySwap?: string | number;      // Swap 限制
  cpus?: number;                     // CPU 限制 (e.g. 0.5, 1, 2)
  ulimits?: Record<string, string | number | { soft?: number; hard?: number }>;
  seccompProfile?: string;           // Seccomp 配置文件
  apparmorProfile?: string;          // AppArmor 配置
  dns?: string[];                    // DNS 服务器
  extraHosts?: string[];             // 额外 host 映射
  binds?: string[];                  // 额外 bind 挂载
  dangerouslyAllowReservedContainerTargets?: boolean;
  dangerouslyAllowExternalBindSources?: boolean;
  dangerouslyAllowContainerNamespaceJoin?: boolean;
};
```

### Docker 沙箱示例

```yaml
# config.yaml
sandbox:
  docker:
    image: "openclaw/sandbox:latest"
    network: "none"           # 无网络
    readOnlyRoot: true        # 只读根
    pidsLimit: 100            # 最多 100 进程
    memory: "512m"            # 512MB 内存
    cpus: 1                   # 1 核
    capDrop: ["ALL"]          # 丢弃所有能力
    tmpfs: ["/tmp:size=100m"] # /tmp 为 tmpfs
```

## 🔌 SSH 沙箱配置

```typescript
// 源码: src/config/types.sandbox.ts
type SandboxSshSettings = {
  target?: string;                    // SSH 目标 (user@host[:port])
  command?: string;                   // SSH 命令 (默认 "ssh")
  workspaceRoot?: string;             // 远程工作区根目录
  strictHostKeyChecking?: boolean;    // 主机密钥验证 (默认 true)
  updateHostKeys?: boolean;           // 允许更新主机密钥 (默认 true)
  identityFile?: string;              // 私钥路径
  certificateFile?: string;           // 证书路径
  knownHostsFile?: string;            // known_hosts 路径
  identityData?: SecretInput;         // 内联私钥
  certificateData?: SecretInput;      // 内联证书
  knownHostsData?: SecretInput;       // 内联 known_hosts
};
```

### SSH 沙箱示例

```yaml
# config.yaml
sandbox:
  ssh:
    target: "dev@remote-server"
    workspaceRoot: "/home/dev/openclaw-workspace"
    identityFile: "~/.ssh/id_ed25519"
    strictHostKeyChecking: true
```

## 🌐 浏览器沙箱

```typescript
// 源码: src/config/types.sandbox.ts
type SandboxBrowserSettings = {
  enabled?: boolean;           // 启用浏览器沙箱
  image?: string;              // Docker 镜像
  containerPrefix?: string;    // 容器前缀
  network?: string;            // Docker 网络
  cdpPort?: number;            // CDP 端口
  cdpSourceRange?: string;     // CDP 允许 CIDR
  vncPort?: number;            // VNC 端口
  noVncPort?: number;          // noVNC 端口
  headless?: boolean;          // 无头模式
  enableNoVnc?: boolean;       // 启用 noVNC
  allowHostControl?: boolean;  // 允许主机浏览器控制
  autoStart?: boolean;         // 自动启动 (默认 true)
  autoStartTimeoutMs?: number; // 自动启动超时
};
```

## 📊 沙箱对比

| 特性 | Gateway | Docker Sandbox | SSH Sandbox |
|------|---------|---------------|-------------|
| 隔离程度 | 无 | 完整隔离 | 网络隔离 |
| 性能 | 最快 | 有启动开销 | 网络延迟 |
| 文件系统 | 完全访问 | 限制在工作区 | 限制在远程目录 |
| 网络 | 完全访问 | 可配置 (none/bridge) | 通过 SSH |
| 资源限制 | 无 | CPU/内存/PID | 远程限制 |
| 适用场景 | 信任命令 | 不信任命令 | 远程执行 |

## 🧹 沙箱清理

```typescript
// 源码: src/config/types.sandbox.ts
type SandboxPruneSettings = {
  idleHours?: number;    // 空闲超过 N 小时清理 (0 禁用)
  maxAgeDays?: number;   // 超过 N 天清理 (0 禁用)
};
```

---

下一篇：[RPC 通信](./rpc)