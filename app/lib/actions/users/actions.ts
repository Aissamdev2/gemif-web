'use server'

import { cookies } from "next/headers";
import { ApiResponse, ErrorCode, FetchedUser } from "../../definitions";



export async function getUsers(): Promise<{ data: FetchedUser[] | null, error: string | null, errorCode: ErrorCode | null | undefined }> {
  const response = await fetch((process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string) + '/api/users', {
    headers: {
      Cookie: cookies().toString()
    },
    next: { tags: ['users'] }
  });
  const resJson: ApiResponse = await response.json();
  if (!response.ok) {
    return { data: null, error: `Error al recuperar los usuarios: ${resJson.publicError}`, errorCode: resJson.errorCode };
  }
  const users: FetchedUser[] = resJson.data;
  return { data: users, error: null, errorCode: null };
}
