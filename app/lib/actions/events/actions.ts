'use server'

import { cookies } from "next/headers"
import { ApiResponse, ErrorCode, Event } from "../../definitions"
import { revalidateTag } from "next/cache"
import { eventsUpdateSchema, eventsAddSchema, eventsDeleteSchema } from "./validation"
import { normalizeEmptyStrings } from "../../utils"


export async function getEvents(): Promise<{ data: Event[] | null, error: string  | null, errorCode: ErrorCode | null | undefined, details: { name: string; success: boolean, error?: string | null }[] }> {
  const response = await fetch((process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string) + '/api/events', {
    next: { tags: ['calendar'] }
  });
  const resJson: ApiResponse = await response.json();
  if (!response.ok) {
    return { data: null, error: `Error al recuperar los eventos: ${resJson.publicError}`, errorCode: resJson.errorCode, details: resJson.details };
  }
  const events: Event[] = resJson.data;
  return { data: events, error: null, errorCode: null, details: [] };
}


const ERROR_MESSAGES: Record<string, string> = {
  id: 'Id',
  name: 'Título',
  date: 'Fecha',
  time: 'Hora',
  description: 'Descripción',
  subjectid: 'Asignatura',
  primitiveid: 'Id primitivo',
  scope: 'Visibilidad'
}

export async function addEvent(formData: FormData): Promise<{ data: Event[] | null, error: string | null, errorCode: ErrorCode | null | undefined, details: { name: string; success: boolean, error?: string | null }[]  }> {
  const rawInput = {
    name: formData.get("name"),
    date: formData.get("date"),
    time: formData.get("time"),
    description: formData.get("description"),
    subjectid: formData.get("subjectid"),
    primitiveid: formData.get("primitiveid"),
    scope: formData.get("scope"),
  };

  const input = normalizeEmptyStrings(rawInput);

  const parsed = eventsAddSchema.safeParse(input);
  if (!parsed.success) {
    const errors = parsed.error.issues;
    return {
      data: null,
      error: 'Error de formato',
      errorCode: "BAD_REQUEST",
      details: errors.map((e) => ({ name: ERROR_MESSAGES[e.path[0].toString()], success: false, error: e.message }))
    };
  }
  const { ...event } = parsed.data;

  
  const response = await fetch((process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string) + '/api/events', {
    method: 'POST',
     headers: {
      Cookie: (await cookies()).toString(),
      'Content-Type': 'application/json',
      
    },
    body: JSON.stringify(event),
  })
  if (response.ok) {
    return getEvents()
  }
  const resJson: ApiResponse = await response.json();
  return { data: null, error: resJson.publicError?? 'Error al añadir el evento', errorCode: resJson.errorCode, details: resJson.details };
}

export async function updateEvent(formData: FormData): Promise<{ data: Event[] | null, error: string | null, errorCode: ErrorCode | null | undefined, details: { name: string; success: boolean, error?: string | null }[] }> {
    const rawInput = {
      id: formData.get("id"),
      name: formData.get("name"),
      date: formData.get("date"),
      time: formData.get("time"),
      description: formData.get("description"),
      subjectid: formData.get("subjectid"),
      primitiveid: formData.get("primitiveid"),
      scope: formData.get("scope"),
    };

    const input = normalizeEmptyStrings(rawInput);

    const parsed = eventsUpdateSchema.safeParse(input);
    if (!parsed.success) {
    const errors = parsed.error.issues;
    return {
      data: null,
      error: 'Error de formato',
      errorCode: "BAD_REQUEST",
      details: errors.map((e) => ({ name: ERROR_MESSAGES[e.path[0].toString()], success: false, error: e.message }))
    };
  }


  const { id, ...event } = parsed.data;

  const response = await fetch((process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string) + '/api/events/' + id, {
    method: 'PATCH',
     headers: {
      Cookie: (await cookies()).toString(),
      'Content-Type': 'application/json',
      
    },
    body: JSON.stringify(event),
  })
  if (response.ok) {
    revalidateTag('calendar')
    const events = await getEvents();
    return events;
  }

  const resJson: ApiResponse = await response.json();
  return { data: null, error: resJson.publicError?? 'Error al actualizar el evento', errorCode: resJson.errorCode, details: resJson.details }
}

export async function deleteEvent(formData: FormData): Promise<{ data: Event[] | null, error: string | null, errorCode: ErrorCode | null | undefined, details: { name: string; success: boolean, error?: string | null }[] }> {
  const inputRaw = {
    id: formData.get("id")
  }

  const input = normalizeEmptyStrings(inputRaw);
  const parsed = eventsDeleteSchema.safeParse(input);
  if (!parsed.success) {
    const errors = parsed.error.issues;
    return {
      data: null,
      error: 'Error de formato',
      errorCode: "BAD_REQUEST",
      details: errors.map((e) => ({ name: e.path[0].toString(), success: false, error: e.message }))
    };
  }
  const { id } = parsed.data;
  const response = await fetch((process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string) + '/api/events/' + id, {
    method: 'DELETE',
     headers: {
      Cookie: (await cookies()).toString(),
      'Content-Type': 'application/json',
      
    },
  })
  if (response.ok) {
    revalidateTag('calendar')
    return getEvents()
  }
  const resJson: ApiResponse = await response.json();
  return { data: null, error: resJson.publicError?? 'Error al eliminar el evento', errorCode: resJson.errorCode, details: resJson.details }
}



export async function getEvent(id: string): Promise<{ data: Event | null, error: string | null, errorCode: ErrorCode | null | undefined }> {
  const response = await fetch((process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string) + '/api/events/' + id, {
     headers: {
      Cookie: (await cookies()).toString(),
      
    }
  });
  const resJson: ApiResponse = await response.json();
  if (!response.ok) {
    return { data: null, error: resJson.publicError?? 'Error al recuperar el evento', errorCode: resJson.errorCode };
  }
  const event: Event = resJson.data;
  return { data: event, error: null, errorCode: null };
}