export type GitHubProfile = {
  login: string;
  name: string;
  avatarUrl: string;
};

export type PushEvent = {
  id: string;
  repo: string;
  branch: string;
  commits: number;
  message: string;
  actor: string;
  source: "webhook" | "mcp" | "demo";
  createdAt: string;
};

export type GardenState = {
  connected: boolean;
  profile: GitHubProfile | null;
  pushes: number;
  commits: number;
  level: number;
  water: number;
  petMood: number;
  petStage: "seedling" | "sprout" | "companion" | "guardian";
  plants: Array<{
    id: string;
    type: "fern" | "flower" | "tree" | "mushroom";
    x: number;
    y: number;
    size: number;
  }>;
  events: PushEvent[];
};

const seedPlants: GardenState["plants"] = [
  { id: "p-1", type: "fern", x: 16, y: 70, size: 0.9 },
  { id: "p-2", type: "flower", x: 34, y: 64, size: 0.75 },
  { id: "p-3", type: "tree", x: 72, y: 68, size: 0.82 }
];

const initialState: GardenState = {
  connected: false,
  profile: null,
  pushes: 0,
  commits: 0,
  level: 1,
  water: 38,
  petMood: 54,
  petStage: "seedling",
  plants: seedPlants,
  events: []
};

const globalForGarden = globalThis as unknown as {
  githubGardenState?: GardenState;
};

export function getGardenState() {
  if (!globalForGarden.githubGardenState) {
    globalForGarden.githubGardenState = structuredClone(initialState);
  }

  return globalForGarden.githubGardenState;
}

export function connectProfile(profile?: Partial<GitHubProfile>) {
  const state = getGardenState();
  state.connected = true;
  state.profile = {
    login: profile?.login || "octo-gardener",
    name: profile?.name || "Demo Gardener",
    avatarUrl: profile?.avatarUrl || "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png"
  };
  return state;
}

export function disconnectProfile() {
  const state = getGardenState();
  state.connected = false;
  state.profile = null;
  return state;
}

export function resetGarden() {
  globalForGarden.githubGardenState = structuredClone(initialState);
  return globalForGarden.githubGardenState;
}

export function recordPush(input: Partial<PushEvent>) {
  const state = getGardenState();
  const commits = Math.max(1, Number(input.commits || 1));
  const pushNumber = state.pushes + 1;
  const event: PushEvent = {
    id: input.id || crypto.randomUUID(),
    repo: input.repo || "octo/garden-engine",
    branch: input.branch || "main",
    commits,
    message: input.message || `Push ${pushNumber} watered the garden`,
    actor: input.actor || "github",
    source: input.source || "webhook",
    createdAt: input.createdAt || new Date().toISOString()
  };

  state.connected = true;
  if (!state.profile) {
    connectProfile();
  }

  state.pushes += 1;
  state.commits += commits;
  state.water = Math.min(100, state.water + 10 + commits * 3);
  state.petMood = Math.min(100, state.petMood + 8 + commits * 2);
  state.level = Math.max(1, Math.floor((state.pushes + state.commits) / 4) + 1);
  state.petStage = state.level > 7 ? "guardian" : state.level > 4 ? "companion" : state.level > 2 ? "sprout" : "seedling";

  const plantTypes: GardenState["plants"][number]["type"][] = ["fern", "flower", "tree", "mushroom"];
  state.plants.push({
    id: `plant-${Date.now()}-${state.pushes}`,
    type: plantTypes[state.pushes % plantTypes.length],
    x: 10 + ((state.pushes * 17) % 80),
    y: 48 + ((state.commits * 11) % 30),
    size: Math.min(1.45, 0.65 + state.level * 0.08)
  });
  state.plants = state.plants.slice(-18);
  state.events.unshift(event);
  state.events = state.events.slice(0, 8);

  return state;
}
