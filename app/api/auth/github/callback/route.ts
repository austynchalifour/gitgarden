import { NextRequest, NextResponse } from "next/server";
import { createGardenSession, connectProfile } from "@/lib/garden-store";

export async function GET(request: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const expectedState = request.cookies.get("gitgarden_oauth_state")?.value;
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!code || !clientId || !clientSecret) {
    return NextResponse.redirect(`${appUrl}/?auth=missing_github_config`);
  }

  if (!state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(`${appUrl}/?auth=state_mismatch`);
  }

  const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code
    })
  });

  const tokenData = await tokenResponse.json();
  const accessToken = tokenData.access_token;

  if (!accessToken) {
    return NextResponse.redirect(`${appUrl}/?auth=token_exchange_failed`);
  }

  const userResponse = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json"
    }
  });
  const user = await userResponse.json();

  if (!user.login || !user.avatar_url) {
    return NextResponse.redirect(`${appUrl}/?auth=user_fetch_failed`);
  }

  const sessionId = createGardenSession();
  connectProfile(sessionId, {
    login: user.login,
    name: user.name || user.login,
    avatarUrl: user.avatar_url
  });

  const response = NextResponse.redirect(`${appUrl}/?connected=github`);
  response.cookies.set("gitgarden_session", sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: appUrl.startsWith("https://"),
    maxAge: 60 * 60 * 24 * 30,
    path: "/"
  });
  response.cookies.delete("gitgarden_oauth_state");
  return response;
}
