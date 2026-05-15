# GitGarden

A Next.js app where GitHub activity becomes a living garden. Users can connect GitHub, receive push events, and watch each push grow plants, water the garden, improve pet mood, and evolve the pet.

## Run locally

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:3000`.

## GitHub OAuth

Create a GitHub OAuth app and set:

```bash
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Use this callback URL in GitHub:

```text
http://localhost:3000/api/auth/github/callback
```

If those variables are missing, the app will refuse to connect and show a configuration error. There is no demo GitHub user fallback.

## GitHub webhooks

Point a repository or GitHub App webhook at:

```text
http://your-public-url/api/github/webhook
```

Subscribe to `push` events. For local testing, expose the Next server with a tunnel and set `GITHUB_WEBHOOK_SECRET` if you want signature verification.

## MCP bridge

MCP is not the event source for GitHub pushes by itself. GitHub still needs to send push events through webhooks. The app also exposes an MCP-style JSON-RPC bridge so an MCP host can grow the same garden state through tools.

Endpoint:

```text
POST /api/mcp
```

Optional auth:

```bash
MCP_BRIDGE_TOKEN=your_bridge_token
```

Available tool calls:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "record_github_push",
    "arguments": {
      "repo": "owner/repo",
      "branch": "main",
      "commits": 3,
      "message": "Ship garden growth",
      "actor": "github-user"
    }
  }
}
```

For simpler server-to-server bridge calls, post normalized push events directly to:

```text
POST /api/mcp/push
```

## What is implemented

- GitHub connect route with OAuth support and no demo fallback.
- Push webhook route with optional `x-hub-signature-256` verification.
- MCP bridge route with `record_github_push` and `get_garden_state` tools.
- Garden and pet state that grows from pushes and commits.
- Polished responsive dashboard built with Next.js App Router.

State is stored in memory for this prototype. A production version should move garden state, GitHub identities, installations, and webhook delivery records into a database.
