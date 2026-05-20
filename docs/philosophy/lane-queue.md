# Lane Queue 串行化

Lane Queue 是 OpenClaw 最独特的设计，也是一种哲学：**宁可排队，也不要并发混乱**。

## 💡 核心理念

```
LLM 需要完整上下文才能给出好的回复
  → 上下文必须是一致的
  → 一致性要求串行写入
  → 串行写入 = Lane Queue
```

类比：银行柜台
```
Bank Teller Model:
  每个柜台（Session/Channel）一次只服务一个客户
  客户排队等候
  不同柜台可以并行
  但同一柜台必须串行
```

## 🔄 Lane vs Mutex vs Queue

| 机制 | 粒度 | 行为 | 适用场景 |
|------|------|------|---------|
| **Mutex** | 全局 | 同一时刻只有一个操作 | 太粗，浪费并发 |
| **Queue** | 全局 | 所有操作排队 | 太粗，不同 Session 之间不必要串行 |
| **Lane** | Session | 同一 Session 串行，跨 Session 并行 | ✅ 粒度刚好 |

```
Mutex: A → B → C → D → E → F   (全部串行，B 要等 A 完)
Queue: A → B → C → D → E → F   (同上)
Lane:  Lane1: A → D → F        (Session1 的消息串行)
       Lane2: B → E             (Session2 的消息串行)
       Lane3: C                 (Session3 的消息)
       → 三条 Lane 并行执行 ✅
```

## 💡 为何不用乐观锁

```
乐观锁：先并发执行，冲突时重试

LLM 场景的冲突代价极高：
  - 每次 LLM 调用花费 $0.01-0.30
  - 每次调用耗时 2-10 秒
  - 冲突重试 = 白花钱 + 用户等更久

串行化虽然排队，但不会浪费 LLM 调用。
```

---

下一篇：[插件优先架构](./plugin-first)