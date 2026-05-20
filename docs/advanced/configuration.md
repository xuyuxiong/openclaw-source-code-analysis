# 配置系统详解

OpenClaw 的配置系统是其最强大的特性之一，提供了类型安全、热重载、层级覆盖等高级功能。

## 🎯 配置架构

### 配置层级（优先级从高到低）
1. **命令行参数** - 最高优先级，临时覆盖
2. **环境变量** - 系统级配置
3. **用户配置文件** - 个人配置 (~/.openclaw/config.json5)
4. **项目配置文件** - 项目级配置
5. **默认值** - 源码中的默认配置

### 配置格式
支持多种格式：
- **JSON5** (推荐) - 支持注释和宽松语法
- **JSON** - 标准 JSON
- **YAML** - 可选 YAML 支持
- **TOML** - 可选 TOML 支持

## ⚙️ 核心配置结构

### Gateway 配置
```json5
{
  "gateway": {
    // 网络配置
    "port": 18789,
    "bind": "loopback",
    "customBindHost": "192.168.1.100",
    
    // 控制界面
    "controlUi": {
      "enabled": true,
      "basePath": "/openclaw",
      "allowedOrigins": ["https://your-domain.com"],
      "allowInsecureAuth": false
    },
    
    // 认证配置
    "auth": {
      "mode": "token",
      "token": "your-secret-token",
      "rateLimit": {
        "maxAttempts": 10,
        "windowMs": 60000,
        "lockoutMs": 300000
      }
    },
    
    // TLS配置
    "tls": {
      "enabled": false,
      "autoGenerate": true,
      "certPath": "/path/to/cert.pem",
      "keyPath": "/path/to/key.pem"
    },
    
    // 节点配置
    "nodes": {
      "browser": {
        "mode": "auto"
      },
      "allowCommands": ["python", "node"],
      "denyCommands": ["rm", "sudo"]
    },
    
    // 工具配置
    "tools": {
      "deny": ["dangerous-tool"],
      "allow": ["safe-tool"]
    }
  }
}
```

### Agent 配置
```json5
{
  "agents": {
    "defaults": {
      "model": "openai/gpt-4",
      "thinkingDefault": "medium",
      "reasoningDefault": "stream",
      "fastModeDefault": false,
      "heartbeat": {
        "enabled": true,
        "interval": 30
      }
    },
    
    "list": [
      {
        "id": "coding-assistant",
        "name": "编程助手",
        "model": {
          "primary": "openai/gpt-4",
          "fallbacks": ["anthropic/claude-3-sonnet"]
        },
        "skills": ["coding", "debugging"],
        "tools": {
          "allow": ["exec", "fs", "web"],
          "deny": ["dangerous-tool"]
        },
        "sandbox": {
          "workspaceOnly": true
        }
      },
      {
        "id": "creative-writer",
        "name": "创意写作助手",
        "model": "anthropic/claude-3-opus",
        "memorySearch": {
          "enabled": true,
          "sources": ["memory", "sessions"]
        }
      }
    ]
  }
}
```

### 通道配置
```json5
{
  "channels": {
    "defaults": {
      "groupPolicy": "auto",
      "heartbeat": {
        "showOk": false,
        "showAlerts": true
      }
    },
    
    "telegram": {
      "enabled": true,
      "botToken": "123456789:ABCdefGHIjklMNOpqrSTUvwxyz",
      "webhookUrl": "https://your-domain.com/webhook/telegram",
      "accounts": {
        "main": {
          "botToken": "main-bot-token"
        },
        "backup": {
          "botToken": "backup-bot-token"
        }
      }
    },
    
    "discord": {
      "enabled": true,
      "botToken": "MTIzNDU2Nzg5MABC.def.GHIjklMNOpqrSTUvwxyz",
      "intents": ["GUILDS", "GUILD_MESSAGES", "DIRECT_MESSAGES"],
      "dmPolicy": "allow",
      "groupPolicy": {
        "type": "allowlist",
        "groups": ["123456789012345678"]
      }
    },
    
    "slack": {
      "enabled": true,
      "botToken": "xoxb-your-bot-token",
      "appToken": "xapp-your-app-token",
      "signingSecret": "your-signing-secret"
    }
  }
}
```

### 工具配置
```json5
{
  "tools": {
    "profile": "full",
    "allow": ["*"],
    "deny": ["dangerous-tool"],
    
    "web": {
      "search": {
        "enabled": true,
        "provider": "brave",
        "apiKey": "your-brave-key",
        "maxResults": 5,
        "timeoutSeconds": 10
      },
      "fetch": {
        "enabled": true,
        "maxChars": 50000,
        "timeoutSeconds": 30,
        "readability": true
      }
    },
    
    "media": {
      "image": {
        "enabled": true,
        "models": [
          {
            "provider": "openai",
            "model": "gpt-4-vision-preview"
          }
        ]
      },
      "audio": {
        "enabled": true,
        "models": [
          {
            "provider": "openai",
            "model": "whisper-1"
          }
        ]
      }
    },
    
    "exec": {
      "host": "sandbox",
      "security": "allowlist",
      "ask": "on-miss",
      "timeoutSec": 300,
      "workspaceOnly": true
    },
    
    "fs": {
      "workspaceOnly": true
    },
    
    "elevated": {
      "enabled": true,
      "allowFrom": {
        "telegram": ["admin-user-id"],
        "discord": ["admin-user-id"]
      }
    }
  }
}
```

## 🔧 高级配置特性

### 环境变量配置
```bash
# Gateway 配置
export OPENCLAW_GATEWAY_PORT=8080
export OPENCLAW_GATEWAY_BIND=lan
export OPENCLAW_GATEWAY_AUTH_TOKEN=secret-token

# Agent 配置
export OPENCLAW_AGENTS_DEFAULTS_MODEL=openai/gpt-4
export OPENCLAW_OPENAI_API_KEY=sk-your-key

# 通道配置
export OPENCLAW_CHANNELS_TELEGRAM_ENABLED=true
export OPENCLAW_CHANNELS_TELEGRAM_BOT_TOKEN=your-token
```

### 命令行参数
```bash
# 基础参数
openclaw gateway --port 8080 --bind lan
openclaw gateway --config /path/to/config.json5

# 调试参数
openclaw gateway --verbose --debug
openclaw gateway --log-level debug

# 安全参数
openclaw gateway --auth-mode token --auth-token secret
```

### 配置验证
```bash
# 验证配置文件
openclaw config validate

# 检查配置语法
openclaw config check

# 查看有效配置
openclaw config show

# 测试配置
openclaw config test
```

## 🔄 热重载配置

### 重载模式
```json5
{
  "gateway": {
    "reload": {
      "mode": "hybrid", // "off" | "restart" | "hot" | "hybrid"
      "debounceMs": 300,
      "deferralTimeoutMs": 300000
    }
  }
}
```

### 重载行为
- **off**: 禁用热重载
- **restart**: 重启进程
- **hot**: 热重载（不重启）
- **hybrid**: 智能选择最佳方式

### 手动重载
```bash
# 重新加载配置
openclaw gateway reload

# 强制重启
openclaw gateway restart

# 优雅重启
openclaw gateway graceful-restart
```

## 🎨 配置模板

### 开发环境模板
```json5
{
  "gateway": {
    "port": 18789,
    "bind": "loopback",
    "controlUi": {
      "enabled": true,
      "allowInsecureAuth": true
    },
    "auth": {
      "mode": "none"
    }
  },
  
  "agents": {
    "defaults": {
      "model": "openai/gpt-3.5-turbo",
      "thinkingDefault": "low"
    }
  },
  
  "tools": {
    "profile": "coding",
    "exec": {
      "host": "sandbox",
      "security": "allowlist",
      "ask": "on-miss"
    }
  }
}
```

### 生产环境模板
```json5
{
  "gateway": {
    "port": 18789,
    "bind": "lan",
    "tls": {
      "enabled": true,
      "autoGenerate": false,
      "certPath": "/etc/ssl/certs/openclaw.crt",
      "keyPath": "/etc/ssl/private/openclaw.key"
    },
    "controlUi": {
      "enabled": true,
      "allowedOrigins": ["https://your-domain.com"]
    },
    "auth": {
      "mode": "token",
      "token": "your-production-token",
      "rateLimit": {
        "maxAttempts": 10,
        "windowMs": 60000,
        "lockoutMs": 300000
      }
    }
  },
  
  "agents": {
    "defaults": {
      "model": "openai/gpt-4",
      "thinkingDefault": "medium"
    }
  },
  
  "tools": {
    "profile": "minimal",
    "exec": {
      "host": "sandbox",
      "security": "deny",
      "ask": "always"
    }
  }
}
```

### Docker 环境模板
```json5
{
  "gateway": {
    "port": 18789,
    "bind": "0.0.0.0",
    "trustedProxies": ["172.17.0.0/16", "10.0.0.0/8"],
    "controlUi": {
      "enabled": true,
      "basePath": "/openclaw"
    }
  },
  
  "channels": {
    "telegram": {
      "enabled": true,
      "webhookUrl": "https://your-domain.com/webhook/telegram"
    }
  }
}
```

## 📊 配置调试

### 调试命令
```bash
# 查看配置层级
openclaw config hierarchy

# 查看环境变量
openclaw config env

# 查看命令行参数
openclaw config args

# 查看合并后的配置
openclaw config merged
```

### 配置覆盖
```bash
# 临时覆盖（命令行）
openclaw gateway --port 8080 --bind lan

# 环境变量覆盖
OPENCLAW_GATEWAY_PORT=8080 openclaw gateway

# 配置文件覆盖
# 在 ~/.openclaw/config.local.json5 中添加
{
  "gateway": {
    "port": 8080
  }
}
```

## 🔍 配置参考

### 完整配置示例
查看 [config.example.json5](https://github.com/openclaw/openclaw/blob/main/config.example.json5) 获取完整配置示例。

### 配置文档
- [Gateway 配置](../config/types.gateway.ts)
- [Agent 配置](../config/types.agents.ts)
- [通道配置](../config/types.channels.ts)
- [工具配置](../config/types.tools.ts)

## 🛠️ 故障排除

### 配置错误
```bash
# 检查配置语法
openclaw config validate --verbose

# 查看配置错误
openclaw config validate --debug

# 重置配置
openclaw config reset

# 备份配置
openclaw config backup
```

### 配置冲突
```bash
# 查看配置来源
openclaw config sources

# 解决冲突
openclaw config resolve --interactive
```