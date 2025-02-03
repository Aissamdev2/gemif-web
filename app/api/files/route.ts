import { ARCHIVE_FOLDER_ORDER } from "@/app/lib/utils";

const GITHUB_API_URL = "https://api.github.com/graphql";

export type GitHubContent = {
  name: string;
  path: string;
  type: "file" | "tree";
  children?: GitHubContent[];
};

export async function GET(request: Request) {
  const userId = request.headers.get("X-User-Id");
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const token = request.headers.get("X-User-Github-Token");
  if (!token) return new Response("Unauthorized", { status: 401 });

  const owner = "gemif-web";
  const repo = "Archive";
  const path = "archive";
  const maxDepth = 7; // Fetch up to 7 levels deep

  try {
    const contents = await fetchRepoContentsRecursive({ owner, repo, path, token, depth: 0, maxDepth });
    return new Response(JSON.stringify(contents), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error fetching GitHub repo contents:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch GitHub repo contents" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

const fetchRepoContentsRecursive = async ({
  owner,
  repo,
  path,
  token,
  depth,
  maxDepth,
}: {
  owner: string;
  repo: string;
  path: string;
  token: string;
  depth: number;
  maxDepth: number;
}): Promise<GitHubContent[]> => {
  if (depth >= maxDepth) return [];

  const entries = await fetchGitHubRepoContents({ owner, repo, path, token });

  await Promise.all(
    entries.map(async (entry) => {
      if (entry.type === "tree") {
        entry.children = await fetchRepoContentsRecursive({
          owner,
          repo,
          path: entry.path,
          token,
          depth: depth + 1,
          maxDepth,
        });
      }
    })
  );

  return entries.sort(
    (a, b) => ARCHIVE_FOLDER_ORDER[a.name] - ARCHIVE_FOLDER_ORDER[b.name]
  );
};

const fetchGitHubRepoContents = async ({
  owner,
  repo,
  path,
  token,
}: {
  owner: string;
  repo: string;
  path: string;
  token: string;
}): Promise<GitHubContent[]> => {
  const query = `
    query GetRepoFiles($owner: String!, $repo: String!, $expression: String!) {
      repository(owner: $owner, name: $repo) {
        object(expression: $expression) {
          ... on Tree {
            entries {
              name
              type
            }
          }
        }
      }
    }
  `;

  const response = await fetch(GITHUB_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      variables: { owner, repo, expression: `HEAD:${path}` },
    }),
  });

  if (!response.ok) {
    console.error("GitHub API Request Failed:", response.status, response.statusText);
    throw new Error(`GitHub API request failed: ${response.statusText}`);
  }

  const json = await response.json();
  const entries = json.data?.repository?.object?.entries ?? [];

  return entries.map((entry: any) => ({
    name: entry.name,
    path: `${path}/${entry.name}`,
    type: entry.type === "tree" ? "tree" : "file",
  }));
};
