# 源码目录结构

理解 OpenClaw 源码的组织方式，是深入学习的第一步。

## 📁 顶层结构

```
openclaw/
├── packages/
│   ├── gateway/              # 🏠 核心：Gateway 守护进程
│   ├── plugin-sdk/           # 🔌 插件开发 SDK
│   ├── plugin-openai/        # 🤖 OpenAI Provider 插件
│   ├── plugin-anthropic/     # 🤖 Anthropic Provider 插件
│   ├── plugin-telegram/      # 📱 Telegram Channel 插件
│   ├── plugin-discord/       # 📱 Discord Channel 插件
│   ├── plugin-whatsapp/      # 📱 WhatsApp Channel 插件
│   ├── plugin-signal/        # 📱 Signal Channel 插件
│   ├── plugin-slack/         # 📱 Slack Channel 插件
│   ├── plugin-webchat/       # 💬 WebChat Channel 插件
│   ├── plugin-imessage/      # 📱 iMessage Channel 插件
│   └── ...                   # 更多插件
├── cli/                      # ⌨️ CLI 命令行工具
├── docs/                     # 📚 文档
├── skills/                   # 🎯 内置技能
├── scripts/                  # 🔧 构建/发布脚本
├── pnpm-workspace.yaml       # Workspace 配置
├── tsconfig.json             # TypeScript 配置
└── package.json              # 根 package.json
```

## 🏠 packages/gateway — 核心包

Gateway 是 OpenClaw 的心脏，所有核心逻辑都在这里：

```
packages/gateway/src/
├── core/                     # 核心模块
│   ├── gateway.ts            # Gateway 主入口
│   ├── session.ts            # 会话管理
│   ├── lane-queue.ts         # Lane Queue 串行化
│   ├── agent-runtime.ts      # Agent 运行时
│   ├── tool-dispatcher.ts    # 工具调度
│   ├── provider-manager.ts   # Provider 管理
│   ├── cron-scheduler.ts     # 定时任务
│   └── node-manager.ts       # 设备管理
│
├── channels/                 # 通道基础设施
│   ├── channel-plugin.ts     # Channel 插件接口
│   ├── message-normalizer.ts # 消息标准化
│   ├── inbound-handler.ts    # 入站处理
│   └── outbound-handler.ts   # 出站处理
│
├── providers/                # Provider 基础设施
│   ├── provider-plugin.ts    # Provider 插件接口
│   ├── completion.ts         # LLM 调用
│   ├── streaming.ts          # 流式响应
│   └── token-counter.ts      # Token 计数
│
├── runtime/                  # 运行时
│   ├── agent-loop.ts         # Agent 循环
│   ├── tool-executor.ts      # 工具执行
│   ├── context-window.ts     # 上下文窗口
│   ├── compaction.ts         # 上下文压缩
│   ├── subagent.ts           # 子代理
│   └── heartbeat.ts          # 心跳
│
├── security/                 # 安全
│   ├── sandbox.ts            # 沙箱
│   ├── approval.ts           # 审批
│   ├── policy.ts             # 策略
│   └── audit.ts              # 审计
│
├── config/                   # 配置系统
│   ├── schema.ts             # 配置 Schema
│   ├── loader.ts             # 配置加载
│   ├── validation.ts         # 配置校验
│   └── defaults.ts           # 默认值
│
├── state/                    # 状态持久化
│   ├── store.ts              # 状态存储
│   ├── session-store.ts      # 会话存储
│   └── migration.ts          # 状态迁移
│
├── rpc/                      # 进程间通信
│   ├── server.ts             # RPC 服务端
│   └── client.ts             # RPC 客户端
│
└── utils/                    # 工具函数
    ├── logger.ts             # 日志
    ├── retry.ts              # 重试
    └── abort.ts              # 取消
```

## 🔌 packages/plugin-sdk — 插件开发 SDK

```
packages/plugin-sdk/src/
├── core.ts                   # 插件核心接口
├── provider.ts               # Provider 插件基类
├── channel.ts                # Channel 插件基类
├── tool.ts                   # Tool 注册接口
├── routing.ts                # 路由接口
├── sandbox.ts                # 沙箱接口
└── runtime.ts                # 运行时环境接口
```

## 📱 Channel 插件结构（以 Telegram 为例）

```
packages/plugin-telegram/src/
├── index.ts                  # 插件入口（导出注册函数）
├── telegram-channel.ts       # Channel 实现
├── message-mapper.ts         # 消息映射（Telegram → OpenClaw）
├── outbound.ts               # 出站消息（OpenClaw → Telegram）
├── media-handler.ts          # 媒体处理（图片、文件）
└── bot-setup.ts              # Bot 初始化
```

## 🤖 Provider 插件结构（以 OpenAI 为例）

```
packages/plugin-openai/src/
├── index.ts                  # 插件入口
├── openai-provider.ts        # Provider 实现
├── completion.ts             # 补全接口（chat/completions）
├── streaming.ts              # 流式响应处理
├── models.ts                 # 模型列表与配置
└── auth.ts                   # API Key 认证
```

## 🔗 模块依赖关系

```
                    ┌─────────────┐
                    │    CLI      │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │   Gateway   │ ← 主进程
                    └──────┬──────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
    ┌──────▼──────┐ ┌─────▼──────┐ ┌──────▼──────┐
    │  Channels   │ │  Runtime   │ │  Providers  │
    │  (×7)       │ │  Agent     │ │  (×10)      │
    └──────┬──────┘ └─────┬──────┘ └──────┬──────┘
           │               │               │
           └───────────────┼───────────────┘
                           │
                    ┌──────▼──────┐
                    │  Plugin SDK │ ← 插件接口
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │   Config    │ ← 配置中心
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │   State     │ ← 状态持久化
                    └─────────────┘
```

## 📊 核心模块说明

| 模块 | 职责 | 关键文件 |
|------|------|---------|
| **Gateway** | 主进程，管理生命周期 | gateway.ts |
| **Lane Queue** | 消息串行化队列 | lane-queue.ts |
| **Session** | 会话上下文管理 | session.ts |
| **Agent Runtime** | LLM 调用循环 | agent-loop.ts |
| **Tool Dispatcher** | 工具调用路由 | tool-dispatcher.ts |
| **Channel Plugin** | 通道抽象接口 | channel-plugin.ts |
| **Provider Plugin** | LLM 提供者接口 | provider-plugin.ts |
| **Cron Scheduler** | 定时任务调度 | cron-scheduler.ts |
| **Sandbox** | 工具执行沙箱 | sandbox.ts |
| **Compaction** | 上下文压缩 | compaction.ts |

---

下一章：[调试源码](./debugging)