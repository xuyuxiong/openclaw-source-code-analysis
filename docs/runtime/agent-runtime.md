# Agent Runtime

Agent Runtime 是 OpenClaw 的"大脑"，管理 LLM 调用循环、上下文拼接、工具调用的完整生命周期。

## 🔄 Agent Loop

Agent Loop 是一个反复调用 LLM 的循环，直到 LLM 不再请求工具调用：

```
用户消息
    ↓
┌──────────────────────────────────┐
│         Agent Loop               │
│                                  │
│  1. 构建上下文                    │
│     ├── System Prompt            │
│     ├── Workspace Files          │
│     └── Conversation History     │
│                                  │
│  2. 调用 LLM                     │
│     ↓                            │
│  3. 收到响应                      │
│     ├── 纯文本 → 退出循环，发送回复│
│     └── Tool Call → 执行工具     │
│          ↓                       │
│     4. 工具结果 → 回到步骤 1      │
│        (Tool Result 附加到上下文) │
│                                  │
└──────────────────────────────────┘
    ↓
发送最终回复给用户
```

## 📝 上下文构建

每轮 LLM 调用前，Agent Runtime 构建完整的消息数组：

```typescript
function buildMessages(session: Session): Message[] {
  const messages: Message[] = []

  // 1. System Prompt
  messages.push({
    role: 'system',
    content: buildSystemPrompt(session)
  })

  // 2. Workspace Files (注入到 system 或首条用户消息)
  //    AGENTS.md, SOUL.md, USER.md, TOOLS.md, MEMORY.md, SKILL.md

  // 3. 时间信息
  //    当前时间、时区、星期几

  // 4. 通道信息
  //    通道类型、特殊指令

  // 5. Conversation History (经过 Compaction 压缩)
  messages.push(...session.context.getHistory())

  // 6. 最新用户消息
  messages.push({
    role: 'user',
    content: latestUserMessage
  })

  return messages
}
```

### System Prompt 组成

```
[System Prompt]
├── 身份定义 (SOUL.md)     "你是一个个人AI助手..."
├── 行为规范 (AGENTS.md)   "先读文件，再行动..."
├── 用户信息 (USER.md)     "用户名：张三，时区：UTC+8"
├── 工具备注 (TOOLS.md)    "摄像头：客厅、前门"
├── 技能文件 (SKILL.md)    "当用户说X时，使用Y技能"
├── 通道指令               "此通道不支持Markdown表格"
├── 安全规则               "不要泄露私密数据..."
└── 时间                   "当前时间：2026-05-20 11:00 UTC+8"
```

## 🔧 工具调用循环

```
Agent Turn 1:
  LLM → "让我搜索一下天气" [tool_call: web_search("北京天气")]

Tool Execution:
  web_search("北京天气") → "晴，25°C"

Agent Turn 2:
  LLM → "北京今天晴天，25度。" [无 tool_call → 结束]

回复用户: "北京今天晴天，25度。"
```

### 多轮工具调用

```
Agent Turn 1: tool_call: exec("ls /data")
Tool Result:  "file1.csv  file2.csv"

Agent Turn 2: tool_call: read("/data/file1.csv")
Tool Result:  "date,value\n2026-01,100\n..."

Agent Turn 3: tool_call: read("/data/file2.csv")
Tool Result:  "date,value\n2026-01,200\n..."

Agent Turn 4: "两个文件数据汇总：1月总计300" (纯文本，结束)
```

### 工具调用限制

```
最大连续 Tool Call: 50 次/轮（防止无限循环）
最大 Token 预算: 由模型上下文窗口决定
超时: 单次 Tool 执行默认 15 秒（可配置）
```

## 🧩 Sub-Agent 子代理

```
主 Agent
    ↓ spawn
子 Agent (独立 Session)
    ↓ 独立 Lane
子 Agent 完成 ← 结果推送
    ↓
主 Agent 继续
```

子代理有独立的上下文窗口和工具权限，不共享主代理的历史。

## 💓 Heartbeat 心跳

```
Gateway 定期轮询主 Session：

  "检查 HEARTBEAT.md，有事就做，没事 HEARTBEAT_OK"

Agent 响应：
  ├── HEARTBEAT_OK → 无事可做，静默
  ├── 主动消息 → 发送提醒/新闻/日历
  └── 工具调用 → 执行检查任务

心跳间隔: ~30 分钟（可配置）
```

## 🐛 常见问题

### Q: Agent 循环会不会无限跑？

```
不会。有保护机制：
1. 最大 Tool Call 次数限制 (50)
2. Token 预算耗尽时强制停止
3. 超时保护
4. 如果 LLM 总是返回 Tool Call，最终会触发限制
```

### Q: 多轮工具调用的中间结果用户能看到吗？

```
取决于 Channel：
- WebChat：可以看到每一步工具调用
- Telegram：只看到最终回复
- 可以配置显示/隐藏工具调用过程
```

---

下一篇：[消息处理流程](./message-flow)