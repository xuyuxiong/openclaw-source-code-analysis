# Tool 工具系统

深入 OpenClaw 的 Tool 系统，理解工具注册、调度、沙箱执行、审批机制的完整流程。

## 🏗️ Tool 系统架构

```
LLM 返回 Tool Call
    ↓
Tool Dispatcher（路由）
    ↓
┌─────────────────────────────────────────┐
│            权限检查 (Policy)             │
│  ┌─────────┐ ┌─────────┐ ┌──────────┐  │
│  │ allow   │ │ allow-  │ │  deny    │  │
│  │ (放行)  │ │ list    │ │  (拒绝)  │  │
│  │         │ │ (审批)  │ │          │  │
│  └────┬────┘ └────┬────┘ └────┬─────┘  │
│       ↓           ↓           ↓         │
│     执行    请求用户批准    返回错误      │
└─────────────────────────────────────────┘
    ↓
Sandbox（沙箱执行）
    ↓
返回结果给 LLM
```

## 📦 内置工具清单

| 工具 | 权限 | 说明 |
|------|------|------|
| `exec` | allowlist | 执行 shell 命令 |
| `read` | allow | 读取文件 |
| `write` | allow | 写入文件 |
| `edit` | allow | 编辑文件 |
| `web_search` | allow | 搜索网页 |
| `web_fetch` | allow | 抓取网页 |
| `image` | allow | 分析图片 |
| `pdf` | allow | 分析 PDF |
| `cron` | allow | 定时任务管理 |
| `message` | allow | 发送消息 |
| `tts` | allow | 文本转语音 |
| `nodes` | allow | 设备管理 |
| `gateway` | allow | Gateway 配置 |
| `sessions` | allow | 会话管理 |

## 🔧 工具注册

```typescript
// 工具定义接口
interface ToolDefinition {
  name: string                    // 工具名，LLM 看到的名称
  description: string             // 描述，帮助 LLM 决定何时调用
  parameters: JSONSchema          // 参数 JSON Schema
  execute: (params, context) => Promise<ToolResult>
}

// 注册示例：read 工具
const readTool: ToolDefinition = {
  name: 'read',
  description: 'Read file contents. Supports text files and images.',
  parameters: {
    type: 'object',
    properties: {
      file: { type: 'string', description: 'File path' },
      offset: { type: 'number', description: 'Start line' },
      limit: { type: 'number', description: 'Max lines' }
    },
    required: ['file']
  },
  execute: async (params, context) => {
    const { file, offset, limit } = params
    const content = await context.fs.readFile(file, { offset, limit })
    return { type: 'text', content }
  }
}
```

## 🔄 Tool Call 流程

### 1. LLM 返回 Tool Call

```json
{
  "type": "function",
  "function": {
    "name": "exec",
    "arguments": "{\"command\": \"ls -la\"}"
  }
}
```

### 2. Tool Dispatcher 路由

```typescript
class ToolDispatcher {
  private tools: Map<string, ToolDefinition> = new Map()

  async dispatch(toolCall: ToolCall, context: ToolContext): Promise<ToolResult> {
    const tool = this.tools.get(toolCall.name)

    if (!tool) {
      return { type: 'error', content: `Unknown tool: ${toolCall.name}` }
    }

    // 权限检查
    const policy = this.checkPolicy(tool.name, toolCall.arguments, context)
    if (policy === 'deny') {
      return { type: 'error', content: `Tool ${tool.name} is denied` }
    }
    if (policy === 'approval') {
      const approved = await this.requestApproval(tool.name, toolCall.arguments)
      if (!approved) {
        return { type: 'error', content: `Tool ${tool.name} was not approved` }
      }
    }

    // 参数校验
    const validated = this.validateParams(tool, toolCall.arguments)

    // 沙箱执行
    return await this.sandbox.execute(tool, validated, context)
  }
}
```

### 3. 沙箱执行

```
Tool Dispatcher
    ↓
Sandbox Manager
    ├── exec 工具 → 子进程（受限制）
    ├── read/write 工具 → 文件系统（受限制路径）
    ├── web 工具 → 网络请求（受限制域名）
    └── 其他工具 → Gateway 主进程
```

### 4. 返回结果

```typescript
interface ToolResult {
  type: 'text' | 'image' | 'error'
  content: string | Buffer
  metadata?: {
    exitCode?: number      // exec 工具的退出码
    mimeType?: string      // 内容类型
    truncated?: boolean    // 是否截断
  }
}
```

## 🛡️ 权限策略

```yaml
# config.yaml
tools:
  exec:
    enabled: true
    security: allowlist       # full | allowlist | deny
    # full: 所有命令直接执行
    # allowlist: 白名单命令直接执行，其他需审批
    # deny: 禁止执行

  read:
    enabled: true
    security: full
    allowedPaths:
      - ~/.homiclaw/workspace
      - ~/Desktop
      - ~/Documents

  write:
    enabled: true
    security: full
    allowedPaths:
      - ~/.homiclaw/workspace

  web_search:
    enabled: true
    security: full

  web_fetch:
    enabled: true
    security: full
    blockedDomains:
      - internal.company.com  # 阻止内网
```

### 审批流程

```
exec: "rm -rf /"
    ↓
Policy: allowlist → 不在白名单 → 需要审批
    ↓
Channel 发送审批消息给用户：
  "⚠️ exec 工具请求执行: rm -rf /
   /approve 允许 / /deny 拒绝"
    ↓
用户回复 /approve
    ↓
执行命令 → 返回结果
```

## 💡 工具开发最佳实践

### 1. 描述要精确

```typescript
// ❌ 差的描述
description: 'Read a file'

// ✅ 好的描述
description: 'Read file contents. Supports text files (jpg, png, gif, webp) and images. Output truncated to 2000 lines.'
```

### 2. 参数 Schema 要完整

```typescript
// ✅ 完整的参数定义
parameters: {
  type: 'object',
  properties: {
    command: {
      type: 'string',
      description: 'Shell command to execute. Use pty=true for TTY-required commands.'
    },
    timeout: {
      type: 'number',
      description: 'Timeout in seconds. Default: 15.',
      default: 15
    },
    workdir: {
      type: 'string',
      description: 'Working directory. Defaults to cwd.'
    }
  },
  required: ['command']
}
```

### 3. 错误处理要友好

```typescript
execute: async (params, context) => {
  try {
    const result = await doSomething(params)
    return { type: 'text', content: result }
  } catch (err) {
    // ❌ 不要暴露内部错误
    // return { type: 'error', content: err.stack }

    // ✅ 友好的错误消息
    return { type: 'error', content: `Failed to read file: ${err.message}` }
  }
}
```

## 🐛 常见问题

### Q: 工具执行超时怎么办？

```
exec 工具有 timeout 参数，默认 15 秒。
对于长时间运行的命令，设置 timeout=300。
超时后进程被 SIGTERM 终止。
```

### Q: 如何禁用特定工具？

```yaml
tools:
  exec:
    enabled: false    # 禁用 exec 工具
  web_search:
    enabled: false    # 禁用搜索
```

### Q: 工具调用结果可以很长，会被截断吗？

```
会。Tool Result 有最大长度限制（默认 10000 字符）。
超出部分会被截断，metadata.truncated = true。
LLM 收到截断标记可以选择分页读取。
```

---

下一篇：[Cron 定时任务](./cron-system)