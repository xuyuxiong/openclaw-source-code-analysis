# 错误处理与重试

OpenClaw 的多层错误处理和自动重试机制。

## 🛡️ 错误层级

```
Layer 1: LLM 调用错误
  ├── 超时 → 重试 (最多 3 次)
  ├── 429 Rate Limit → 指数退避重试
  ├── 500 Server Error → 重试
  ├── 401 Auth Error → 不重试，提示检查 API Key
  └── 其他错误 → 记录日志，通知用户

Layer 2: 工具执行错误
  ├── 超时 → 返回超时错误给 LLM
  ├── 权限不足 → 请求审批或返回错误
  ├── 命令不存在 → 返回错误给 LLM
  └── 执行异常 → 返回 stderr 给 LLM

Layer 3: 通道错误
  ├── 连接断开 → 自动重连
  ├── 发送失败 → 重试 (最多 3 次)
  └── 通道限制 → 降级处理

Layer 4: Gateway 错误
  ├── 未捕获异常 → 记录日志，继续运行
  ├── 内存不足 → 释放缓存
  └── 磁盘满 → 清理旧 Session
```

## 🔄 重试策略

```typescript
const retryConfig = {
  maxRetries: 3,
  baseDelay: 1000,      // 1 秒
  maxDelay: 30000,      // 30 秒
  backoff: 'exponential' // 指数退避
}

// 重试延迟计算
function getDelay(attempt: number): number {
  return Math.min(
    baseDelay * Math.pow(2, attempt),  // 1s, 2s, 4s
    maxDelay                            // 最大 30s
  )
}
```

## 🐛 常见问题

### Q: LLM 返回 429 怎么办？

```
自动重试，指数退避：
第1次重试: 等 1 秒
第2次重试: 等 2 秒
第3次重试: 等 4 秒
如果仍失败，切换到 fallback Provider
```

### Q: 工具执行失败会怎样？

```
错误信息返回给 LLM，LLM 可以：
1. 修改参数重试
2. 换一个工具
3. 告知用户失败原因
```

---

下一篇：[通道系统总览](../channel/overview)
