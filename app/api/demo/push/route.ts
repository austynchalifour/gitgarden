import { NextResponse } from "next/server";
import { recordPush } from "@/lib/garden-store";

const repos = ["austy/aurora-api", "austy/seed-vault", "austy/pixel-meadow", "austy/workbench"];
const messages = [
  "Refine growth animation",
  "Add webhook handler",
  "Tune pet mood curve",
  "Ship garden dashboard"
];

export async function POST() {
  const index = Math.floor(Math.random() * repos.length);
  const state = recordPush({
    repo: repos[index],
    branch: Math.random() > 0.28 ? "main" : "feature/growth",
    commits: 1 + Math.floor(Math.random() * 5),
    message: messages[index],
    actor: "demo-user",
    source: "demo"
  });

  return NextResponse.json(state);
}
