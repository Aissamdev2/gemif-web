export type GitHubContent = {
  name: string;
  path: string;
  type: "file" | "dir";
  children?: GitHubContent[]; // Only for directories
};

export async function GET(request: Request) {
  const owner = "gemif-web"; // Replace with your GitHub username
  const repo = "Archive"; // Replace with your repo name
  const branch = "main"; // Replace with your branch name
  const baseURL = `https://api.github.com/repos/${owner}/${repo}/contents/`;

  const userId = request.headers.get('X-User-Id');
  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }
  const token = request.headers.get('X-User-Github-Token');
  if (!token) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Helper function to fetch the structure recursively
  async function fetchStructure(path = "main-data"): Promise<GitHubContent[]> {

    const headers: HeadersInit = token
      ? { Authorization: `Bearer ${token}` }
      : {};

    const response = await fetch(`${baseURL}${path}`, { headers });
    if (!response.ok) {
      throw new Error(`Failed to fetch GitHub contents: ${response.statusText}`);
    }

    const data: GitHubContent[] = await response.json();

    return data;
  }

  try {
    const structure = await fetchStructure();
    return new Response(JSON.stringify(structure), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    if (error.status === 403) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded" }),
        {
          status: 429,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
