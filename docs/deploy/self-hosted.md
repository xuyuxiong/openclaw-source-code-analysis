# 自托管 Provider

使用 Ollama 等本地 LLM 搭建自托管 Provider。

## 🦙 Ollama

```bash
# 安装 Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# 下载模型
ollama pull llama3
ollama pull mistral

# 启动
ollama serve
```

## 🔧 OpenClaw 配置

```yaml
providers:
  ollama:
    baseUrl: http://localhost:11434
    models:
      - id: ollama/llama3
        name: Llama 3
        contextWindow: 8192
      - id: ollama/mistral
        name: Mistral
        contextWindow: 32768
```

## 💡 优势

- ✅ 完全离线运行
- ✅ 无 API 费用
- ✅ 无数据泄露风险
- ✅ 延迟低（本地推理）

## ⚠️ 限制

- ❌ 需要强力 GPU
- ❌ 模型质量不如 GPT-4 / Claude
- ❌ 上下文窗口较小

---

下一篇：[监控与日志](./monitoring)
