import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { findSessionByGitHubLogin, recordPush } from "@/lib/garden-store";

function isValidSignature(body: string, signature: string | null) {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) {
    return true;
  }
  if (!signature?.startsWith("sha256=")) {
    return false;
  }

  const expected = `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(signature);
  return expectedBuffer.length === actualBuffer.length && timingSafeEqual(expectedBuffer, actualBuffer);
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const event = request.headers.get("x-github-event");
  const signature = request.headers.get("x-hub-signature-256");

  if (!isValidSignature(body, signature)) {
    return NextResponse.json({ error: "Invalid GitHub signature" }, { status: 401 });
  }

  if (event !== "push") {
    return NextResponse.json({ ignored: true, event });
  }

  const payload = JSON.parse(body || "{}");
  const actor = payload.sender?.login;
  const sessionId = findSessionByGitHubLogin(actor);

  if (!sessionId) {
    return NextResponse.json({ ok: true, recorded: false, reason: "No connected GitHub user matched this push actor" });
  }

  const state = recordPush(sessionId, {
    repo: payload.repository?.full_name,
    branch: String(payload.ref || "refs/heads/main").replace("refs/heads/", ""),
    commits: Array.isArray(payload.commits) ? payload.commits.length : 1,
    message: payload.head_commit?.message,
    actor,
    source: "webhook"
  });

  return NextResponse.json({ ok: true, recorded: true, state });
}
