# Node 设备系统

深入 OpenClaw 的 Node 设备管理，理解配对、通知、远程控制的完整机制。

## 🏗️ Node 是什么

Node 是配对到 Gateway 的远程设备（手机、电脑等），让 AI 助手可以：
- 发送通知到设备
- 拍照（手机摄像头）
- 截屏（电脑屏幕）
- 获取位置信息
- 执行远程命令

```
OpenClaw Gateway
    ↓ 配对
Node 设备 (手机/电脑)
    ├── 📸 摄像头
    ├── 📱 截屏
    ├── 📍 位置
    └── 🔔 通知
```

## 🔄 配对流程

```
1. 用户发起配对
   homiclaw pair
   
2. Gateway 生成配对码
   → 显示 6 位数字码

3. 在 Node App 输入配对码
   → Node 连接 Gateway
   → 交换设备信息
   → 设备信任建立

4. 配对完成
   → Node 出现在设备列表
   → 支持通知 / 摄像头 / 截屏 / 位置
```

## 📊 Node 能力

| 能力 | 方法 | 说明 |
|------|------|------|
| 通知 | `notify` | 发送推送通知 |
| 拍照 | `camera_snap` | 前后摄像头拍照 |
| 录像 | `camera_clip` | 短视频录制 |
| 截屏 | `screen_record` | 屏幕录制 |
| 位置 | `location_get` | 获取 GPS 位置 |
| 图库 | `photos_latest` | 获取最新照片 |
| 通知列表 | `notifications_list` | 读取设备通知 |
| 调用 | `invoke` | 调用设备方法 |

## 🔧 使用示例

```yaml
# Agent 可以通过 nodes 工具调用设备能力
# 拍照
nodes(action: "camera_snap", nodeId: "iphone", facing: "back")

# 截屏
nodes(action: "screen_record", nodeId: "macbook", durationMs: 5000)

# 获取位置
nodes(action: "location_get", nodeId: "iphone")

# 发送通知
nodes(action: "notify", nodeId: "iphone", title: "提醒", body: "该开会了")
```

## 🐛 常见问题

### Q: Node 离线了怎么办？

```
Gateway 会检测 Node 在线状态。
离线时调用 Node 工具会返回错误："Node is offline"。
Node 重新上线后会自动重连。
```

### Q: 一个 Gateway 可以配对多少设备？

```
没有硬性限制，通常 2-5 个设备：
- 1 个手机
- 1-2 个电脑
- 1 个平板
```

---

下一篇：[部署总览](../deploy/overview)