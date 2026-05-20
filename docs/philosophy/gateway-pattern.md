# Gateway 模式设计哲学

深入理解 OpenClaw 选择 Gateway 模式的设计哲学，以及它带来的架构优势。

## 🏛️ 核心哲学

### 1. 单进程单写（Single Writer）

OpenClaw 的核心设计约束：**同一 Session 的消息串行处理**。

```
为什么？
  → LLM 是有状态的（需要完整上下文）
  → 并发写入会导致上下文不一致
  → 丢失之前回复的消息会导致幻觉

怎么做？
  → Lane Queue 保证串行
  → 单 Gateway 进程管理所有 Lane
  → 不需要分布式锁
```

### 2. 插件优先（Plugin First）

```
核心原则：任何可以外置的模块，都应该外置。

Gateway 核心（不可外置）：
  ├── Lane Queue
  ├── Session 管理
  ├── Agent 循环
  └── 工具路由

可外置（插件）：
  ├── Channel（Telegram / Discord / ...）
  ├── Provider（OpenAI / Anthropic / ...）
  ├── Tool（exec / search / ...）
  └── Skill（自定义技能包）
```

### 3. 本地优先（Local First）

```
所有状态在本地：
  ├── 配置：~/.homiclaw/config.yaml
  ├── 会话：~/.homiclaw/sessions/
  ├── 工作区：~/.homiclaw/workspace/
  └── 状态：~/.homiclaw/state/

不依赖：
  ├── 云数据库
  ├── Redis
  ├── 外部消息队列
  └── 云端 API（除了 LLM 调用）
```

### 4. 安全默认（Secure by Default）

```
默认安全，显式放宽：
  ├── exec 工具：默认需要审批
  ├── 网络请求：默认阻止内网
  ├── 文件写入：默认限制在工作区
  ├── API Key：本地加密存储
  └── Gateway：仅监听 localhost
```

## 🔄 Hub-and-Spoke vs 其他模式

### P2P 模式

```
用户 ←→ AI Agent ←→ 工具

问题：
  - 每个 Agent 独立管理状态
  - 跨平台上下文同步极难
  - NAT 穿透复杂
  - 可靠性差
```

### Serverless 模式

```
事件 → Lambda → LLM → 响应

问题：
  - 冷启动延迟 (1-3秒)
  - 状态管理复杂
  - 无法主动推送
  - 工具执行受限
```

### Gateway 模式（OpenClaw）

```
通道 ←→ Gateway ←→ Provider

优势：
  ✅ 0 冷启动
  ✅ 统一状态管理
  ✅ 主动推送（Cron / Heartbeat）
  ✅ 本地工具执行
  ✅ 单写保证
```

## 📐 六个设计决策

### 决策 1：为什么选 TypeScript？

```
1. Node.js 生态成熟（Telegram/Discord SDK）
2. 异步天生适合 I/O 密集型
3. 单线程事件循环 → 天然串行
4. 类型安全 → 大项目可维护
5. 前后端同语言 → WebChat 共享代码
```

### 决策 2：为什么用 Lane Queue 而非 Actor 模型？

```
Lane Queue = 简化版 Actor
  - 每个 Lane 能处理一种消息
  - Promise 链实现，不需要 Actor 框架
  - 内存开销极低
  - 调试简单（单进程单线程）
```

### 决策 3：为什么用文件持久化而非数据库？

```
1. 零运维 — 无需安装和管理数据库
2. 可移植 — 复制目录即可迁移
3. 可读性 — JSON 文件直接查看
4. 性能 — 本地 SSD 读写快
5. 备份 — rsync / git 即可
```

### 决策 4：为什么不是微服务？

```
1. 单进程部署更简单
2. 无 IPC 开销
3. 无分布式一致性问题
4. 资源占用更低（单进程 < 200MB RAM）
5. Lane Queue 天然串行，不需要分布式锁
```

### 决策 5：为什么 Provider 是插件？

```
1. 新 Provider 只需实现接口
2. 无需修改核心代码
3. 用户按需安装
4. 版本解耦
5. 社区可贡献
```

### 决策 6：为什么工具执行需要审批？

```
LLM 生成的内容不可信：
  - 可能执行危险命令 (rm -rf /)
  - 可能访问敏感文件 (/etc/passwd)
  - 可能发起网络请求 (SSRF)

审批机制是"人机协作"的安全阀。
```

---

下一篇：[Lane Queue 串行化](./lane-queue)