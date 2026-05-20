# Compaction 上下文压缩

当对话历史过长时，OpenClaw 使用 Compaction 压缩旧消息，避免超出 Token 预算。

## 🎯 为什么需要压缩

```
默认上下文窗口: 200,000 tokens (DEFAULT_CONTEXT_TOKENS)
System Prompt + 工具定义: ~5K tokens
每轮对话: ~500-2000 tokens

50 轮对话 ≈ 30K tokens → 还好
200 轮对话 ≈ 150K tokens → 需要压缩
300+ 轮 → 必须压缩
```

> **源码**：默认模型为 `claude-opus-4-6`，默认上下文窗口 `200_000` tokens。
> 源码位置：`src/agents/defaults.ts`

## 🔄 压缩流程

```
1. 估算当前消息的 Token 数（estimateTokens）
2. 超过阈值时触发压缩
3. 按比例分块（splitMessagesByTokenShare）
4. 对每个分块调用 LLM 生成摘要
5. 合并摘要（如果有多个分块）
6. 用摘要替换旧消息，保留近期消息
```

## 🔧 核心实现

### Token 估算

```typescript
// 源码: src/agents/compaction.ts

// 安全边际：estimateTokens 低估 20%，所以除以 1.2
export const SAFETY_MARGIN = 1.2;

// 基础分块比例：对话历史的 40% 用于摘要
export const BASE_CHUNK_RATIO = 0.4;

// 最小分块比例：不会低于 15%
export const MIN_CHUNK_RATIO = 0.15;

// 摘要化开销：为 System Prompt、指令等预留 4096 tokens
export const SUMMARIZATION_OVERHEAD_TOKENS = 4096;

function estimateMessagesTokens(messages: AgentMessage[]): number {
  // 安全：stripToolResultDetails 移除不可信的详细 payload
  const safe = stripToolResultDetails(messages);
  return safe.reduce((sum, message) => sum + estimateTokens(message), 0);
}
```

### 分块策略

```typescript
// 按比例分块
function splitMessagesByTokenShare(
  messages: AgentMessage[],
  parts = 2  // 默认分 2 块
): AgentMessage[][] {
  const totalTokens = estimateMessagesTokens(messages);
  const targetTokens = totalTokens / parts;
  // 按目标 Token 数切分，确保每块大致相等
}

// 按 Token 上限分块
function chunkMessagesByMaxTokens(
  messages: AgentMessage[],
  maxTokens: number
): AgentMessage[][] {
  // 应用安全边际：effectiveMax = maxTokens / SAFETY_MARGIN
  const effectiveMax = Math.floor(maxTokens / SAFETY_MARGIN);
  // 确保 no chunk exceeds effectiveMax
}
```

### 自适应压缩比例

```typescript
// 对话越长，压缩比例越高
function resolveChunkRatio(avgTokens: number, contextWindow: number): number {
  const avgRatio = avgTokens / contextWindow;
  if (avgRatio <= 0.5) return BASE_CHUNK_RATIO;     // 0.4
  // 高对话密度时：压缩更激进
  const reduction = Math.min(avgRatio * 2, BASE_CHUNK_RATIO - MIN_CHUNK_RATIO);
  return Math.max(MIN_CHUNK_RATIO, BASE_CHUNK_RATIO - reduction);  // 最低 0.15
}
```

### 标识符保留策略

```typescript
// 源码: src/agents/pi-extensions/compaction-instructions.ts

// 压缩摘要必须保留的关键标识符
const IDENTIFIER_PRESERVATION_INSTRUCTIONS =
  "Preserve all opaque identifiers exactly as written (no shortening or reconstruction), " +
  "including UUIDs, hashes, IDs, tokens, API keys, hostnames, IPs, ports, URLs, and file names.";

// 标识符保留策略配置
type AgentCompactionIdentifierPolicy = "strict" | "custom" | "off";
// strict: 使用默认指令（保留所有标识符）
// custom: 使用自定义指令
// off: 不保留标识符
```

### 多分块摘要合并

```typescript
// 当对话很长，需要分成多个分块分别摘要时
const MERGE_SUMMARIES_INSTRUCTIONS = [
  "Merge these partial summaries into a single cohesive summary.",
  "",
  "MUST PRESERVE:",
  "- Active tasks and their current status (in-progress, blocked, pending)",
  "- Batch operation progress (e.g., '5/17 items completed')",
  "- The last thing the user requested and what was being done about it",
  "- Decisions made and their rationale",
  "- TODOs, open questions, and constraints",
  "- Any commitments or follow-ups promised",
  "",
  "PRIORITIZE recent context over older history.",
].join("\n");
```

## 📊 完整压缩流程

```
对话历史 (150K tokens)
    ↓
1. stripToolResultDetails()  ← 移除工具结果中的详细 payload
    ↓
2. estimateTokens() × SAFETY_MARGIN (1.2)  ← 保守估算
    ↓
3. 超过 80% 上下文窗口？ → 是 → 触发压缩
    ↓
4. resolveChunkRatio()  ← 计算压缩比例 (0.15 ~ 0.4)
    ↓
5. splitMessagesByTokenShare()  ← 按比例分块
    ↓
6. 对每个分块调用 LLM 生成摘要
   - 附带标识符保留指令
   - 附带自定义压缩指令（如果有）
    ↓
7. 如果有多个分块摘要 → MERGE_SUMMARIES_INSTRUCTIONS 合并
    ↓
8. 用最终摘要替换旧消息
    ↓
压缩后: ~5K 摘要 + 20K 近期对话 + 5K 开销 = ~30K tokens ✅
```

## 🐛 常见问题

### Q: 压缩会丢失信息吗？

```
是的，LLM 摘要可能丢失精确数字、代码、日期。
建议用户用 MEMORY.md 记录重要信息，它不会被压缩。
标识符保留策略 (strict) 会尽量保留 UUID、ID 等关键标识符。
```

### Q: 可以关闭压缩吗？

```
不建议。超出 Token 预算会导致 API 错误。
可以调整压缩阈值和保留消息数量。
可以通过 identifierPolicy: "strict" 确保关键标识符保留。
```

### Q: 工具调用结果中的详细数据怎么办？

```
压缩前会自动 stripToolResultDetails：
移除 toolResult.details 中可能很大的 payload。
只保留工具名称和精简结果。
这是安全措施，防止不可信数据污染摘要。
```

---

下一篇：[Sub-Agent 子代理](./subagent)