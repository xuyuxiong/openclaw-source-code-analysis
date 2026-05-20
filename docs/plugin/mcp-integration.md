# MCP Server 集成

OpenClaw 支持 Model Context Protocol (MCP) 协议，接入外部工具服务。

## 🏗️ MCP 架构

```
OpenClaw Gateway
    ↓ MCP 协议 (JSON-RPC)
MCP Server
    ├── 工具注册
    ├── 工具调用
    └── 资源访问
```

## 🔧 配置

```yaml
# config.yaml
mcp:
  servers:
    - name: "internal-api"
      command: "node"
      args: ["internal-api-mcp-server.js"]
      env:
        API_KEY: "xxx"
```

## 📊 MCP vs 内置 Tool

| 特性 | 内置 Tool | MCP Server |
|------|----------|------------|
| 执行方式 | Gateway 内部 | 外部进程 |
| 性能 | 更快 | 有 IPC 开销 |
| 安全 | Gateway 安全策略 | 独立隔离 |
| 开发 | TypeScript | 任意语言 |
| 部署 | 随 Gateway | 独立部署 |

---

下一篇：[自定义插件开发](./custom-plugin)
