# 插件系统总览

OpenClaw 的插件体系：Provider、Channel、Tool、Skill 四大插件类型。

## 🏗️ 插件层次

```
Gateway Core
    ↓ 加载
Plugin Registry
    ├── Provider Plugins (LLM 接入)
    ├── Channel Plugins (消息通道)
    ├── Tool Implementations (工具实现)
    └── Skill Packages (技能包)
```

## 📦 插件类型

| 类型 | 职责 | 接口 | 示例 |
|------|------|------|------|
| Provider | LLM 接入 | ProviderPlugin | OpenAI, Anthropic |
| Channel | 消息通道 | ChannelPlugin | Telegram, Discord |
| Tool | 工具实现 | ToolDefinition | exec, read, write |
| Skill | 技能包 | SKILL.md + scripts | weather, healthcheck |

## 🔧 插件生命周期

```
1. 发现 — 扫描 plugins/ 目录和 npm 包
2. 加载 — require/import 插件模块
3. 验证 — 检查接口实现
4. 注册 — 注册到 Plugin Registry
5. 初始化 — 调用 start()
6. 运行 — 正常工作
7. 关闭 — 调用 stop()
```

---

下一篇：[Plugin SDK](./plugin-sdk)
