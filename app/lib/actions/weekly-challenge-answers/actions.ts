'use server'

import { cookies } from "next/headers";
import { ApiResponse, ErrorCode, WeeklyChallengeAnswer } from "../../definitions";



export async function getWeeklyChallengeAnswers(): Promise<{ data: WeeklyChallengeAnswer[] | null; error: string | null; errorCode: ErrorCode | null | undefined, details: { name: string; success: boolean, error?: string | null }[] }> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL}/api/weekly-challenge-answers`, {
    headers: { Cookie: cookies().toString() },
    next: { tags: ['weekly-challenge-answers'] },
    cache: "no-store",
  });
  const resJson: ApiResponse = await response.json();
  if (!response.ok) {
    return { data: null, error: resJson.publicError??"Error al recuperar las respuestas del desafío semanal", errorCode: resJson.errorCode, details: resJson.details };
  }

  const data = resJson.data;
  return { data, error: null, errorCode: null, details: [] };
}



export async function getWeeklyChallengeAnswer(id: string): Promise<{ data: WeeklyChallengeAnswer | null; error: string | null; errorCode: ErrorCode | null | undefined, details: { name: string; success: boolean, error?: string | null }[] }> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL}/api/weekly-challenge-answers/${id}`, {
    headers: { Cookie: cookies().toString() },
    cache: "no-store",
  });
  const resJson: ApiResponse = await response.json();
  if (!response.ok) {
    return { data: null, error: resJson.publicError??"Error al recuperar la respuesta del desafío semanal", errorCode: resJson.errorCode, details: resJson.details };
  }

  const data = resJson.data;
  return { data, error: null, errorCode: null, details: [] };
}






export async function addWeeklyChallengeAnswer(formData: FormData): Promise<{ data: WeeklyChallengeAnswer[] | null; error: string | null; errorCode: ErrorCode | null | undefined, details: { name: string; success: boolean, error?: string | null }[] }> {
  const challengeId = formData.get("challengeid") as string;
  const answer = formData.get("answer") as string;
  const score = formData.get("score") ? Number(formData.get("score")) : null;

  const body = { challengeId, answer, score };
  const filteredBody = Object.fromEntries(Object.entries(body).filter(([_, v]) => v !== null));

  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL}/api/weekly-challenge-answers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookies().toString(),
    },
    body: JSON.stringify(filteredBody),
  });
  const resJson: ApiResponse = await response.json();
  if (!response.ok) {
    return { data: null, error: resJson.publicError??"Error al crear la respuesta del desafío semanal", errorCode: resJson.errorCode, details: resJson.details };
  }
  const answers = await getWeeklyChallengeAnswers();
  return answers;
}


export async function updateWeeklyChallengeAnswer(formData: FormData): Promise<{ data: WeeklyChallengeAnswer[] | null, error: string | null, errorCode: ErrorCode | null | undefined  }> {
  const id = formData.get("id") as string;
  const answer = formData.get("answer") as string;
  const score = formData.get("score") ? Number(formData.get("score")) : null;

  const payload = { answer, score };
  const filteredPayload = Object.fromEntries(Object.entries(payload).filter(([_, v]) => v !== null));

  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL}/api/weekly-challenge-answers/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookies().toString(),
    },
    body: JSON.stringify(filteredPayload),
  });
  const resJson: ApiResponse = await response.json();
  if (!response.ok) {
    return { data: null, error: `Error al actualizar la respuesta del desafío semanal: ${resJson.publicError}`, errorCode: resJson.errorCode };
  }

  const answers = await getWeeklyChallengeAnswers()
  return answers;
}



export async function deleteWeeklyChallengeAnswer(formData: FormData): Promise<{ data: WeeklyChallengeAnswer[] | null; error: string | null; errorCode: ErrorCode | null | undefined }> {
  const id = formData.get("id") as string;

  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL}/api/weekly-challenge-answers/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookies().toString(),
    },
  });
  const resJson: ApiResponse = await response.json();
  if (!response.ok) {
    return { data: null,error: `Error al eliminar la respuesta del desafío semanal: ${resJson.publicError}`, errorCode: resJson.errorCode };
  }

  const answers = await getWeeklyChallengeAnswers()
  return answers;
}
