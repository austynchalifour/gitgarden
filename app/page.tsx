"use client";

import { Activity, Github, GitBranch, Heart, Leaf, PawPrint, Plug, RefreshCw, Trees } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { GardenState } from "@/lib/garden-store";

const petLabels: Record<GardenState["petStage"], string> = {
  seedling: "Seedling",
  sprout: "Sprout",
  companion: "Companion",
  guardian: "Guardian"
};

function Plant({ plant }: { plant: GardenState["plants"][number] }) {
  return (
    <div
      className={`plant plant-${plant.type}`}
      style={{
        left: `${plant.x}%`,
        top: `${plant.y}%`,
        transform: `translate(-50%, -100%) scale(${plant.size})`
      }}
      aria-hidden="true"
    >
      <span>{plant.type.slice(0, 1).toUpperCase()}</span>
    </div>
  );
}

export default function Home() {
  const [state, setState] = useState<GardenState | null>(null);
  const [busy, setBusy] = useState(false);
  const [authMessage, setAuthMessage] = useState("");

  async function refresh() {
    const response = await fetch("/api/state", { cache: "no-store" });
    setState(await response.json());
  }

  async function reset() {
    setBusy(true);
    const response = await fetch("/api/state", { method: "DELETE" });
    setState(await response.json());
    setBusy(false);
  }

  useEffect(() => {
    const auth = new URLSearchParams(window.location.search).get("auth");
    const messages: Record<string, string> = {
      missing_github_config: "GitHub OAuth is not configured yet. Add GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET.",
      state_mismatch: "GitHub rejected the connection check. Please try connecting again.",
      token_exchange_failed: "GitHub did not return an access token. Check the OAuth app settings.",
      user_fetch_failed: "GitHub connected, but the user profile could not be read."
    };
    if (auth) {
      setAuthMessage(messages[auth] || "GitHub connection failed.");
    }
    refresh();
  }, []);

  const growthPercent = useMemo(() => {
    if (!state) return 0;
    return Math.min(100, (state.level - 1) * 14 + state.pushes * 3);
  }, [state]);

  if (!state) {
    return (
      <main className="shell loading">
        <Leaf className="spin" />
      </main>
    );
  }

  return (
    <main className="shell">
      <section className="hero">
        <nav className="topbar" aria-label="Application">
          <div className="brand">
            <span className="brandMark">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="" />
            </span>
            <span>GitGarden</span>
          </div>
          <div className="navActions">
            <a className="ghostButton" href="/api/auth/github">
              <Github size={18} />
              {state.connected ? "Reconnect" : "Connect GitHub"}
            </a>
            <button className="iconButton" onClick={refresh} aria-label="Refresh garden">
              <RefreshCw size={18} />
            </button>
          </div>
        </nav>

        <div className="heroGrid">
          <div className="intro">
            <p className="eyebrow">GitHub-powered care loop</p>
            <h1>Every push grows the world you come back to.</h1>
            <p className="lede">
              Connect a real GitHub account, receive push webhooks, or call the MCP bridge with that GitHub actor.
              Every matched push turns into plants, water, mood, levels, and pet evolution.
            </p>
            {authMessage ? <p className="authError">{authMessage}</p> : null}
            <div className="ctaRow">
              <a className="primaryButton" href="/api/auth/github">
                <Github size={18} />
                Connect GitHub
              </a>
              <button className="secondaryButton" onClick={reset} disabled={busy}>
                Reset Garden
              </button>
            </div>
          </div>

          <div className="gardenStage" aria-label="Garden visualization">
            <div className="sun" />
            <div className="cloud cloudOne" />
            <div className="cloud cloudTwo" />
            <div className="pet">
              <div className="petEars" />
              <div className="petFace">
                <span />
                <span />
              </div>
              <div className="petBody" />
            </div>
            {state.plants.map((plant) => (
              <Plant key={plant.id} plant={plant} />
            ))}
            <div className="ground" />
          </div>
        </div>
      </section>

      <section className="dashboard" aria-label="Garden dashboard">
        <div className="metric">
          <Trees size={20} />
          <span>Level</span>
          <strong>{state.level}</strong>
        </div>
        <div className="metric">
          <GitBranch size={20} />
          <span>Pushes</span>
          <strong>{state.pushes}</strong>
        </div>
        <div className="metric">
          <Activity size={20} />
          <span>Commits</span>
          <strong>{state.commits}</strong>
        </div>
        <div className="metric">
          <PawPrint size={20} />
          <span>Pet</span>
          <strong>{petLabels[state.petStage]}</strong>
        </div>
      </section>

      <section className="workArea">
        <div className="panel gardenPanel">
          <div className="panelHeader">
            <div>
              <p className="eyebrow">Vitals</p>
              <h2>Garden health</h2>
            </div>
            {state.profile ? (
              <div className="profileChip">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={state.profile.avatarUrl} alt="" />
                <span>{state.profile.login}</span>
              </div>
            ) : (
              <span className="profileChip muted">Not connected</span>
            )}
          </div>

          <div className="bars">
            <label>
              <span>Growth</span>
              <strong>{growthPercent}%</strong>
              <meter min={0} max={100} value={growthPercent} />
            </label>
            <label>
              <span>Water</span>
              <strong>{state.water}%</strong>
              <meter min={0} max={100} value={state.water} />
            </label>
            <label>
              <span>Pet mood</span>
              <strong>{state.petMood}%</strong>
              <meter min={0} max={100} value={state.petMood} />
            </label>
          </div>
        </div>

        <div className="panel">
          <div className="panelHeader">
            <div>
              <p className="eyebrow">Webhook feed</p>
              <h2>Recent pushes</h2>
            </div>
            <Heart size={20} />
          </div>
          <div className="eventList">
            {state.events.length === 0 ? (
              <p className="empty">Connect GitHub, then send a webhook or MCP push with the same GitHub actor.</p>
            ) : (
              state.events.map((event) => (
                <article className="event" key={event.id}>
                  <div>
                    <strong>{event.repo}</strong>
                    <span>
                      {event.branch} / {event.commits} commit{event.commits === 1 ? "" : "s"}
                    </span>
                  </div>
                  <p>{event.message}</p>
                  <small>
                    {event.source.toUpperCase()} from {event.actor}
                  </small>
                </article>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="setupBand">
        <div>
          <p className="eyebrow">Production wiring</p>
          <h2>GitHub + MCP setup</h2>
        </div>
        <code>Webhook URL: /api/github/webhook</code>
        <code>MCP bridge: /api/mcp</code>
      </section>

      <section className="setupBand bridgeBand">
        <div>
          <p className="eyebrow">Event flow</p>
          <h2>
            <Plug size={19} /> Pushes grow the garden
          </h2>
        </div>
        <code>GitHub push -&gt; webhook -&gt; recordPush()</code>
        <code>MCP tool call -&gt; record_github_push -&gt; recordPush()</code>
      </section>
    </main>
  );
}
