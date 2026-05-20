# OpenClaw 是什么

OpenClaw 是一个开源的、自托管的 AI 个人助手框架。你运行一个常驻 Gateway 进程，它连接你所有的聊天平台（Telegram、Discord、WhatsApp、Signal、Slack 等），将消息路由给 LLM，并将回复发回。

## 🦞 一句话概括

**OpenClaw = Gateway + Agent Runtime + 多通道 + 插件系统**

```
用户 ─── Telegram ──┐
用户 ─── Discord ───┤                    ┌── GPT-4
用户 ─── WhatsApp ──┼── Gateway ─────────┼── Claude
用户 ─── Signal ────┤   (你的机器上)     ┼── Gemini
用户 ─── Slack ─────┤                    └── 本地模型
用户 ─── WebChat ───┘
                      │
                      ├── Agent Runtime（会话、工具、上下文）
                      ├── Tool 系统（exec、read、write、web...）
                      ├── Skill 系统（可扩展的技能包）
                      ├── Cron 定时任务
                      └── Node 设备管理
```

## 🎯 核心特征

| 特征 | 说明 |
|------|------|
| **自托管** | 所有数据在你自己的机器上，不经过第三方 |
| **多通道** | 一个 Gateway 连接所有聊天平台 |
| **插件优先** | Provider、Channel、Tool 都是可插拔的 |
| **TypeScript** | 纯 TypeScript 实现，无 Python/Rust 依赖 |
| **安全隔离** | Lane Queue 串行化、沙箱执行、审批机制 |
| **可扩展** | Skill 系统 + Plugin SDK + MCP 协议 |

## 🏗️ 快速架构图

```
┌────────────────────────────────────────────────────┐
│                   OpenClaw Gateway                  │
│                                                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ Telegram  │ │ Discord  │ │ WhatsApp │ ... ×7   │  ← Channel Plugins
│  │ Plugin    │ │ Plugin   │ │ Plugin   │           │
│  └─────┬────┘ └─────┬────┘ └─────┬────┘           │
│        └─────────────┼─────────────┘                │
│                      ↓                              │
│              ┌──────────────┐                       │
│              │  Lane Queue   │ ← 串行化消息处理      │  ← Core
│              └──────┬───────┘                       │
│                     ↓                               │
│  ┌──────────────────────────────────────┐          │
│  │          Agent Runtime               │          │
│  │  ┌──────┐ ┌────────┐ ┌───────────┐  │          │
│  │  │Session│ │Context │ │Tool Call  │  │          │  ← Runtime
│  │  │Manager│ │Window  │ │Dispatcher │  │          │
│  │  └──────┘ └────────┘ └───────────┘  │          │
│  └──────────────────────────────────────┘          │
│                     ↓                               │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐      │
│  │ OpenAI │ │Anthropic│ │ Google │ │ Ollama │ ...  │  ← Provider Plugins
│  └────────┘ └────────┘ └────────┘ └────────┘      │
└────────────────────────────────────────────────────┘
```

## 🆚 与其他框架对比

| 特性 | OpenClaw | LangChain | AutoGPT | CrewAI |
|------|----------|-----------|---------|--------|
| 语言 | TypeScript | Python | Python | Python |
| 自托管 | ✅ 完全 | ⚠️ 部分 | ✅ | ⚠️ 部分 |
| 多通道 | ✅ 7+ | ❌ | ❌ | ❌ |
| Gateway 模式 | ✅ | ❌ | ❌ | ❌ |
| 插件系统 | ✅ 完整 | ⚠️ 部分 | ⚠️ 部分 | ❌ |
| Lane Queue | ✅ | ❌ | ❌ | ❌ |
| Skill 系统 | ✅ | ❌ | ❌ | ❌ |
| MCP 协议 | ✅ | ⚠️ 部分 | ❌ | ❌ |

## 📊 项目规模

| 指标 | 数量 |
|------|------|
| 核心模块 | ~200+ |
| Channel 插件 | 7+ (Telegram, Discord, WhatsApp, Signal, Slack, WebChat, iMessage) |
| Provider 插件 | 10+ (OpenAI, Anthropic, Google, Ollama, Mistral, ...) |
| 内置 Tool | 15+ (exec, read, write, web_search, image, ...) |
| TypeScript 行数 | ~100K+ |
| npm 包 | @alipay/homiclaw |

## 🚀 5 分钟上手

```bash
# 安装
npm install -g homiclaw

# 初始化（引导式配置）
homiclaw onboard

# 启动 Gateway
homiclaw gateway start

# 连接 Telegram
homiclaw onboard --channel telegram
```

启动后，在 Telegram 上给你的 Bot 发消息，OpenClaw 就会调用 LLM 回复。

---

下一章：[快速上手](./quick-start)