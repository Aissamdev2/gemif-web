import { ARCHIVE_FOLDER_ORDER } from "@/app/lib/utils";

const GITHUB_API_URL = "https://api.github.com/graphql";
const BATCH_SIZE = 15; // Number of directories per GraphQL request
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

export async function GET(request: Request) {
  const userId = request.headers.get("X-User-Id");
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const token = request.headers.get("X-User-Github-Token");
  if (!token) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const contents = await fetchGitHubRepoContents(token);
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
    console.error("GitHub API Request Failed:", response.status, response.statusText);
    throw new Error(`GitHub API request failed: ${response.statusText}`);
  }

  const json = await response.json();
  const data = json.data?.repository;

  for (const [alias, treeData] of Object.entries(data)) {
    const { parent, depth } = batch[alias];
    const entries = (treeData as any).entries || [];

    parent.children = entries.map((entry: any) => {
      const node: GitHubContent = {
        name: entry.name,
        path: `${parent.path}/${entry.name}`,
        type: entry.type === "tree" ? "tree" : "file",
        oid: entry.oid,
      };
      return node;
    });

    // Sort children immediately after fetching
    parent.children?.sort((a, b) => a.name.localeCompare(b.name));
  }
};

async function fetchGitHubRepoContents(token: string): Promise<GitHubContent[]> {
  // Initial root fetch
  const rootQuery = `
    query GetRootTree {
      repository(owner: "gemif-web", name: "Archive") {
        object(expression: "HEAD:archive") {
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

  const rootJson = await rootResponse.json();
  const rootTree = rootJson.data?.repository?.object;
  
  if (!rootTree) {
    console.error("Invalid root tree response:", JSON.stringify(rootJson, null, 2));
    return [];
  }

  const root: GitHubContent = {
    name: "archive",
    path: "archive",
    type: "tree",
    oid: rootTree.oid,
    children: rootTree.entries.map((entry: any) => ({
      name: entry.name,
      path: `archive/${entry.name}`,
      type: entry.type === "tree" ? "tree" : "file",
      oid: entry.oid,
    })),
  };

  // Sort root children using custom order
  root.children?.sort((a, b) => 
    (ARCHIVE_FOLDER_ORDER[a.name] || 0) - (ARCHIVE_FOLDER_ORDER[b.name] || 0)
  );

  const queue: Array<{
    parent: GitHubContent;
    depth: number;
  }> = [];

  // Initialize queue with first level directories
  root.children?.forEach(child => {
    if (child.type === "tree") {
      queue.push({ parent: child, depth: 1 });
    }
  });

  // Process queue in batches
  while (queue.length > 0) {
    const batch: TreeBatch = {};
    
    // Fill batch
    while (Object.keys(batch).length < BATCH_SIZE && queue.length > 0) {
      const { parent, depth } = queue.shift()!;
      if (depth >= MAX_DEPTH || !parent.oid) continue;
      
      const alias = `t${Object.keys(batch).length}`;
      batch[alias] = { oid: parent.oid, depth, parent };
    }

    if (Object.keys(batch).length > 0) {
      await fetchTreeBatch(batch, token);
      
      // Process results and repopulate queue
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




// fetches with max depth per request

// import { ARCHIVE_FOLDER_ORDER } from "@/app/lib/utils";

// const GITHUB_API_URL = "https://api.github.com/graphql";


// export type GitHubContent = {
//   name: string;
//   path: string;
//   type: "file" | "tree";
//   children?: GitHubContent[];
// };

// export async function GET(request: Request) {
//   const userId = request.headers.get("X-User-Id");
//   if (!userId) {
//     return new Response("Unauthorized", { status: 401 });
//   }

//   const token = request.headers.get("X-User-Github-Token");
//   if (!token) {
//     return new Response("Unauthorized", { status: 401 });
//   }

//   const owner = "gemif-web";
//   const repo = "Archive";
//   const path = "archive";

//   try {
//     const contents = await fetchGitHubRepoContents({ owner, repo, path, token });
//     return new Response(JSON.stringify(contents), {
//       status: 200,
//       headers: { "Content-Type": "application/json" },
//     });
//   } catch (error: any) {
//     console.error("Error fetching GitHub repo contents:", error);
//     return new Response(
//       JSON.stringify({ error: "Failed to fetch GitHub repo contents" }),
//       {
//         status: 500,
//         headers: { "Content-Type": "application/json" },
//       }
//     );
//   }
// }

// const MAX_DEPTH_PER_REQUEST = 5; // Levels per API call
// const MAX_RETRIES = 3;
// const RETRY_BASE_DELAY = 1000; // 1 second

// interface FetchQueueItem {
//   path: string;
//   parentRef?: GitHubContent;
//   depth: number;
// }

// const fetchGitHubRepoContents = async ({
//   owner,
//   repo,
//   path,
//   token,
// }: {
//   owner: string;
//   repo: string;
//   path: string;
//   token: string;
// }): Promise<GitHubContent[]> => {
//   const fetchQueue: FetchQueueItem[] = [{ path, depth: 0 }];
//   const rootEntries: GitHubContent[] = [];

//   while (fetchQueue.length > 0) {
//     const currentItem = fetchQueue.shift()!;
//     const result = await fetchDirectoryChunk({
//       owner,
//       repo,
//       path: currentItem.path,
//       token,
//       currentDepth: currentItem.depth,
//       parentRef: currentItem.parentRef,
//     });

//     if (currentItem.depth === 0) {
//       rootEntries.push(...result.entries);
//     }
    
//     fetchQueue.push(...result.nextQueueItems);
//   }

//   return rootEntries.sort((a, b) => ARCHIVE_FOLDER_ORDER[a.name] - ARCHIVE_FOLDER_ORDER[b.name]);
// };

// const fetchDirectoryChunk = async ({
//   owner,
//   repo,
//   path,
//   token,
//   currentDepth,
//   parentRef,
// }: {
//   owner: string;
//   repo: string;
//   path: string;
//   token: string;
//   currentDepth: number;
//   parentRef?: GitHubContent;
// }): Promise<{ entries: GitHubContent[]; nextQueueItems: FetchQueueItem[] }> => {
//   const query = buildQuery(MAX_DEPTH_PER_REQUEST);
//   const response = await fetchWithRetry(query, { owner, repo, expression: `HEAD:${path}` }, token);

//   const rootTree = response?.data?.repository?.object;
//   if (!rootTree?.entries) return { entries: [], nextQueueItems: [] };

//   const processResult = processChunkEntries(
//     rootTree.entries,
//     path,
//     currentDepth,
//     MAX_DEPTH_PER_REQUEST
//   );

//   // Attach children to parent reference if exists
//   if (parentRef) {
//     parentRef.children = processResult.entries;
//   }

//   return {
//     entries: processResult.entries,
//     nextQueueItems: processResult.pendingDirs.map(dir => ({
//       path: dir.path,
//       parentRef: dir,
//       depth: currentDepth + MAX_DEPTH_PER_REQUEST
//     }))
//   };
// };

// const processChunkEntries = (
//   entries: any[],
//   parentPath: string,
//   startDepth: number,
//   chunkDepth: number
// ): { entries: GitHubContent[]; pendingDirs: GitHubContent[] } => {
//   const processed: GitHubContent[] = [];
//   const pendingDirs: GitHubContent[] = [];

//   entries.forEach(entry => {
//     const fullPath = `${parentPath}/${entry.name}`;
//     const isDirectory = entry.type === 'tree';
//     const content: GitHubContent = {
//       name: entry.name,
//       path: fullPath,
//       type: isDirectory ? 'tree' : 'file',
//     };

//     if (isDirectory) {
//       const nestedResult = processNestedEntries(
//         entry.object?.entries || [],
//         fullPath,
//         startDepth + 1,
//         startDepth + chunkDepth
//       );
      
//       content.children = nestedResult.entries;
//       pendingDirs.push(...nestedResult.pendingDirs);
//     }

//     processed.push(content);
//   });

//   return { entries: processed, pendingDirs };
// };

// const processNestedEntries = (
//   entries: any[],
//   parentPath: string,
//   currentDepth: number,
//   maxDepth: number
// ): { entries: GitHubContent[]; pendingDirs: GitHubContent[] } => {
//   const processed: GitHubContent[] = [];
//   const pendingDirs: GitHubContent[] = [];

//   entries.forEach(entry => {
//     const fullPath = `${parentPath}/${entry.name}`;
//     const isDirectory = entry.type === 'tree';
//     const content: GitHubContent = {
//       name: entry.name,
//       path: fullPath,
//       type: isDirectory ? 'tree' : 'file',
//     };

//     if (isDirectory) {
//       if (currentDepth < maxDepth && entry.object?.entries) {
//         const nestedResult = processNestedEntries(
//           entry.object.entries,
//           fullPath,
//           currentDepth + 1,
//           maxDepth
//         );
//         content.children = nestedResult.entries;
//         pendingDirs.push(...nestedResult.pendingDirs);
//       } else {
//         pendingDirs.push(content);
//       }
//     }

//     processed.push(content);
//   });

//   return { entries: processed, pendingDirs };
// };

// const buildQuery = (depth: number): string => {
//   const buildFields = (currentDepth: number): string => {
//     if (currentDepth > depth) return '';
//     return `
//       entries {
//         name
//         type
//         object {
//           ... on Tree {
//             ${buildFields(currentDepth + 1)}
//           }
//         }
//       }
//     `;
//   };

//   return `
//     query GetRepoFiles($owner: String!, $repo: String!, $expression: String!) {
//       repository(owner: $owner, name: $repo) {
//         object(expression: $expression) {
//           ... on Tree {
//             ${buildFields(1)}
//           }
//         }
//       }
//     }
//   `;
// };

// const fetchWithRetry = async (query: string, variables: any, token: string, attempt = 1): Promise<any> => {
//   try {
//     const response = await fetch(GITHUB_API_URL, {
//       method: "POST",
//       headers: {
//         Authorization: `Bearer ${token}`,
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({ query, variables }),
//     });

//     console.log('response', response.headers)

//     if (response.status === 502 && attempt <= MAX_RETRIES) {
//       await delay(RETRY_BASE_DELAY * attempt);
//       return fetchWithRetry(query, variables, token, attempt + 1);
//     }

//     if (!response.ok) throw new Error(`HTTP ${response.status}`);

//     return response.json();
//   } catch (error) {
//     if (attempt <= MAX_RETRIES) {
//       await delay(RETRY_BASE_DELAY * attempt);
//       return fetchWithRetry(query, variables, token, attempt + 1);
//     }
//     throw error;
//   }
// };

// const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));






//ALL AT ONCE FROM DEEPSEEK

// import { ARCHIVE_FOLDER_ORDER } from "@/app/lib/utils";

// const GITHUB_API_URL = "https://api.github.com/graphql";

// export type GitHubContent = {
//   name: string;
//   path: string;
//   type: "file" | "tree";
//   children?: GitHubContent[];
// };

// export async function GET(request: Request) {
//   const userId = request.headers.get("X-User-Id");
//   if (!userId) {
//     return new Response("Unauthorized", { status: 401 });
//   }

//   const token = request.headers.get("X-User-Github-Token");
//   if (!token) {
//     return new Response("Unauthorized", { status: 401 });
//   }

//   const owner = "gemif-web";
//   const repo = "Archive";
//   const path = "archive";

//   try {
//     const contents = await fetchGitHubRepoContents({ owner, repo, path, token, depth: 7 });
//     return new Response(JSON.stringify(contents), {
//       status: 200,
//       headers: { "Content-Type": "application/json" },
//     });
//   } catch (error: any) {
//     console.error("Error fetching GitHub repo contents:", error);
//     return new Response(
//       JSON.stringify({ error: "Failed to fetch GitHub repo contents" }),
//       {
//         status: 500,
//         headers: { "Content-Type": "application/json" },
//       }
//     );
//   }
// }

// const buildNestedFields = (depth: number, currentLevel: number = 1): string => {
//   if (currentLevel >= depth) return '';
//   return `
//     object {
//       ... on Tree {
//         entries {
//           name
//           type
//           ${buildNestedFields(depth, currentLevel + 1)}
//         }
//       }
//     }
//   `;
// };

// const buildQuery = (depth: number): string => {
//   return `
//     query GetRepoFiles($owner: String!, $repo: String!, $expression: String!) {
//       repository(owner: $owner, name: $repo) {
//         object(expression: $expression) {
//           ... on Tree {
//             entries {
//               name
//               type
//               ${buildNestedFields(depth)}
//             }
//           }
//         }
//       }
//     }
//   `;
// };

// const processNestedEntries = (
//   entries: any[],
//   parentPath: string,
//   currentDepth: number,
//   maxDepth: number
// ): GitHubContent[] => {
//   return entries.map(entry => {
//     const fullPath = `${parentPath}/${entry.name}`;
//     const content: GitHubContent = {
//       name: entry.name,
//       path: fullPath,
//       type: entry.type === 'tree' ? 'tree' : 'file',
//     };

//     if (entry.type === 'tree' && entry.object?.entries && currentDepth < maxDepth) {
//       content.children = processNestedEntries(
//         entry.object.entries,
//         fullPath,
//         currentDepth + 1,
//         maxDepth
//       );
//     }

//     return content;
//   });
// };

// const fetchGitHubRepoContents = async ({
//   owner,
//   repo,
//   path,
//   token,
//   depth,
// }: {
//   owner: string;
//   repo: string;
//   path: string;
//   token: string;
//   depth: number;
// }): Promise<GitHubContent[]> => {
//   const query = buildQuery(depth);

//   const response = await fetch(GITHUB_API_URL, {
//     method: "POST",
//     headers: {
//       Authorization: `Bearer ${token}`,
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify({
//       query,
//       variables: { owner, repo, expression: `HEAD:${path}` },
//     }),
//   });

//   if (!response.ok) {
//     console.error("GitHub API Request Failed:", response.status, response.statusText);
//     throw new Error(`GitHub API request failed: ${response.statusText}`);
//   }

//   const json = await response.json();
//   const rootTree = json?.data?.repository?.object;

//   if (!rootTree?.entries) {
//     console.error("Invalid GitHub API Response:", JSON.stringify(json, null, 2));
//     return [];
//   }

//   const processedEntries = processNestedEntries(rootTree.entries, path, 1, depth);
//   return processedEntries.sort((a, b) => ARCHIVE_FOLDER_ORDER[a.name] - ARCHIVE_FOLDER_ORDER[b.name]);
// };