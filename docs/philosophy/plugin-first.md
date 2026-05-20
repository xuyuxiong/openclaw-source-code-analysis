# 插件优先架构

OpenClaw 最重要的设计哲学：任何可以外置的模块，都应该外置为插件。

## 🎯 核心原则

```
如果明天一个新的 LLM 出现了，
  → 写一个 Provider 插件，50 行代码

如果明天一个新的聊天平台出现了，
  → 写一个 Channel 插件，100 行代码

如果明天一个新的工具需要集成了，
  → 写一个 Tool 注册，30 行代码

核心代码零修改。
```

## 🏗️ 插件体系

```
OpenClaw 插件层次
├── Provider 插件 (LLM 接入)
│   ├── plugin-openai        → GPT-4 / GPT-5
│   ├── plugin-anthropic     → Claude
│   ├── plugin-google        → Gemini
│   ├── plugin-ollama        → 本地模型
│   └── plugin-mistral       → Mistral
│
├── Channel 插件 (消息通道)
│   ├── plugin-telegram      → Telegram Bot API
│   ├── plugin-discord       → Discord.js
│   ├── plugin-whatsapp      → Baileys
│   ├── plugin-signal        → Signal CLI
│   ├── plugin-slack         → Slack Bolt
│   ├── plugin-webchat       → WebSocket + React
│   └── plugin-imessage      → BlueBubbles
│
├── Tool 插件 (内置工具)
│   ├── exec                 → Shell 命令执行
│   ├── read / write / edit  → 文件操作
│   ├── web_search / fetch   → 网络访问
│   ├── image / pdf          → 多媒体处理
│   ├── cron                 → 定时任务
│   └── message / tts        → 消息 & 语音
│
└── Skill 插件 (技能包)
    ├── skill-weather        → 天气查询
    ├── skill-healthcheck    → 安全检查
    └── custom skills        → 用户自定义
```

## 🔌 Plugin SDK

```typescript
// 最小的 Provider 插件
import { ProviderPlugin, CompletionRequest, CompletionResponse } from '@openclaw/plugin-sdk'

export class MyProvider implements ProviderPlugin {
  name = 'my-provider'

  models = [
    { id: 'my-provider/my-model', name: 'My Model', contextWindow: 32768 }
  ]

  async validateAuth(): Promise<boolean> {
    return !!process.env.MY_API_KEY
  }

  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    const response = await fetch('https://api.my-llm.com/v1/chat', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.MY_API_KEY}` },
      body: JSON.stringify({
        model: request.model,
        messages: request.messages,
        tools: request.tools
      })
    })
    return response.json()
  }

  async *completeStream(request: CompletionRequest): AsyncIterable<StreamChunk> {
    // SSE 流式处理
  }
}
```

## 📐 插件注册机制

```
Gateway 启动
    ↓
1. 扫描 plugins/ 目录
    ↓
2. 加载 plugin manifest (package.json)
    ↓
3. 验证接口实现
    ↓
4. 注册到 Plugin Registry
    ├── Provider → ProviderManager.register()
    ├── Channel → ChannelManager.register()
    └── Tool → ToolDispatcher.register()
    ↓
5. 初始化插件 (start())
    ↓
6. 通知 Gateway 就绪
```

## 🆚 对比其他框架

| 特性 | OpenClaw | LangChain | AutoGPT |
|------|----------|-----------|---------|
| Provider 插件 | ✅ 独立包 | ⚠️ 内置 | ⚠️ 硬编码 |
| Channel 插件 | ✅ 独立包 | ❌ | ❌ |
| Tool 插件 | ✅ 独立注册 | ⚠️ 装饰器 | ⚠️ 硬编码 |
| 插件热加载 | ⚠️ 需重启 | ❌ | ❌ |
| 社区插件 | ✅ npm | ✅ pip | ⚠️ 有限 |

---

下一篇：[安全与隔离理念](./security-isolation)