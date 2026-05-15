import { NextResponse } from "next/server";

export async function GET() {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (!clientId) {
    return NextResponse.redirect(`${appUrl}/?auth=missing_github_config`);
  }

  const state = crypto.randomUUID();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${appUrl}/api/auth/github/callback`,
    scope: "read:user repo",
    state
  });

  const response = NextResponse.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
  response.cookies.set("gitgarden_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: appUrl.startsWith("https://"),
    maxAge: 60 * 10,
    path: "/"
  });
  return response;
}
