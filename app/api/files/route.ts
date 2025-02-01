import { ARCHIVE_FOLDER_ORDER } from "@/app/lib/utils";



const GITHUB_API_URL = "https://api.github.com/graphql";

export type GitHubContent = {
  name: string;
  path: string;
  type: "file" | "tree";
  children?: GitHubContent[];
};

export async function GET(request: Request) {
  const userId = request.headers.get('X-User-Id');
  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  const token = request.headers.get('X-User-Github-Token');
  if (!token) {
    return new Response('Unauthorized', { status: 401 });
  }
  

  const owner = "gemif-web"; // Your GitHub organization
  const repo = "Archive"; // Your repository
  const path = "archive"; // The root path to fetch

  try {
    const contents = await fetchGitHubRepoContents({ owner, repo, path, token });
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
              object {
                ... on Tree {
                  entries {
                    name
                    type
                    object {
                      ... on Tree {
                        entries {
                          name
                          type
                          object {
                            ... on Tree {
                              entries {
                                name
                                type
                                object {
                                  ... on Tree {
                                    entries {
                                      name
                                      type
                                      object {
                                        ... on Tree {
                                          entries {
                                            name
                                            type
                                            object {
                                              ... on Tree {
                                                entries {
                                                  name
                                                  type
                                                }
                                              }
                                            }
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
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
    throw new Error("GitHub API request failed");
  }

  const json = await response.json();
  const entries = json.data?.repository?.object?.entries ?? [];

  // Convert entries into the desired format
  const processEntries = (entryList: any[], parentPath: string): GitHubContent[] => {
    return entryList.map((entry) => {
      const fullPath = `${parentPath}/${entry.name}`;
      if (entry.type === "tree") {
        return {
          name: entry.name,
          path: fullPath,
          type: "tree",
          children: entry.object?.entries ? processEntries(entry.object.entries, fullPath) : [],
        };
      }
      return {
        name: entry.name,
        path: fullPath,
        type: "file",
      };
    });
  };

  return processEntries(entries, path).sort((a, b) => ARCHIVE_FOLDER_ORDER[a.name] - ARCHIVE_FOLDER_ORDER[b.name]);
};





// export type GitHubContent = {
//   name: string;
//   path: string;
//   type: "file" | "dir";
//   children?: GitHubContent[]; // Only for directories
// };

// export async function GET() {
//   const owner = "gemif-web"; // Replace with your GitHub organization name
//   const repo = "Archive"; // Replace with your repository name
//   const branch = "main"; // Replace with your branch name
//   const baseURL = `https://api.github.com/repos/${owner}/${repo}/contents/`;

//   const verification = await verifySession();
//   const session = verification.session
//   if (!session) return new Response('Unauthorized', { status: 401 })

//   // Helper function to fetch the structure recursively
//   async function fetchStructure(path = "archive"): Promise<GitHubContent[]> {
//     const token = session?.githubtoken // Set this in your `.env.local`

//     const headers: HeadersInit = token
//       ? { Authorization: `Bearer ${token}` }
//       : {};

//     // Fetch the content of the current folder
//     const response = await fetch(`${baseURL}${path}`, { headers });
//     if (!response.ok) {
//       if (response.status === 403) {
//         throw new Error("GitHub API rate limit exceeded");
//       }
//       throw new Error(`Failed to fetch GitHub contents: ${response.statusText}`);
//     }

//     const data: GitHubContent[] = await response.json();

//     // Process and recursively fetch children for directories
//     const structure: GitHubContent[] = await Promise.all(
//       data.map(async (item) => {
//         if (item.type === "dir") {
//           const children = await fetchStructure(item.path);
//           return { ...item, children };
//         }
//         return item;
//       })
//     );

//     return structure.sort((a, b) => ARCHIVE_FOLDER_ORDER[a.name] - ARCHIVE_FOLDER_ORDER[b.name]);
//   }


//   try {
//     const structure = await fetchStructure();
//     return new Response(JSON.stringify(structure), {
//       status: 200,
//       headers: { "Content-Type": "application/json" },
//     });
//   } catch (error: any) {
//     if (error.message === "GitHub API rate limit exceeded") {
//       return new Response(
//         JSON.stringify({ error: "GitHub API rate limit exceeded" }),
//         {
//           status: 429,
//           headers: { "Content-Type": "application/json" },
//         }
//       );
//     }
//     return new Response(JSON.stringify({ error: (error as Error).message }), {
//       status: 500,
//       headers: { "Content-Type": "application/json" },
//     });
//   }
// }