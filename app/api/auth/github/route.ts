import { NextResponse } from "next/server";
import { connectProfile } from "@/lib/garden-store";

export async function GET() {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (!clientId) {
    connectProfile();
    return NextResponse.redirect(`${appUrl}/?connected=demo`);
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${appUrl}/api/auth/github/callback`,
    scope: "read:user repo",
    state: crypto.randomUUID()
  });

  return NextResponse.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
}
