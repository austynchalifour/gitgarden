import { NextRequest, NextResponse } from "next/server";
import { getGardenState, recordPush } from "@/lib/garden-store";

type JsonRpcRequest = {
  id?: string | number | null;
  method?: string;
  params?: {
    name?: string;
    arguments?: Record<string, unknown>;
  };
};

function result(id: JsonRpcRequest["id"], value: unknown) {
  return NextResponse.json({
    jsonrpc: "2.0",
    id: id ?? null,
    result: value
  });
}

function error(id: JsonRpcRequest["id"], code: number, message: string) {
  return NextResponse.json({
    jsonrpc: "2.0",
    id: id ?? null,
    error: { code, message }
  });
}

export async function POST(request: NextRequest) {
  const token = process.env.MCP_BRIDGE_TOKEN;
  if (token && request.headers.get("authorization") !== `Bearer ${token}`) {
    return error(null, -32001, "Unauthorized");
  }

  const body = (await request.json()) as JsonRpcRequest;

  if (body.method === "initialize") {
    return result(body.id, {
      protocolVersion: "2024-11-05",
      serverInfo: {
        name: "gitgarden-mcp-bridge",
        version: "0.1.0"
      },
      capabilities: {
        tools: {}
      }
    });
  }

  if (body.method === "tools/list") {
    return result(body.id, {
      tools: [
        {
          name: "record_github_push",
          description: "Grow the garden from a GitHub push event.",
          inputSchema: {
            type: "object",
            properties: {
              repo: { type: "string" },
              branch: { type: "string" },
              commits: { type: "number" },
              message: { type: "string" },
              actor: { type: "string" }
            },
            required: ["repo"]
          }
        },
        {
          name: "get_garden_state",
          description: "Read the current garden and pet state.",
          inputSchema: {
            type: "object",
            properties: {}
          }
        }
      ]
    });
  }

  if (body.method === "tools/call") {
    const toolName = body.params?.name;
    const args = body.params?.arguments || {};

    if (toolName === "record_github_push") {
      const state = recordPush({
        repo: String(args.repo || "unknown/repo"),
        branch: String(args.branch || "main"),
        commits: Number(args.commits || 1),
        message: String(args.message || "MCP-recorded push"),
        actor: String(args.actor || "mcp"),
        source: "mcp"
      });

      return result(body.id, {
        content: [
          {
            type: "text",
            text: `Garden grew from ${state.events[0]?.repo}. Level ${state.level}, pushes ${state.pushes}.`
          }
        ],
        structuredContent: state
      });
    }

    if (toolName === "get_garden_state") {
      const state = getGardenState();
      return result(body.id, {
        content: [
          {
            type: "text",
            text: `Level ${state.level}, ${state.pushes} pushes, ${state.commits} commits.`
          }
        ],
        structuredContent: state
      });
    }
  }

  return error(body.id, -32601, "Unsupported MCP bridge method");
}
