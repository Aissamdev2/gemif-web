import { ARCHIVE_FOLDER_ORDER } from "@/app/lib/utils";
import { jsonResponse, parseGitHubError } from "@/app/lib/helpers";

const GITHUB_API_URL = "https://api.github.com/graphql";
const BATCH_SIZE = 15;
const MAX_DEPTH = 6;

type GitHubContent = {
  name: string;
  path: string;
  type: "file" | "tree";
  oid?: string;
  children?: GitHubContent[];
};

interface TreeBatch {
  [alias: string]: {
    oid: string;
    depth: number;
    parent: GitHubContent;
  };
}

export async function GET(request: Request, { params }: { params: { section: string } }) {
  const userId = request.headers.get("X-User-Id");
  const token = request.headers.get("X-User-Github-Token");
  const section = params.section;

  if (!userId || !token) {
    return jsonResponse({
      error: "Missing headers",
      publicError: "Permiso denegado",
      errorCode: "NO_AUTH",
      details: [],
    }, 401);
  }
  
  try {
    const contents = await fetchGitHubRepoContents(token, section);
    return jsonResponse({ data: { structure: contents } });
  } catch (error: any) {
    if (error.errorCode === "RATE_LIMIT") {
      return jsonResponse({
        error: error.error,
        publicError: "Límite de peticiones alcanzado. Intenta más tarde.",
        errorCode: "RATE_LIMIT",
        details: error.details,
      }, 429);
    }
    return jsonResponse({
      error: error.error,
      publicError: "Error de comunicación externa",
      errorCode: "EXTERNAL_GET_FAILED",
      details: error.details,
    }, 500);
  }
}



const generateTreeQuery = (batch: TreeBatch): string => {
  const fragments = Object.keys(batch).map(alias => `
    ${alias}: object(oid: "${batch[alias].oid}") {
      ... on Tree {
        entries {
          name
          type
          oid
        }
      }
    }
  `).join('\n');

  return `
    query GetTreeBatch {
      repository(owner: "gemif-web", name: "Archive") {
        ${fragments}
      }
    }
  `;
};

const fetchTreeBatch = async (batch: TreeBatch, token: string): Promise<void> => {
  const query = generateTreeQuery(batch);

  const response = await fetch(GITHUB_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });
  if (!response.ok) {
    const resJson = await response.json()
    throw await parseGitHubError(response, resJson);
  }

  const json = await response.json();

  const data = json?.data?.repository;
  if (!data) {
    throw {
      error: "Respuesta inválida de GitHub",
      errorCode: "INVALID_GRAPHQL_RESPONSE",
      details: [],
    };
  }

  for (const [alias, treeData] of Object.entries(data)) {
    const { parent, depth } = batch[alias];
    const entries = (treeData as any).entries || [];

    parent.children = entries.map((entry: any) => ({
      name: entry.name,
      path: `${parent.path}/${entry.name}`,
      type: entry.type === "tree" ? "tree" : "file",
      oid: entry.oid,
    }));

    parent.children?.sort((a, b) => a.name.localeCompare(b.name));
  }
};

async function fetchGitHubRepoContents(token: string, section: string): Promise<GitHubContent[]> {
  const rootQuery = `
    query GetRootTree {
      repository(owner: "gemif-web", name: "Archive") {
        object(expression: "HEAD:${section}") {
          ... on Tree {
            oid
            entries {
              name
              type
              oid
            }
          }
        }
      }
    }
  `;

  const rootResponse = await fetch(GITHUB_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: rootQuery }),
  });
  if (!rootResponse.ok) {
    const rootResJson = await rootResponse.json()
    throw await parseGitHubError(rootResponse, rootResJson);
  }

  const rootJson = await rootResponse.json();
  const rootTree = rootJson?.data?.repository?.object;

  if (!rootTree || !Array.isArray(rootTree.entries)) {
    throw {
      error: "Estructura raíz inválida",
      errorCode: "INVALID_ROOT_TREE",
      details: [],
    };
  }

  const root: GitHubContent = {
    name: section,
    path: section,
    type: "tree",
    oid: rootTree.oid,
    children: rootTree.entries.map((entry: any) => ({
      name: entry.name,
      path: `${section}/${entry.name}`,
      type: entry.type === "tree" ? "tree" : "file",
      oid: entry.oid,
    })),
  };

  // Custom order sort
  root.children?.sort((a, b) =>
    (ARCHIVE_FOLDER_ORDER[a.name] || 0) - (ARCHIVE_FOLDER_ORDER[b.name] || 0)
  );

  const queue: Array<{ parent: GitHubContent; depth: number }> = [];

  root.children?.forEach(child => {
    if (child.type === "tree") {
      queue.push({ parent: child, depth: 1 });
    }
  });

  while (queue.length > 0) {
    const batch: TreeBatch = {};

    while (Object.keys(batch).length < BATCH_SIZE && queue.length > 0) {
      const { parent, depth } = queue.shift()!;
      if (depth >= MAX_DEPTH || !parent.oid) continue;

      const alias = `t${Object.keys(batch).length}`;
      batch[alias] = { oid: parent.oid, depth, parent };
    }

    if (Object.keys(batch).length > 0) {
      await fetchTreeBatch(batch, token);

      for (const { parent, depth } of Object.values(batch)) {
        if (parent.children) {
          parent.children.forEach(child => {
            if (child.type === "tree" && depth + 1 < MAX_DEPTH) {
              queue.push({ parent: child, depth: depth + 1 });
            }
          });
        }
      }
    }
  }

  return root.children || [];
}
