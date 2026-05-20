# 插件系统总览

OpenClaw 的插件体系：87 个扩展覆盖 LLM Provider、消息通道、搜索、语音、记忆等全部能力。

## 🏗️ 插件层次

```
Gateway Core
    ↓ 加载
Plugin Registry (registry.ts)
    ├── Provider 扩展 (LLM 接入)
    │   ├── anthropic, openai, google     ← 主流 LLM
    │   ├── ollama, vllm, sglang          ← 本地/开源
    │   ├── deepseek, qianfan, moonshot   ← 中国厂商
    │   ├── groq, mistral, together       ← 其他厂商
    │   └── openrouter, litellm           ← 代理/网关
    │
    ├── Channel 扩展 (消息通道)
    │   ├── telegram, discord, whatsapp   ← 即时通讯
    │   ├── signal, slack, irc            ← 其他平台
    │   ├── imessage (bluebubbles)        ← Apple
    │   ├── feishu, googlechat, msteams   ← 企业通讯
    │   └── line, matrix, nostr, zalo     ← 更多平台
    │
    ├── Tool 扩展 (工具能力)
    │   ├── browser, phone-control        ← 设备控制
    │   ├── brave, duckduckgo, exa        ← 搜索引擎
    │   ├── deepgram, elevenlabs          ← 语音处理
    │   └── image-generation-core, fal    ← 图片生成
    │
    ├── Infrastructure 扩展 (基础设施)
    │   ├── memory-core, memory-lancedb   ← 向量记忆
    │   ├── diagnostics-otel              ← OpenTelemetry
    │   ├── device-pair                   ↔ Node 配对
    │   └── thread-ownership              ← 线程管理
    │
    └── ACP/编码扩展
        ├── acpx                          ← ACP 协议
        ├── opencode, opencode-go         ← OpenCode
        ├── kilocode                      ← KiCode
        └── openshell                     ← OpenShell
```

## 📦 完整扩展列表（87 个）

### Provider 扩展（26 个）

| 扩展 | 说明 |
|------|------|
| `anthropic` | Claude 系列（默认 Provider） |
| `anthropic-vertex` | Claude via Google Vertex AI |
| `openai` | GPT 系列 |
| `google` | Gemini 系列 |
| `deepseek` | DeepSeek |
| `groq` | Groq (LPU 加速) |
| `mistral` | Mistral AI |
| `ollama` | 本地模型（Ollama） |
| `vllm` | 本地模型（vLLM） |
| `sglang` | 本地模型（SGLang） |
| `together` | Together AI |
| `huggingface` | Hugging Face Inference |
| `nvidia` | NVIDIA NIM |
| `xai` | xAI (Grok) |
| `chutes` | Chutes |
| `venice` | Venice AI |
| `openrouter` | OpenRouter 代理 |
| `litellm` | LiteLLM 代理 |
| `cloudflare-ai-gateway` | Cloudflare AI Gateway |
| `vercel-ai-gateway` | Vercel AI Gateway |
| `copilot-proxy` | GitHub Copilot 代理 |
| `qianfan` | 百度千帆 |
| `moonshot` | Moonshot (Kimi) |
| `minimax` | MiniMax |
| `volcengine` | 火山引擎 |
| `byteplus` | BytePlus |
| `xiaomi` | 小米 |
| `modelstudio` | ModelStudio |
| `microsoft` | Microsoft Azure AI |
| `microsoft-foundry` | Azure AI Foundry |
| `github-copilot` | GitHub Copilot |
| `zai` | ZAI |
| `kimi-coding` | Kimi Coding |
| `perplexity` | Perplexity |

### Channel 扩展（18 个）

| 扩展 | 说明 |
|------|------|
| `telegram` | Telegram Bot |
| `discord` | Discord Bot |
| `whatsapp` | WhatsApp (Baileys) |
| `signal` | Signal (signal-cli) |
| `slack` | Slack Bolt |
| `imessage` (bluebubbles) | iMessage (BlueBubbles) |
| `irc` | IRC |
| `googlechat` | Google Chat |
| `msteams` | Microsoft Teams |
| `feishu` | 飞书 |
| `line` | LINE |
| `matrix` | Matrix |
| `mattermost` | Mattermost |
| `nostr` | Nostr |
| `twitch` | Twitch |
| `synology-chat` | 群晖 Chat |
| `nextcloud-talk` | Nextcloud Talk |
| `zalo` / `zalouser` | Zalo |

### 其他扩展

| 分类 | 扩展 |
|------|------|
| 搜索 | `brave`, `duckduckgo`, `exa`, `tavily`, `firecrawl` |
| 语音 | `deepgram`, `elevenlabs`, `speech-core`, `talk-voice`, `voice-call` |
| 图片/媒体 | `image-generation-core`, `media-understanding-core`, `fal` |
| 记忆 | `memory-core`, `memory-lancedb` |
| 浏览器/设备 | `browser`, `phone-control`, `device-pair` |
| 编码 | `acpx`, `opencode`, `opencode-go`, `kilocode`, `openshell`, `open-prose` |
| 基础设施 | `diagnostics-otel`, `diffs`, `lobster`, `thread-ownership`, `shared`, `synthetic` |

## 🔌 插件接口

```typescript
// 源码: src/plugins/types.ts (简化)
interface OpenClawPluginApi {
  // Provider 注册
  registerProvider(provider: ProviderPlugin): void;

  // Channel 注册
  registerChannel(channel: ChannelPlugin): void;

  // Tool 注册
  registerTool(tool: ToolDefinition): void;

  // Hook 注册
  registerHook(hook: HookEntry): void;

  // 配置 Schema
  configSchema?: OpenClawPluginConfigSchema;
}
```

## 🔧 插件生命周期

```
1. 发现 (discovery.ts)
   ├── 扫描 extensions/ 目录
   ├── 扫描 plugins/ 目录
   └── 扫描 npm 全局包

2. 加载 (loader.ts)
   ├── import() 插件模块
   ├── 验证接口实现
   └── 捕获加载错误

3. 注册 (registry.ts)
   ├── Provider → ProviderRegistry
   ├── Channel → ChannelRegistry
   └── Tool → ToolDispatcher

4. 初始化 (runtime.ts)
   ├── validateAuth() — Provider 认证
   ├── start() — Channel 启动
   └── 注册 Hook

5. 运行
   └── 正常服务

6. 关闭
   ├── stop() — Channel 断开
   └── 清理资源
```

## 💡 安全校验

```typescript
// 源码: src/plugins/install-security-scan.ts
// 安装第三方插件前进行安全扫描
// 检查：
// - 包签名验证
// - 危险 API 使用检测
// - 文件系统访问分析
// - 网络请求分析
```

---

下一篇：[Plugin SDK](./plugin-sdk)