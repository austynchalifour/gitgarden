import { NextRequest, NextResponse } from "next/server";
import { connectProfile } from "@/lib/garden-store";

export async function GET(request: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const code = request.nextUrl.searchParams.get("code");
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!code || !clientId || !clientSecret) {
    connectProfile();
    return NextResponse.redirect(`${appUrl}/?connected=demo`);
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
    connectProfile();
    return NextResponse.redirect(`${appUrl}/?connected=demo`);
  }

  const userResponse = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json"
    }
  });
  const user = await userResponse.json();

  connectProfile({
    login: user.login,
    name: user.name || user.login,
    avatarUrl: user.avatar_url
  });

  return NextResponse.redirect(`${appUrl}/?connected=github`);
}
