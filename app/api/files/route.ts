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
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const token = request.headers.get("X-User-Github-Token");
  if (!token) {
    return new Response("Unauthorized", { status: 401 });
  }

  const owner = "gemif-web";
  const repo = "Archive";
  const path = "archive";

  try {
    const contents = await fetchGitHubRepoContents({ owner, repo, path, token, depth: 7 });
    return new Response(JSON.stringify(contents), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error fetching GitHub repo contents:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch GitHub repo contents" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

const buildNestedFields = (depth: number, currentLevel: number = 1): string => {
  if (currentLevel >= depth) return '';
  return `
    object {
      ... on Tree {
        entries {
          name
          type
          ${buildNestedFields(depth, currentLevel + 1)}
        }
      }
    }
  `;
};

const buildQuery = (depth: number): string => {
  return `
    query GetRepoFiles($owner: String!, $repo: String!, $expression: String!) {
      repository(owner: $owner, name: $repo) {
        object(expression: $expression) {
          ... on Tree {
            entries {
              name
              type
              ${buildNestedFields(depth)}
            }
          }
        }
      }
    }
  `;
};

const processNestedEntries = (
  entries: any[],
  parentPath: string,
  currentDepth: number,
  maxDepth: number
): GitHubContent[] => {
  return entries.map(entry => {
    const fullPath = `${parentPath}/${entry.name}`;
    const content: GitHubContent = {
      name: entry.name,
      path: fullPath,
      type: entry.type === 'tree' ? 'tree' : 'file',
    };

    if (entry.type === 'tree' && entry.object?.entries && currentDepth < maxDepth) {
      content.children = processNestedEntries(
        entry.object.entries,
        fullPath,
        currentDepth + 1,
        maxDepth
      );
    }

    return content;
  });
};

const fetchGitHubRepoContents = async ({
  owner,
  repo,
  path,
  token,
  depth,
}: {
  owner: string;
  repo: string;
  path: string;
  token: string;
  depth: number;
}): Promise<GitHubContent[]> => {
  const query = buildQuery(depth);

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
  const rootTree = json?.data?.repository?.object;

  if (!rootTree?.entries) {
    console.error("Invalid GitHub API Response:", JSON.stringify(json, null, 2));
    return [];
  }

  const processedEntries = processNestedEntries(rootTree.entries, path, 1, depth);
  return processedEntries.sort((a, b) => ARCHIVE_FOLDER_ORDER[a.name] - ARCHIVE_FOLDER_ORDER[b.name]);
};