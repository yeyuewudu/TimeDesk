# Contributing

Thanks for considering contributing to TimeDesk.

## Local Setup

Required tools:

- Node.js
- Rust toolchain with `rustc` and `cargo`
- WebView2 Runtime on Windows
- MSVC Build Tools on Windows

Install dependencies:

```bash
npm install
```

Run the desktop app:

```bash
npm run tauri dev
```

Run checks before opening a pull request:

```bash
npm run build
cd src-tauri
cargo check
```

## Scope

TimeDesk is intentionally lightweight. Please avoid adding features that:

- run a local LLM;
- monitor the clipboard automatically;
- read WeChat, email, or other private data automatically;
- add cloud sync or account systems before the local MVP is stable;
- introduce a large UI framework without a clear reason.

## Security

Do not commit real API keys, tokens, private documents, or generated local storage.

