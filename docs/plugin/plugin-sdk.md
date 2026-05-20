# Plugin SDK

OpenClaw 插件开发 SDK，定义了所有插件接口。

## 📦 安装

```bash
npm install @openclaw/plugin-sdk
```

## 🔌 核心 API

```typescript
// Provider 插件
import { ProviderPlugin, CompletionRequest, CompletionResponse } from '@openclaw/plugin-sdk'

// Channel 插件
import { ChannelPlugin, InboundMessage, OutboundMessage, Gateway } from '@openclaw/plugin-sdk'

// Tool 注册
import { ToolDefinition, ToolContext, ToolResult } from '@openclaw/plugin-sdk'

// 路由接口
import { RoutingPlugin } from '@openclaw/plugin-sdk/routing'

// 运行时环境
import { RuntimeEnv } from '@openclaw/plugin-sdk/runtime'
```

## 🔧 Provider 插件模板

```typescript
import { ProviderPlugin, ModelDefinition } from '@openclaw/plugin-sdk'

export class MyProvider implements ProviderPlugin {
  name = 'my-provider'

  models: ModelDefinition[] = [
    {
      id: 'my-provider/my-model',
      name: 'My Model',
      contextWindow: 32768,
      inputPrice: 0.01,   // per 1M tokens
      outputPrice: 0.03,
      capabilities: ['streaming', 'function_calling']
    }
  ]

  async validateAuth(): Promise<boolean> {
    return !!process.env.MY_API_KEY
  }

  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    // 实现 LLM API 调用
  }

  async *completeStream(request: CompletionRequest): AsyncIterable<StreamChunk> {
    // 实现流式调用
  }
}
```

---

下一篇：[Provider 插件](./provider-plugin)
