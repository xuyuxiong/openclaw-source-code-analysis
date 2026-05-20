# Gateway 生命周期

Gateway 从启动到关闭的完整生命周期。

## 启动流程

```
homiclaw gateway start
    ↓
1. 加载配置 (config.yaml)
    ↓
2. 初始化状态 (State Store)
    ↓
3. 启动 RPC Server (CLI 通信)
    ↓
4. 注册内置工具
    ↓
5. 加载 Provider 插件
    ↓
6. 加载 Channel 插件
    ↓
7. 启动 Cron Scheduler
    ↓
8. 启动 Control UI (WebChat)
    ↓
9. 启动 Heartbeat
    ↓
10. 通知就绪 (CLI / 通知)
```

## 运行状态

```
运行中的 Gateway 负责：
├── 监听所有 Channel 的入站消息
├── 维护 Session 状态
├── 调度 Cron 任务
├── 执行 Heartbeat 检查
├── 响应 CLI 命令 (通过 RPC)
├── 管理 Node 设备
└── 记录审计日志
```

## 关闭流程

```
homiclaw gateway stop
    ↓
1. 停止接受新消息
    ↓
2. 等待当前 Lane 任务完成 (最多 30s)
    ↓
3. 保存所有活跃 Session
    ↓
4. 断开 Channel 连接
    ↓
5. 停止 Cron Scheduler
    ↓
6. 停止 RPC Server
    ↓
7. 退出进程
```

## 崩溃恢复

```
Gateway 崩溃后：
1. systemd / launchd 自动重启
2. 从磁盘恢复 Session 历史
3. 重新连接 Channel
4. 重新加载 Cron 任务
5. Lane 状态丢失（内存），但 Session 上下文保留
```

## 健康检查

```bash
homiclaw gateway status
# 显示：PID、运行时间、通道状态、Session 数、最近错误

homiclaw status
# 更详细：+ Provider 状态 + 内存使用 + 磁盘使用
```

---

下一篇：[消息处理流程](./message-flow)
