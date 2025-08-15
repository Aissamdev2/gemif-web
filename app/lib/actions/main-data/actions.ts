'use server'

import { cookies } from "next/headers";
import { ApiResponse, ErrorCode, GitHubContent } from "../../definitions";


export async function getMainData(): Promise<{data: GitHubContent[] | null, error: string | null, errorCode: ErrorCode | null | undefined }> {
  const res = await fetch((process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string) + "/api/main-data", { 
     headers: {
      Cookie: (await cookies()).toString(),
      
    },
    cache: "no-cache" 
  });
  const resJson: ApiResponse = await res.json();
  if (!res.ok) {
    if (res.status === 429) {
      return {data: null, error: 'Limite de peticiones alcanzado', errorCode: resJson.errorCode};
    }
    return {data: null, error: 'Error al recuperar los recursos: ' + resJson.publicError, errorCode: resJson.errorCode};
  }
  const data: GitHubContent[] = resJson.data;
  return { data, error: null, errorCode: null };
}
