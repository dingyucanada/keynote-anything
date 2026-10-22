# Optional AI director

Local mode works without a model. AI mode requires your own **OpenAI-compatible chat completions endpoint**. You choose the provider, model, credentials and cost. No credentials are requested in the browser or committed to this repository.

## Configure on your machine

Copy `.env.example` to `.env`, fill in the three values locally, then run:

```sh
node --env-file=.env scripts/server.mjs
```

Requires Node.js 20.6 or later. Use your provider's actual base URL, typically ending in `/v1`, and actual model ID. The server appends `/chat/completions`. Production endpoints must use HTTPS; loopback HTTP is permitted for local model servers.

The studio's **Director** selector becomes available after the server reports configuration. “Configured” means variables are present, not that the credentials have been verified. Select AI director, write a brief, then generate. The server requests seven structured scenes and validates the response before replacing your project.

## Data and failure behavior

- Sent to provider: subject, name, description, audience, supplied facts, language, tone and theme.
- Not sent: uploaded product image, prior projects, browser storage, exported files.
- Credentials stay in the local server process. The frontend only sees the configured model name.
- Timeout: 60 seconds upstream, 65 seconds in the browser.
- Limits: two concurrent generation requests per local server; 12 KB request body; 150 KB upstream response.
- Invalid structure, provider errors and timeouts keep the current project. Retry or return to local mode.
- The model's claims are not verified by this tool. Review copy and any technical claims before sharing.

## Hosting

GitHub Pages serves only static files; its online demo supports **local mode**. To use AI, run the included server locally. It binds to `127.0.0.1` intentionally. Do not publish it directly with a shared paid key: a hosted multi-user version needs authentication, per-user rate limits, spending controls and deployment-specific hardening. Those are outside this release.

## Compatibility and test limits

The adapter uses standard `POST /chat/completions`, `messages`, `temperature`, `max_tokens`, and a non-streamed text response in `choices[0].message.content`. Providers that require different fields need an adapter. Automated tests use simulated provider responses; this release has not been verified against a paid live model endpoint.

## 中文

将 `.env.example` 复制为 `.env`，在本机填写 API Key、服务商提供的接口基础地址及模型名称，再按上面的命令启动。不要把密钥写进前端、项目 JSON 或公开仓库。在线静态演示不提供共享付费 AI 服务。模型生成的文案需要你审核。
