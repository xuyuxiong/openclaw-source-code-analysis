# 为什么需要 OpenClaw

理解 OpenClaw 解决的核心问题，以及为什么选择 Gateway 模式。

## 🤔 痛点

### 碎片化的 AI 体验

```
没有 OpenClaw 的世界：
───────────────────────────────────────
ChatGPT 网页 → 打开浏览器登录
Claude 网页   → 打开另一个浏览器标签
Telegram Bot → 自己部署一个
Discord Bot  → 自己部署另一个
WhatsApp Bot → 又要另外部署
───────────────────────────────────────
5 个平台 = 5 个 AI 实例 = 5 份上下文 = 0 连续性
```

### 没有记忆，没有工具

```
普通 LLM 聊天：
- 无记忆：每次开新会话从零开始
- 无工具：不能帮你读文件、执行命令、搜索网页
- 无主动性：只是一问一答，不会主动提醒
- 无连续性：换个平台就丢失所有上下文
```

### 安全和隐私顾虑

```
云端 AI 助手：
- 数据发给第三方 → 隐私风险
- API Key 托管在云端 → 安全风险
- 无法自定义行为 → 灵活性差
- 依赖云服务 → 可用性受制
```

## 💡 OpenClaw 的解法

### 1. 统一入口

```
有了 OpenClaw：
───────────────────────────────────────
Telegram ──┐
Discord ───┤
WhatsApp ──┼──→ Gateway ──→ 同一个 AI 助手
Signal ────┤    (自托管)     同一份记忆
WebChat ───┤                 同一套工具
Slack ─────┘
───────────────────────────────────────
6 个平台 = 1 个 AI = 1 份上下文 = 完整连续性
```

### 2. 记忆 + 工具 + 主动性

```
OpenClaw Agent：
- ✅ 记忆：AGENTS.md / MEMORY.md / 日常笔记
- ✅ 工具：exec / read / write / search / cron / ...
- ✅ 主动性：Heartbeat / Cron / Wake Event
- ✅ 连续性：跨平台共享 Session
```

### 3. 本地优先

```
自托管意味着：
- ✅ 数据在你自己的机器上
- ✅ API Key 在本地配置文件中
- ✅ 可以自定义 SOUL.md 改变人格
- ✅ 可以开发自定义 Skill 和 Plugin
```

## 🏗️ 为什么是 Gateway 模式

### 对比方案

| 方案 | 优点 | 缺点 |
|------|------|------|
| **Gateway 模式** | 统一入口、本地优先、低延迟 | 需要常驻进程 |
| Serverless | 无需运维 | 冷启动、状态管理复杂 |
| 客户端直连 | 简单 | 无法多通道、无法主动推送 |
| P2P | 去中心化 | 复杂性极高、NAT 穿透难 |

### Gateway 模式的优势

```
1. 常驻进程 → 0 冷启动、实时响应
2. 统一入口 → 所有通道收口，1 份上下文
3. 本地执行 → 工具调用无网络延迟
4. 主动能力 → Cron / Heartbeat / Wake
5. 离线可用 → 本地模型 (Ollama) 无需联网
```

## 📊 OpenClaw 的演进

```
v0.1 (2025.11)  "Clawdbot"
  → Telegram Bot + OpenAI API
  → 单通道、单模型

v0.5 (2025.12)  "Moltbot"
  → 多通道：Telegram + Discord + WhatsApp
  → Lane Queue 串行化
  → Skill 系统

v1.0 (2026.01)  "OpenClaw"
  → 插件优先重构
  → Provider 插件化
  → Channel 插件化
  → Plugin SDK

v2.0 (2026.03)  "HomiClaw" (蚂蚁内部版)
  → 钉钉集成
  → 内部 MCP Server
  → 行政/会议/假期系统

v2.5 (2026.05)  当前版本
  → Node 设备管理
  → ACP Runtime
  → Sub-Agent 系统
```

## 🎯 OpenClaw 适合谁

| 角色 | 使用场景 |
|------|---------|
| **个人开发者** | 全平台 AI 助手，自动化日常任务 |
| **团队** | 共享 AI 助手，团队知识库，定时提醒 |
| **企业** | 内部 AI 平台，集成内部系统，合规审计 |
| **研究者** | Agent 架构研究，LLM 工程化实践 |

---

下一篇：[Gateway 模式设计哲学](./gateway-pattern)