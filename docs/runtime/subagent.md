# Sub-Agent 子代理

深入 OpenClaw 的子代理系统，理解任务委派和结果收集机制。

## 🏗️ 架构

```
主 Agent (Main Session)
    ↓ spawn
子 Agent (Isolated Session)
    ├── 独立上下文
    ├── 独立 Lane
    ├── 独立工具权限
    └── 独立 Token 预算
```

## 🔄 子代理生命周期

```
1. 主 Agent 调用 sessions_spawn
    ↓
2. 创建隔离 Session
    ↓
3. 子 Agent 独立执行任务
    ├── 可以调用工具
    ├── 可以生成子代理（递归）
    └── 完成后通知主 Agent
    ↓
4. 主 Agent 收集结果
    ↓
5. 继续主 Agent 流程
```

## 📊 使用场景

| 场景 | 说明 |
|------|------|
| 并行研究 | 多个子代理同时搜索不同主题 |
| 代码审查 | 子代理审查代码，主代理汇总 |
| 文档生成 | 子代理生成章节，主代理组装 |
| 复杂任务 | 子代理处理子任务，主代理协调 |

---

下一篇：[Heartbeat 心跳机制](./heartbeat)
