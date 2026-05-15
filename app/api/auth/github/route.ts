import { NextRequest, NextResponse } from "next/server";

function getAppUrl(request: NextRequest) {
  return request.nextUrl.origin.replace(/\/$/, "");
}

export async function GET(request: NextRequest) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const appUrl = getAppUrl(request);

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
