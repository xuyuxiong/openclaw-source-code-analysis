# Provider 提供者系统

深入 OpenClaw 的 Provider 插件体系，理解 LLM 接入层的设计与实现。

## 🏗️ 架构总览

```
Agent Runtime
    ↓ resolveModel()
Provider Runtime (provider-runtime.ts)
    ↓ resolveProviderStreamFn()
Provider Plugin (extensions/)
    ↓ HTTP 请求
LLM API (OpenAI / Anthropic / Google / ...)
    ↓ 响应
Provider Plugin
    ↓ 标准化 StreamFn
Agent Runtime (流式处理)
```

## 📊 全部 Provider 扩展

OpenClaw 源码包含 **87 个扩展**，其中 Provider 类扩展的主要列表：

| 分类 | 扩展 | 说明 |
|------|------|------|
| **Anthropic** | `anthropic`, `anthropic-vertex` | Claude 系列（默认 Provider） |
| **OpenAI** | `openai`, `copilot-proxy` | GPT 系列 |
| **Google** | `google` | Gemini 系列 |
| **开源/本地** | `ollama`, `vllm`, `sglang` | 本地模型部署 |
| **中国厂商** | `deepseek`, `qianfan`, `moonshot`, `minimax`, `volcengine`, `byteplus`, `xiaomi`, `zai`, `modelstudio` | 中文 LLM |
| **其他** | `groq`, `mistral`, `together`, `huggingface`, `chutes`, `nvidia`, `xai`, `venice`, `kimi-coding` | 各家 LLM |
| **代理/网关** | `openrouter`, `litellm`, `cloudflare-ai-gateway`, `vercel-ai-gateway` | 代理转发 |
| **语音** | `deepgram`, `elevenlabs`, `speech-core`, `talk-voice`, `voice-call` | TTS/STT |
| **搜索** | `brave`, `duckduckgo`, `exa`, `tavily`, `firecrawl`, `perplexity` | Web 搜索 |
| **媒体** | `image-generation-core`, `media-understanding-core`, `fal` | 图片/音视频 |
| **通道** | `telegram`, `discord`, `whatsapp`, `signal`, `slack`, `imessage` (bluebubbles), `irc`, `googlechat`, `msteams`, `feishu`, `line`, `matrix`, `mattermost`, `nostr`, `twitch`, `synology-chat`, `nextcloud-talk`, `zalo`, `zalouser` | 消息通道 |
| **记忆** | `memory-core`, `memory-lancedb` | 向量记忆 |
| **其他** | `browser`, `phone-control`, `device-pair`, `diagnostics-otel`, `diffs`, `lobster`, `thread-ownership`, `acpx`, `opencode`, `opencode-go`, `kilocode`, `openshell`, `open-prose`, `microsoft`, `microsoft-foundry`, `github-copilot`, `synthetic`, `shared` | 工具/基础设施 |

> **默认模型**：`anthropic/claude-opus-4-6`（源码：`src/agents/defaults.ts`）

## 🔧 Provider 解析流程

```typescript
// 源码: src/agents/provider-stream.ts
function registerProviderStreamForModel(params) {
  // 1. 从插件注册表查找 Provider
  const streamFn = resolveProviderStreamFn({
    provider: params.model.provider,
    config: params.cfg,
    // ...
  });

  // 2. 注册自定义 API
  ensureCustomApiRegistered(params.model.api, streamFn);

  // 3. 返回流式函数
  return streamFn;
}
```

### 模型解析

```typescript
// 源码: src/agents/defaults.ts
export const DEFAULT_PROVIDER = "anthropic";
export const DEFAULT_MODEL = "claude-opus-4-6";
export const DEFAULT_CONTEXT_TOKENS = 200_000;
```

## 📐 Provider 插件开发

```typescript
// 源码: src/plugins/types.ts (简化)
interface ProviderPlugin {
  name: string;

  // 模型目录
  models?: ProviderRuntimeModel[];

  // 认证验证
  validateAuth(params): Promise<AuthResult>;

  // 流式完成
  streamFn?: StreamFn;

  // 模型发现
  discoverModels?(): Promise<ProviderRuntimeModel[]>;

  // 配置 Schema
  configSchema?: OpenClawPluginConfigSchema;
}
```

### Provider 初始化流程

```
Gateway 启动
    ↓
1. 加载所有 plugins/ 目录和 extensions/
    ↓
2. 插件注册到 PluginRegistry
    ↓
3. Provider 验证认证 (validateAuth)
    ↓
4. 发现可用模型 (discoverModels)
    ↓
5. 构建模型目录 (ModelCatalog)
    ↓
6. Agent 请求模型时，从目录查找
    ↓
7. 获取 StreamFn，执行 LLM 调用
```

## 🔑 Auth Profile 认证体系

```typescript
// 源码: src/agents/auth-profiles.ts
// 支持多认证配置（Auth Profile）

type AuthProfile = {
  id: string;            // 认证配置 ID
  provider: string;      // Provider 名称
  apiKey?: string;       // API Key
  // ... 其他认证信息
};

// 优先级：
// 1. Agent 级别指定的 profile
// 2. 全局默认 profile
// 3. 环境变量
```

## 🐛 常见问题

### Q: 如何添加新的 Provider？

```
1. 在 extensions/ 目录创建新文件夹
2. 实现 Provider 插件接口
3. 注册模型列表和 StreamFn
4. 配置 config.yaml 中的 API Key
5. 重启 Gateway
```

### Q: Provider 认证失败怎么办？

```
1. 检查 API Key 是否正确
2. 检查环境变量是否设置
3. 运行 homiclaw doctor 诊断
4. 查看 auth-profiles 健康检查
```

---

下一篇：[Tool 工具系统](./tool-system)