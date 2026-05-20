# 整体架构

OpenClaw 的整体架构概览，理解各模块如何协同工作。

## 🏗️ 架构全景

```
┌────────────────────────────────────────────────────────────┐
│                    消息通道 (18+ Channels)                   │
│  Telegram  Discord  WhatsApp  Signal  Slack  飞书  iMessage  │
│  IRC  Matrix  MS Teams  Google Chat  LINE  Nostr  Zalo ...  │
└──────────────────────────┬─────────────────────────────────┘
                           ↓ 消息标准化
┌────────────────────────────────────────────────────────────┐
│                      Gateway Core                          │
│                                                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│  │  Main    │ │  Cron    │ │ Subagent │ │  Nested  │     │
│  │  Lane    │ │  Lane    │ │  Lane    │ │  Lane    │     │
│  │ (concurrent=1) │ (concurrent=N) │ (concurrent=1) │     │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘     │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Agent Runtime (Agent Loop)               │  │
│  │  System Prompt → LLM Call → Tool Call → LLM Call... │  │
│  │  Compaction (200K ctx, 1.2x safety margin)          │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                            │
│  ┌─────────────┐ ┌─────────────┐ ┌──────────────────┐    │
│  │ Tool System │ │ Cron System │ │ Session Manager  │    │
│  │ deny/allow/ │ │ at/every/   │ │ lifecycle +      │    │
│  │ full + loop │ │ cron +      │ │ persistent store │    │
│  │ detection   │ │ retry       │ │                  │    │
│  └─────────────┘ └─────────────┘ └──────────────────┘    │
└──────────────────────────┬─────────────────────────────────┘
                           ↓
┌────────────────────────────────────────────────────────────┐
│                    Provider 扩展 (30+)                      │
│  Anthropic  OpenAI  Google  Ollama  DeepSeek  Groq  ...    │
│  OpenRouter  LiteLLM  vLLM  SGLang  Moonshot  Qianfan ...  │
└────────────────────────────────────────────────────────────┘
```

## 📁 源码目录结构

```
openclaw/
├── src/                           # 核心源码
│   ├── gateway/                   # Gateway 核心
│   │   ├── server-startup.ts      # 启动流程
│   │   ├── server-lanes.ts        # Lane 并发配置
│   │   ├── boot.ts                # BOOT.md 执行
│   │   ├── session-*.ts           # Session 管理
│   │   ├── exec-approval-*.ts     # 审批管理
│   │   └── ...
│   ├── agents/                    # Agent Runtime
│   │   ├── compaction.ts          # 上下文压缩
│   │   ├── defaults.ts            # 默认模型 (claude-opus-4-6)
│   │   ├── provider-stream.ts     # Provider 流式接口
│   │   ├── auth-profiles.ts       # 认证配置
│   │   ├── subagent-*.ts          # 子代理管理
│   │   ├── tools/                 # 内置工具
│   │   │   ├── bash-tools.ts      # exec 工具
│   │   │   ├── cron-tool.ts       # Cron 工具
│   │   │   ├── nodes-tool.ts      # Node 设备工具
│   │   │   ├── message-tool.ts    # 消息工具
│   │   │   ├── web-search.ts      # 搜索工具
│   │   │   ├── web-fetch.ts       # 抓取工具
│   │   │   ├── image-tool.ts      # 图片工具
│   │   │   ├── pdf-tool.ts        # PDF 工具
│   │   │   ├── sessions-spawn-tool.ts  # 子代理工具
│   │   │   └── ...                # 更多工具
│   │   └── ...
│   ├── plugins/                   # 插件系统
│   │   ├── types.ts               # 插件接口定义
│   │   ├── registry.ts            # 插件注册表
│   │   ├── loader.ts              # 插件加载
│   │   ├── provider-runtime.ts    # Provider 运行时
│   │   └── ...
│   ├── channels/                  # 通道系统
│   │   ├── plugins/               # Channel 插件
│   │   └── ...
│   ├── cron/                      # Cron 调度
│   │   ├── service.ts             # 核心调度
│   │   ├── schedule.ts            # croner 调度计算
│   │   ├── types.ts               # 完整类型定义
│   │   ├── isolated-agent.ts      # 隔离 Agent 运行
│   │   └── delivery.ts            # 投递逻辑
│   ├── process/                   # 进程管理
│   │   ├── lanes.ts               # 4 条 Lane 枚举
│   │   └── command-queue.ts       # 并发队列实现
│   ├── config/                    # 配置系统
│   │   ├── types.ts               # 聚合导出
│   │   ├── types.tools.ts         # 工具配置类型
│   │   ├── types.sandbox.ts       # 沙箱配置类型
│   │   ├── types.cron.ts          # Cron 配置类型
│   │   ├── types.channels.ts      # 通道配置类型
│   │   └── config.ts              # 配置加载
│   ├── security/                  # 安全模块
│   │   ├── audit.ts               # 审计日志
│   │   ├── skill-scanner.ts       # Skill 安全扫描
│   │   └── ...
│   ├── context-engine/            # 上下文引擎
│   └── ...
│
├── extensions/                    # 87 个扩展
│   ├── anthropic/                 # Anthropic Claude
│   ├── openai/                    # OpenAI GPT
│   ├── google/                    # Google Gemini
│   ├── ollama/                    # 本地模型
│   ├── deepseek/                  # DeepSeek
│   ├── telegram/                  # Telegram 通道
│   ├── discord/                   # Discord 通道
│   ├── whatsapp/                  # WhatsApp 通道
│   ├── brave/                     # Brave 搜索
│   ├── deepgram/                  # Deepgram 语音
│   ├── memory-lancedb/            # 向量记忆
│   └── ...                        # 更多扩展
│
├── docs/                          # 官方文档
└── package.json                   # 包定义 (name: "openclaw")
```

## 🔑 核心数据流

```
用户消息 → Channel Plugin → 消息标准化 → Lane Queue → Agent Runtime
    ↓
Agent Runtime:
1. 构建 System Prompt (SOUL.md + USER.md + AGENTS.md + 技能文件)
2. 拼接上下文 (Conversation History + Workspace Files)
3. 调用 Provider (Anthropic/OpenAI/Google/...)
4. 流式接收响应
5. 如果有 Tool Call → 执行工具 → 回到 2
6. 纯文本回复 → 出站标准化 → Channel Plugin → 用户
```

## 📊 关键指标

| 指标 | 数值 |
|------|------|
| Provider 扩展 | 30+ |
| Channel 扩展 | 18+ |
| 内置工具 | 22 |
| Lane 数量 | 4 (Main/Cron/Subagent/Nested) |
| 默认上下文窗口 | 200,000 tokens |
| 默认模型 | claude-opus-4-6 |
| Compaction 安全边际 | 1.2x |
| Cron 重试退避 | 30s → 60s → 300s |
| Exec 安全策略 | deny / allowlist / full |

---

下一篇：[Gateway 核心](./gateway-core)