# 学习前提

在开始学习 OpenClaw 源码之前，确保你具备以下基础知识和开发环境。

## 📋 知识储备

### 必备

- **TypeScript** — OpenClaw 完全用 TypeScript 编写，需要熟悉类型系统、泛型、装饰器
- **Node.js** — 理解事件循环、Stream、Worker Threads、Child Process
- **异步编程** — Promise、async/await、可取消的异步操作
- **npm/pnpm** — 包管理、workspace、monorepo 结构

### 推荐了解

- **LLM 基础** — 了解 GPT/Claude 等 LLM 的 API 调用方式、流式响应
- **WebSocket** — 实时双向通信协议
- **进程管理** — Node.js 子进程、守护进程、systemd/launchd
- **消息平台 API** — 至少了解一个（Telegram Bot API、Discord.js 等）

### 可选

- **Rust/WASM** — 理解沙箱隔离的底层原理
- **Cloudflare Workers** — 部署方案之一
- **Docker** — 容器化部署

## 🛠️ 环境准备

### 1. 克隆源码

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
```

### 2. 安装依赖

```bash
# 推荐使用 pnpm（项目使用 workspace）
pnpm install
```

### 3. 编译

```bash
pnpm build
```

### 4. 开发模式

```bash
# 启动 Gateway（开发模式）
pnpm dev

# 或使用 homiclaw CLI
homiclaw gateway start --dev
```

## 📖 推荐阅读顺序

```
指南篇(入门) → 理念篇(设计思想) → 架构篇(整体结构)
    → 运行时篇(核心流程) → 通道篇(消息通道) → 插件篇(扩展)
    → 进阶篇(深度) → 部署篇(上线)
```

## 📚 相关资源

- [OpenClaw 官方文档](https://docs.openclaw.ai)
- [OpenClaw GitHub](https://github.com/openclaw/openclaw)
- [OpenClaw Discord 社区](https://discord.gg/openclaw)

---

下一章：[OpenClaw 是什么](./overview)