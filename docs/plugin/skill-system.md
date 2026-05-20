# Skill 技能系统

Skill 是 OpenClaw 的可扩展技能包，让 Agent 获得特定领域的能力。

## 🎯 Skill 是什么

```
Skill = SKILL.md + 可选脚本

SKILL.md 定义：
  - 触发条件（什么时候使用）
  - 操作步骤（如何执行）
  - 可用工具（需要哪些工具）
  - 输出格式（结果如何呈现）
```

## 📁 Skill 目录结构

```
~/.homiclaw/skills/
└── weather/
    ├── SKILL.md         ← 技能定义
    └── scripts/         ← 可选脚本
        └── fetch.py     ← Python 脚本
```

## 📝 SKILL.md 示例

```markdown
# Weather Skill

## 触发条件
当用户询问天气信息时使用此技能。

## 操作步骤
1. 使用 web_search 工具搜索 "[城市] 天气"
2. 提取温度、天气状况、湿度
3. 用简洁格式回复用户

## 输出格式
🏙️ {城市} 天气
🌡️ 温度：{temp}°C
🌤️ 天气：{condition}
💧 湿度：{humidity}%
```

## 🔄 Skill 触发流程

```
用户消息
    ↓
Agent 读取 SKILL.md (注入到 System Prompt)
    ↓
Agent 判断是否匹配触发条件
    ↓ 匹配
按操作步骤执行
    ↓
返回格式化结果
```

---

下一篇：[MCP 集成](./mcp-integration)
