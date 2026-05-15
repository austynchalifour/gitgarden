import { NextResponse } from "next/server";
import { getGardenState, resetGarden } from "@/lib/garden-store";

export async function GET() {
  return NextResponse.json(getGardenState());
}

export async function DELETE() {
  return NextResponse.json(resetGarden());
}
