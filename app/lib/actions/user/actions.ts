'use server'

import { cookies } from "next/headers";
import { ApiResponse, ErrorCode, User } from "../../definitions";
import { cache } from "react";


export const getUser = cache(async (): Promise<{ data: User | null, error: string | null, errorCode: ErrorCode | null | undefined }> => {
  console.log('getUser');
  const response = await fetch((process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string) + '/api/user', {
     headers: {
       'X-Internal-Token': process.env.INTERAL_API_SECRET ?? 'BrawlStars',
      
    },
    cache: "force-cache",
    next: {
      revalidate: 30
    }
  });
  const resJson: ApiResponse = await response.json();
  if (!response.ok) {
    return { data: null, error: 'Error al recuperar información del usuario, error: ' + resJson.publicError, errorCode: resJson.errorCode };
  }
  const user: User =  resJson.data;
  return { data: user, error: null, errorCode: null };
})


export async function updateUser(formData: FormData): Promise<{ data: User | null; error: string | null; errorCode: ErrorCode | null | undefined, details: { name: string; success: boolean, error?: string | null }[] }> {
  const name = formData.get('name') as string | null;
  const email = formData.get('email') as string | null;
  const year = formData.get('year') as string | null;
  const role = formData.get('role') as string | null;
  const color = formData.get('userColor') as string | null;
  const payload = { name, email, year, role, color }
  const filteredPayload = Object.fromEntries(Object.entries(payload).filter(([_, v]) => v !== null))

  const response = await fetch((process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string) + '/api/user/', {
    method: 'PATCH',
     headers: {
      Cookie: (await cookies()).toString(),
      'Content-Type': 'application/json',
      
    },
    body: JSON.stringify(filteredPayload),
  })
  const resJson: ApiResponse = await response.json();
  if (!response.ok) {
    return { data: null, error: 'Error al actualizar datos del usuario: ' + resJson.publicError, errorCode: resJson.errorCode, details: resJson.details };
  }

  const user: User = resJson.data;
  return { data: user, error: null, errorCode: null, details: [] };
}