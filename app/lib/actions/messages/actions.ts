'use server'

import { cookies } from "next/headers";
import { ApiResponse, ErrorCode, Message } from "../../definitions";
import { revalidateTag } from "next/cache";


export async function getMessages(): Promise<{ data: Message[] | null; error: string | null; errorCode: ErrorCode | null | undefined }> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL}/api/messages`, {
    headers: { Cookie: cookies().toString() },
    next: { tags: ['messages'] },
    cache: 'no-store',
  });
  const resJson: ApiResponse = await response.json();
  if (!response.ok) {
    return { data: null, error: `Error obteniendo mensajes: ${resJson.publicError}`, errorCode: resJson.errorCode };
  }

  const messages: Message[] = resJson.data;

  const payload = { lastseen: new Date().toISOString() };
  const responseLastSeen = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL}/api/user/`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookies().toString(),
    },
    body: JSON.stringify(payload),
  });
  const resJsonLastSeen: ApiResponse = await responseLastSeen.json();
  if (!responseLastSeen.ok) {
    return { data: null, error: `Error actualizando mensajes: ${resJsonLastSeen.publicError}`, errorCode: resJsonLastSeen.errorCode };
  }

  revalidateTag('messages/unseen');

  return {
    data: messages.sort((a, b) => new Date(b.createdat).getTime() - new Date(a.createdat).getTime()),
    error: null, errorCode: null,
  };
}


export async function getMessage(id: string): Promise<{ data: Message | null; error: string | null; errorCode: ErrorCode | null | undefined }> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL}/api/messages/${id}`, {
    headers: { Cookie: cookies().toString() },
  });
  const resJson: ApiResponse = await response.json();
  if (!response.ok) {
    return { data: null, error: `Error obteniendo mensaje: ${resJson.publicError}`, errorCode: resJson.errorCode };
  }
  const message: Message = resJson.data;
  return { data: message, error: null, errorCode: null };
}


export async function deleteMessage(formData: FormData): Promise<{ data: Message[] | null; error: string | null; errorCode: ErrorCode | null | undefined }> {
  const id = formData.get("id") as string;
  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL}/api/messages/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookies().toString(),
    },
  });
  const resJson: ApiResponse = await response.json();
  if (!response.ok) {
    return { data: null, error: `Error eliminando mensaje: ${resJson.publicError}`, errorCode: resJson.errorCode };
  }
  revalidateTag('messages/unseen');
  return getMessages();
}


export async function updateMessage(formData: FormData): Promise<{ data: Message[] | null; error: string | null; errorCode: ErrorCode | null | undefined }> {
  const id = formData.get("id") as string;
  const message = {
    name: formData.get("name") as string,
    description: formData.get('description') as string | null,
    year: formData.get('year') as string | null,
    scope: formData.get('scope') as string,
  };
  const filteredMessage = Object.fromEntries(Object.entries(message).filter(([_, v]) => v !== 'null'));

  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL}/api/messages/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookies().toString(),
    },
    body: JSON.stringify(filteredMessage),
  });
  const resJson: ApiResponse = await response.json();
  if (!response.ok) {
    return { data: null, error: `Error editando mensaje: ${resJson.publicError}`, errorCode: resJson.errorCode };
  }

  revalidateTag('messages');
  return getMessages();
}


export async function addMessage(formData: FormData): Promise<{ data: Message[] | null; error: string | null; errorCode: ErrorCode | null | undefined }> {
  const message = {
    name: formData.get("name") as string,
    description: formData.get('description') as string | null,
    scope: formData.get('scope') as string,
    year: formData.get('year') as string | null,
  };
  const filteredMessage = Object.fromEntries(Object.entries(message).filter(([_, v]) => v !== 'null' && v !== null));

  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL}/api/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookies().toString(),
    },
    body: JSON.stringify(filteredMessage),
  });
  const resJson: ApiResponse = await response.json();
  if (!response.ok) {
    return { data: null, error: `Error creando mensaje: ${resJson.publicError}`, errorCode: resJson.errorCode };
  }

  return getMessages();
}


export async function checkUnseenMessages(): Promise<{ data: Message[] | null; error: string | null; errorCode: ErrorCode | null | undefined }> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL}/api/messages/unseen`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookies().toString(),
    },
    next: { tags: ['messages/unseen'] },
  });
  const resJson: ApiResponse = await response.json();
  if (!response.ok) {
    return { data: null, error: 'No se pudieron obtener los mensajes: ' + resJson.publicError, errorCode: resJson.errorCode };
  }
  
  const messages: Message[] = resJson.data;
  return { data: messages, error: null, errorCode: null };
}

