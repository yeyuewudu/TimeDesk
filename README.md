# TimeDesk

TimeDesk 是一个轻量桌面时间轴摆件。它可以从通知、邮件、群消息、会议纪要、PDF 和 Word 文档中提取时间节点，并整理成一条清楚的本地时间轴。

普通日历记录你填进去的时间，TimeDesk 帮你把消息里的时间捡出来。

## 核心功能

- 粘贴文本后整理为时间轴节点。
- 上传 PDF、DOCX、TXT、MD 并在本地提取文本。
- 通过 OpenAI-compatible Chat Completions API 解析时间、截止、提前节点、准备事项和中间节点。
- 按今天、明天、本周、下周、更晚、待确认分组展示。
- 查看事件详情，包括原文证据、原因、置信度和不确定项。
- 标记完成、删除事件、编辑事件时间。
- 保存 API Key、Base URL、Model、时区、置顶和通知设置。

## 技术栈

- Tauri
- React
- TypeScript
- Vite
- Rust
- reqwest
- pdfjs-dist
- mammoth.js
- zod

## 运行

需要先安装：

- Node.js
- Rust toolchain，包括 `rustc` 和 `cargo`
- Windows 上需要 WebView2 与 MSVC Build Tools

```bash
npm install
npm run tauri dev
```

桌面窗口默认尺寸约为 340 x 560，定位是安静的小时间轴摆件，不是全屏效率软件。

## 配置 API Key

打开右上角设置，填写：

- API Key
- Base URL，例如 `https://api.openai.com/v1`
- Model，例如 `gpt-4o-mini`
- 默认时区，例如 `Asia/Shanghai`

请求由 Tauri Rust 后端发出，前端不会直接请求大模型接口。

## 支持输入

- 直接粘贴文本
- PDF
- DOCX
- TXT
- MD

文件文本提取在本地完成，只有提取后的文本会发送给大模型 API。

## 暂不支持

- 扫描版 PDF OCR
- `.doc` 老格式 Word 文档
- 自动读取微信、邮箱或剪贴板
- 账号系统
- 云同步
- 团队协作
- 本地部署大模型

## 示例输入

`examples/` 目录内提供了 5 条测试文本：

- `course_notice.txt`
- `work_email.txt`
- `meeting_note.txt`
- `fuzzy_notice.txt`
- `competition_notice.txt`

示例：

```txt
请各小组于下周三前提交案例分析报告。周一晚上 8 点前，各组需将 PPT 初稿发给组长汇总，周二课堂将随机抽取小组预展示。
```

可能整理出的节点：

```json
{
  "events": [
    {
      "title": "将 PPT 初稿发给组长汇总",
      "event_type": "hidden_deadline",
      "original_time_text": "周一晚上 8 点前",
      "normalized_time": "2026-07-06T20:00:00",
      "time_granularity": "exact_time",
      "confidence": 0.95,
      "risk_level": "high",
      "reason": "这是组长汇总前的协作节点，错过会影响后续提交。",
      "evidence": "周一晚上 8 点前，各组需将 PPT 初稿发给组长汇总",
      "dependencies": []
    }
  ]
}
```

## 项目结构

```txt
.
├── examples/
├── src/
│   ├── components/
│   ├── prompts/
│   ├── services/
│   ├── styles/
│   ├── types/
│   ├── App.tsx
│   └── main.tsx
├── src-tauri/
│   ├── src/
│   │   ├── llm.rs
│   │   └── main.rs
│   ├── Cargo.toml
│   └── tauri.conf.json
├── package.json
└── README.md
```

## 后续路线图

- 用系统 Keychain 保存 API Key。
- 将 localStorage 替换为 SQLite。
- 加入真正的后台定时提醒。
- 支持文本分块和长文档多轮整理。
- 支持导出时间轴。
- 支持更细的待确认节点编辑流程。
