import { NextRequest, NextResponse } from "next/server";
import { recordPush } from "@/lib/garden-store";

function isAuthorized(request: NextRequest) {
  const token = process.env.MCP_BRIDGE_TOKEN;
  if (!token) {
    return true;
  }

  return request.headers.get("authorization") === `Bearer ${token}`;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized MCP bridge request" }, { status: 401 });
  }

  const payload = await request.json();
  const state = recordPush({
    repo: payload.repo || payload.repository?.full_name,
    branch: payload.branch || String(payload.ref || "refs/heads/main").replace("refs/heads/", ""),
    commits: Array.isArray(payload.commits) ? payload.commits.length : payload.commits,
    message: payload.message || payload.head_commit?.message,
    actor: payload.actor || payload.sender?.login || "mcp",
    source: "mcp"
  });

  return NextResponse.json({ ok: true, state });
}
