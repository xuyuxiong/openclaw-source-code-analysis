# 环境要求和前置条件

在开始使用 OpenClaw 之前，请确保你的系统满足以下要求。

## 💻 系统要求

### 操作系统
- **Linux**: Ubuntu 18.04+, CentOS 7+, Debian 9+
- **macOS**: macOS 10.15 (Catalina) 或更高版本
- **Windows**: Windows 10 或更高版本（WSL2 推荐）

### Node.js 版本
- **最低版本**: Node.js 18.0.0
- **推荐版本**: Node.js 20.x LTS
- **验证命令**:
  ```bash
  node --version  # 应该显示 v18.0.0 或更高
  npm --version   # 应该显示 8.0.0 或更高
  ```

### 内存要求
- **最小内存**: 512MB RAM
- **推荐内存**: 2GB RAM 或更多
- **大模型需求**: 4GB+ RAM（如果使用大型模型）

### 存储空间
- **最小空间**: 100MB 可用磁盘空间
- **推荐空间**: 1GB 可用磁盘空间
- **缓存需求**: 额外 500MB-2GB（取决于使用场景）

## 🔑 外部依赖

### AI Provider API 密钥
至少需要一个 AI Provider 的 API 密钥：

#### OpenAI
```bash
export OPENAI_API_KEY="sk-your-openai-key-here"
```

#### Anthropic
```bash
export ANTHROPIC_API_KEY="sk-ant-your-anthropic-key-here"
```

#### Google AI
```bash
export GOOGLE_API_KEY="your-google-ai-key-here"
```

#### 其他 Provider
- **Groq**: `GROQ_API_KEY`
- **Ollama**: 本地运行，无需密钥
- **DeepSeek**: `DEEPSEEK_API_KEY`

### 网络要求
- **互联网连接**: 需要访问 AI Provider API
- **端口**: 18789（默认，可配置）
- **防火墙**: 允许出站 HTTPS (443) 连接
- **代理支持**: 支持 HTTP/HTTPS 代理

## 🛠️ 开发环境

### 必需工具
- **Git**: 用于克隆和管理代码
- **文本编辑器**: VS Code、Vim、Emacs 等
- **终端**: Bash、Zsh、PowerShell 等

### 可选工具
- **Docker**: 容器化部署
- **nvm/n**: Node.js 版本管理
- **pm2**: 进程管理
- **nginx**: 反向代理

## 📦 安装方式

### 方式一：npm 全局安装（推荐）
```bash
# 安装 Node.js 20.x LTS
# macOS
brew install node@20

# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs

# 安装 OpenClaw
npm install -g openclaw
```

### 方式二：源码安装
```bash
# 克隆仓库
git clone https://github.com/openclaw/openclaw.git
cd openclaw

# 安装依赖
npm install

# 构建项目
npm run build

# 链接到全局
npm link
```

### 方式三：Docker 安装
```bash
# 拉取镜像
docker pull openclaw/openclaw:latest

# 运行容器
docker run -d \
  --name openclaw \
  -p 18789:18789 \
  -e OPENAI_API_KEY=your-key \
  openclaw/openclaw:latest
```

## 🔧 系统配置

### 文件描述符限制（Linux/macOS）
```bash
# 检查当前限制
ulimit -n

# 临时增加限制
ulimit -n 65536

# 永久增加限制（Linux）
echo "* soft nofile 65536" >> /etc/security/limits.conf
echo "* hard nofile 65536" >> /etc/security/limits.conf
```

### 防火墙配置
```bash
# Ubuntu/Debian UFW
sudo ufw allow 18789/tcp

# CentOS/RHEL firewalld
sudo firewall-cmd --permanent --add-port=18789/tcp
sudo firewall-cmd --reload

# macOS
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /usr/local/bin/openclaw
```

## 🌐 网络配置

### 代理配置
```bash
# HTTP代理
export HTTP_PROXY=http://proxy.example.com:8080
export HTTPS_PROXY=http://proxy.example.com:8080

# 在配置文件中设置
{
  "gateway": {
    "proxy": {
      "http": "http://proxy.example.com:8080",
      "https": "http://proxy.example.com:8080"
    }
  }
}
```

### DNS配置
确保 DNS 能够解析以下域名：
- `api.openai.com` (OpenAI)
- `api.anthropic.com` (Anthropic)
- `generativelanguage.googleapis.com` (Google AI)
- 其他使用的 AI Provider 域名

## 🐳 Docker 环境

### Docker 安装
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com | sh

# macOS
brew install docker

# Windows
# 下载并安装 Docker Desktop
```

### Docker Compose 配置
```yaml
version: '3.8'
services:
  openclaw:
    image: openclaw/openclaw:latest
    ports:
      - "18789:18789"
    environment:
      - OPENAI_API_KEY=your-openai-key
      - ANTHROPIC_API_KEY=your-anthropic-key
    volumes:
      - ./config:/root/.openclaw
      - ./workspace:/root/.openclaw/workspace
    restart: unless-stopped
```

## 🧪 测试环境

### 测试安装
```bash
# 测试 Node.js
node --version
npm --version

# 测试 OpenClaw
openclaw --version
openclaw --help

# 测试网络连接
curl -I https://api.openai.com
curl -I https://api.anthropic.com
```

### 验证配置
```bash
# 创建测试配置
openclaw config init --test

# 验证配置
openclaw config validate

# 测试 API 连接
openclaw test openai
```

## ⚠️ 常见问题和解决方案

### Node.js 版本问题
```bash
# 使用 nvm 安装正确版本
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20

# 使用 n 安装正确版本
npm install -g n
n 20
```

### 权限问题
```bash
# Linux/macOS 权限修复
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules

# Windows 管理员权限
# 以管理员身份运行 PowerShell
```

### 网络连接问题
```bash
# 检查网络连接
ping api.openai.com
nslookup api.openai.com

# 检查防火墙
sudo iptables -L
sudo ufw status

# 检查代理设置
echo $HTTP_PROXY
echo $HTTPS_PROXY
```

## 📋 环境检查清单

在开始前，请确认以下项目：

- [ ] Node.js 18+ 已安装
- [ ] npm 8+ 已安装
- [ ] 至少一个 AI Provider API 密钥已配置
- [ ] 18789 端口可用
- [ ] 网络连接正常
- [ ] 防火墙已配置
- [ ] 磁盘空间充足

## 🎯 下一步

完成环境准备后，继续：
1. [快速开始指南](./quick-start.md)
2. [配置详解](../advanced/configuration.md)
3. [通道配置](../channel/overview.md)
4. [部署指南](../deploy/overview.md)