---
layout: home

hero:
  name: OpenClaw源码解析
  tagline: 从 Gateway 到 Agent Runtime，全面掌握 AI Agent 框架核心原理
  actions:
    - theme: brand
      text: 开始学习
      link: /guide/prerequisites
    - theme: alt
      text: GitHub
      link: https://github.com/openclaw/openclaw

features:
  - icon: 🦞
    title: 纯 TypeScript
    details: 完整 TypeScript 实现，无需 Python/Rust 依赖，Node.js 运行时即可启动
  - icon: 🔌
    title: 87 个扩展
    details: Provider、Channel、Tool 全部可插拔，30+ LLM Provider、18+ 消息通道、搜索/语音/图片等扩展
  - icon: 📡
    title: 多通道统一
    details: 18+ 通道统一 Gateway 收口：Telegram、Discord、WhatsApp、Signal、Slack、飞书、iMessage 等
  - icon: 🔒
    title: 安全隔离
    details: 4 Lane 并发控制、Docker/SSH 沙箱、exec 审批、工具循环检测，多层安全防线
  - icon: 🧠
    title: Agent Runtime
    details: 完整的 Agent 生命周期管理，支持子代理、上下文压缩、流式响应、Cron 定时任务
  - icon: 🏠
    title: 自托管
    details: 数据本地、代码开源，默认使用 Claude 跑本地 Gateway，你的 AI 助手完全由你掌控
---

## 📋 内容概览

### 指南篇
学习前的准备工作，环境搭建、快速上手

### 理念篇
Gateway 模式、Lane Queue、插件优先、安全隔离的设计哲学

### 架构篇
Gateway 核心、Session、4 Lane Queue、Provider (87个扩展)、Tool 安全策略、Cron 重试、Node 设备

### 运行时篇
生命周期、消息流、Agent Runtime、Streaming、Compaction (200K上下文)、Heartbeat

### 通道篇
18+ 通道实现：Telegram、Discord、WhatsApp、Signal、Slack、飞书、iMessage、IRC、Matrix等

### 插件篇
Plugin SDK、87 个扩展详解、Provider 插件、Channel 插件、Skill、MCP 集成

### 进阶篇
安全、Docker/SSH 沙箱、配置、工具循环检测、RPC、状态持久化、性能优化

### 部署篇
本地 / Docker / Cloudflare / 自托管 Provider (Ollama/vLLM/SGLang) 部署方案

## 👥 谁适合学习？

- ✅ 对 AI Agent 框架架构感兴趣
- ✅ 熟悉 TypeScript / Node.js
- ✅ 想理解 LLM 应用工程化实践
- ✅ 想为 OpenClaw 贡献代码或开发插件

## 📝 关于本项目

本项目基于 OpenClaw 官方开源仓库源码（`openclaw@2026.3.27`），深入解析 Gateway 架构、Agent Runtime、87 个扩展插件、多通道系统等核心模块。

所有内容基于真实源码交叉验证，包括：
- `src/process/command-queue.ts` — 4 Lane 并发控制
- `src/cron/types.ts` — Cron 调度与重试机制
- `src/agents/compaction.ts` — 上下文压缩与分块策略
- `src/agents/defaults.ts` — 默认模型 claude-opus-4-6、200K 上下文
- `src/config/types.tools.ts` — 完整工具安全策略
- `src/config/types.sandbox.ts` — Docker/SSH/Browser 沙箱配置
- `extensions/` — 87 个扩展插件

特点：
- 🔍 **源码级深度** — 不只是 API 文档，讲透设计决策
- 📊 **架构图丰富** — 每章配备数据流图和模块关系图
- ✅ **源码交叉验证** — 所有内容基于真实 TypeScript 源码
- 🧪 **实战示例** — 可运行的插件开发、配置示例
- 🐛 **常见问题** — FAQ 解答