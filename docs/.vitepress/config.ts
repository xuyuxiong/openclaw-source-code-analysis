import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'OpenClaw 源码解析',
  description: 'OpenClaw 完整源码学习指南 - 从 Gateway 到 Agent Runtime',
  base: '/openclaw-source-code-analysis/',
  head: [['link', { rel: 'icon', href: '/openclaw-source-code-analysis/favicon.ico' }]],
  themeConfig: {
    logo: '/logo.svg',
    nav: [
      { text: '首页', link: '/' },
      { text: '指南篇', link: '/guide/prerequisites' },
      { text: '理念篇', link: '/philosophy/why-openclaw' },
      { text: '架构篇', link: '/architecture/overview' },
      { text: '运行时篇', link: '/runtime/gateway-lifecycle' },
      { text: '通道篇', link: '/channel/overview' },
      { text: '插件篇', link: '/plugin/overview' },
      { text: '进阶篇', link: '/advanced/security' },
      { text: '部署篇', link: '/deploy/overview' }
    ],
    sidebar: {
      '/guide/': [
        {
          text: '指南篇',
          items: [
            { text: '学习前提', link: '/guide/prerequisites' },
            { text: 'OpenClaw 是什么', link: '/guide/overview' },
            { text: '快速上手', link: '/guide/quick-start' },
            { text: '源码目录结构', link: '/guide/structure' },
            { text: '调试源码', link: '/guide/debugging' }
          ]
        }
      ],
      '/philosophy/': [
        {
          text: '理念篇',
          items: [
            { text: '为什么需要 OpenClaw', link: '/philosophy/why-openclaw' },
            { text: 'Gateway 模式设计哲学', link: '/philosophy/gateway-pattern' },
            { text: 'Lane Queue 串行化', link: '/philosophy/lane-queue' },
            { text: '插件优先架构', link: '/philosophy/plugin-first' },
            { text: '安全与隔离理念', link: '/philosophy/security-isolation' }
          ]
        }
      ],
      '/architecture/': [
        {
          text: '架构篇',
          items: [
            { text: '整体架构', link: '/architecture/overview' },
            { text: 'Gateway 核心', link: '/architecture/gateway-core' },
            { text: 'Session 会话系统', link: '/architecture/session-system' },
            { text: 'Lane Queue 命令队列', link: '/architecture/lane-queue' },
            { text: 'Provider 提供者系统', link: '/architecture/provider-system' },
            { text: 'Tool 工具系统', link: '/architecture/tool-system' },
            { text: 'Cron 定时任务', link: '/architecture/cron-system' },
            { text: 'Node 设备系统', link: '/architecture/node-system' }
          ]
        }
      ],
      '/runtime/': [
        {
          text: '运行时篇',
          items: [
            { text: 'Gateway 生命周期', link: '/runtime/gateway-lifecycle' },
            { text: '消息处理流程', link: '/runtime/message-flow' },
            { text: 'Agent Runtime', link: '/runtime/agent-runtime' },
            { text: 'Streaming 流式响应', link: '/runtime/streaming' },
            { text: 'Compaction 上下文压缩', link: '/runtime/compaction' },
            { text: 'Sub-Agent 子代理', link: '/runtime/subagent' },
            { text: 'Heartbeat 心跳机制', link: '/runtime/heartbeat' },
            { text: '错误处理与重试', link: '/runtime/error-handling' }
          ]
        }
      ],
      '/channel/': [
        {
          text: '通道篇',
          items: [
            { text: '通道系统总览', link: '/channel/overview' },
            { text: 'Channel Plugin 接口', link: '/channel/channel-plugin' },
            { text: 'Telegram 通道', link: '/channel/telegram' },
            { text: 'Discord 通道', link: '/channel/discord' },
            { text: 'WhatsApp 通道', link: '/channel/whatsapp' },
            { text: 'WebChat 通道', link: '/channel/webchat' },
            { text: 'Signal 通道', link: '/channel/signal' },
            { text: 'Slack 通道', link: '/channel/slack' }
          ]
        }
      ],
      '/plugin/': [
        {
          text: '插件篇',
          items: [
            { text: '插件系统总览', link: '/plugin/overview' },
            { text: 'Plugin SDK', link: '/plugin/plugin-sdk' },
            { text: 'Provider 插件', link: '/plugin/provider-plugin' },
            { text: 'Channel 插件', link: '/plugin/channel-plugin' },
            { text: 'Skill 技能系统', link: '/plugin/skill-system' },
            { text: 'MCP Server 集成', link: '/plugin/mcp-integration' },
            { text: '自定义插件开发', link: '/plugin/custom-plugin' }
          ]
        }
      ],
      '/advanced/': [
        {
          text: '进阶篇',
          items: [
            { text: '安全机制', link: '/advanced/security' },
            { text: 'Workspace 工作区', link: '/advanced/workspace' },
            { text: '配置系统', link: '/advanced/configuration' },
            { text: 'Sandbox 沙箱执行', link: '/advanced/sandbox' },
            { text: 'RPC 通信', link: '/advanced/rpc' },
            { text: '状态持久化', link: '/advanced/state-persistence' },
            { text: '性能优化', link: '/advanced/performance' },
            { text: '设计模式', link: '/advanced/design-patterns' }
          ]
        }
      ],
      '/deploy/': [
        {
          text: '部署篇',
          items: [
            { text: '部署总览', link: '/deploy/overview' },
            { text: '本地部署', link: '/deploy/local' },
            { text: 'Docker 部署', link: '/deploy/docker' },
            { text: 'Cloudflare 部署', link: '/deploy/cloudflare' },
            { text: '自托管 Provider', link: '/deploy/self-hosted' },
            { text: '监控与日志', link: '/deploy/monitoring' }
          ]
        }
      ]
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/openclaw/openclaw' }
    ],
    search: {
      provider: 'local'
    },
    footer: {
      message: '基于 MIT 许可发布',
      copyright: '© 2026 OpenClaw 源码解析'
    }
  },
  markdown: {
    lineNumbers: true
  }
})