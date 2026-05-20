# Workspace 工作区

OpenClaw 工作区是 AI 助手的工作目录，包含所有上下文文件。

## 📁 目录结构

```
~/.homiclaw/workspace/
├── AGENTS.md       ← Agent 行为规范
├── SOUL.md         ← Agent 人格
├── USER.md         ← 用户信息
├── TOOLS.md        ← 工具备注
├── IDENTITY.md     ← Agent 身份
├── MEMORY.md       ← 长期记忆
├── HEARTBEAT.md    ← 心跳任务
└── memory/         ← 日常记忆
    └── 2026-05-20.md
```

## 📝 各文件作用

| 文件 | 作用 | 何时读取 |
|------|------|---------|
| AGENTS.md | 行为规范、红绿线 | 每轮对话 |
| SOUL.md | 人格、语气 | 每轮对话 |
| USER.md | 用户信息 | 每轮对话 |
| TOOLS.md | 工具备注 | 每轮对话 |
| MEMORY.md | 长期记忆 | 仅主 Session |
| HEARTBEAT.md | 心跳检查项 | 心跳时 |
| IDENTITY.md | Agent 身份 | 每轮对话 |

## 🔄 读写规则

```
Agent 可以读取所有工作区文件
Agent 可以编辑 AGENTS.md / MEMORY.md / TOOLS.md 等
Agent 的记忆写入 memory/YYYY-MM-DD.md
MEMORY.md 是精炼的长期记忆，需要定期整理
```

---

下一篇：[配置系统](./configuration)
