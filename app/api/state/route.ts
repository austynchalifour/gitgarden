import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getGardenState, resetGarden } from "@/lib/garden-store";

export async function GET() {
  const cookieStore = await cookies();
  return NextResponse.json(getGardenState(cookieStore.get("gitgarden_session")?.value));
}

export async function DELETE() {
  const cookieStore = await cookies();
  return NextResponse.json(resetGarden(cookieStore.get("gitgarden_session")?.value));
}
