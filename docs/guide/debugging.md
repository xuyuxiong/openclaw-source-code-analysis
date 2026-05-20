# 调试源码

手把手教你搭建 OpenClaw 源码调试环境，一步步断点跟踪消息流转。

## 🛠️ 开发环境搭建

### 1. 克隆并编译

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm build
```

### 2. 开发模式启动

```bash
# 启动 Gateway（开发模式，输出详细日志）
pnpm dev

# 或指定日志级别
LOG_LEVEL=debug homicide gateway start
```

### 3. VSCode 调试配置

创建 `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Gateway",
      "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/homiclaw",
      "args": ["gateway", "start"],
      "env": {
        "LOG_LEVEL": "debug",
        "NODE_OPTIONS": "--enable-source-maps"
      },
      "console": "integratedTerminal",
      "sourceMaps": true
    }
  ]
}
```

## 🔍 断点调试关键流程

### 消息入站：从 Telegram 到 Lane Queue

```
断点位置                           调试目标
──────────────────────────────────────────────
telegram-channel.ts: onMessage    → 查看原始消息格式
message-normalizer.ts: normalize  → 查看标准化后的消息
inbound-handler.ts: handle        → 查看路由逻辑
lane-queue.ts: enqueue            → 查看排队机制
```

### Agent 循环：从消息到 LLM 调用

```
断点位置                           调试目标
──────────────────────────────────────────────
agent-loop.ts: runTurn            → Agent 循环入口
context-window.ts: buildMessages  → 查看发给 LLM 的消息
provider/openai.ts: complete      → 查看 API 请求
streaming.ts: processChunk        → 查看流式响应块
```

### 工具调用：从 LLM 响应到执行

```
断点位置                           调试目标
──────────────────────────────────────────────
tool-dispatcher.ts: dispatch       → 工具路由
sandbox.ts: execute                → 沙箱执行
approval.ts: requestApproval      → 审批流程
tool-executor.ts: runTool         → 实际执行
```

## 📊 日志系统

### 日志级别

```bash
# 开发环境推荐
LOG_LEVEL=debug homicide gateway start

# 仅关注特定模块
LOG_LEVEL=debug LOG_FILTER=lane-queue,agent-runtime homicide gateway start
```

### 关键日志标记

```
[lane-queue]  enqueue    → 消息入队
[lane-queue]  dequeue    → 消息出队处理
[agent]       turn-start → Agent 循环开始
[agent]       tool-call  → 工具调用
[agent]       turn-end   → Agent 循环结束
[provider]    request    → LLM API 请求
[provider]    response   → LLM API 响应
[channel]     inbound    → 入站消息
[channel]     outbound   → 出站消息
```

## 🧪 单元测试

```bash
# 运行所有测试
pnpm test

# 运行特定模块
pnpm test -- packages/gateway/src/core/lane-queue.test.ts

# Watch 模式
pnpm test -- --watch
```

## 🔧 常用调试技巧

### 1. 使用 homiclaw status 查看运行状态

```bash
homiclaw status              # 总体状态
homiclaw gateway status      # Gateway 进程状态
homiclaw models              # 可用模型
homiclaw channels            # 通道连接状态
```

### 2. 查看会话历史

```bash
# 列出活跃会话
homiclaw sessions list

# 查看特定会话
homiclaw sessions show <session-key>
```

### 3. 模拟消息

```bash
# 通过 CLI 直接发送消息测试
homiclaw chat "你好，OpenClaw"
```

### 4. Inspection API

Gateway 暴露了本地 HTTP API 用于调试：

```bash
# 查看 Gateway 信息
curl http://localhost:3271/api/status

# 查看会话列表
curl http://localhost:3271/api/sessions
```

---

下一篇：[为什么需要 OpenClaw](../philosophy/why-openclaw)