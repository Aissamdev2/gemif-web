'use server'

import { cookies } from "next/headers";
import { ApiResponse, ErrorCode, WeeklyChallenge, WeeklyChallengeAnswer } from "../../definitions";
import { revalidateTag } from "next/cache";
import { weeklyChallengesAddSchema, weeklyChallengesDeleteSchema, weeklyChallengesUpdateSchema } from "./validation";
import { normalizeEmptyStrings } from "../../utils";



export async function getWeeklyChallenges(): Promise<{ data: WeeklyChallenge[] | null; error: string | null; errorCode: ErrorCode | null | undefined, details: { name: string; success: boolean, error?: string | null }[] }> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL}/api/weekly-challenges`, {
    headers: { Cookie: cookies().toString() },
    next: { tags: ['weekly-challenges'] },
    cache: "no-store",
  });
  const resJson: ApiResponse = await response.json();
  if (!response.ok) {
    return { data: null, error: `Error al recuperar los desafíos semanales: ${resJson.publicError}`, errorCode: resJson.errorCode, details: resJson.details };
  }

  const data = resJson.data;
  return { data, error: null, errorCode: null, details: [] };
}


export async function getWeeklyChallenge(id: string): Promise<{ data: WeeklyChallenge | null; error: string | null; errorCode: ErrorCode | null | undefined }> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL}/api/weekly-challenges/${id}`, {
    headers: { Cookie: cookies().toString() },
    cache: "no-store",
  });
  const resJson: ApiResponse = await response.json();
  if (!response.ok) {
    return { data: null, error: resJson.publicError??"Error al recuperar el desafío semanal", errorCode: resJson.errorCode };
  }

  const data = resJson.data;
  return { data, error: null, errorCode: null };
}


const ERROR_MESSAGES: Record<string, string> = {
  "id": "Id",
  "title": "Título",
  "description": "Descripción",
  "isMultipleChoice": "Opciones múltiples",
  "options": "Opciones",
  "correctAnswers": "Respuestas",
  "difficulty": "Dificultad",
  "deadline": "Fecha límite",
  "strictAnswer": "Respuesta exacta",
  "active": "Activo",
  "suggested": "Sugerido"
}

export async function addWeeklyChallenge(formData: FormData): Promise<{ data: WeeklyChallenge[] | null; error: string | null; errorCode: ErrorCode | null | undefined, details: { name: string; success: boolean, error?: string | null }[] }> {

  const inputRaw = {
    title: formData.get("title"),
    description: formData.get("description"),
    isMultipleChoice: formData.get("is_multiple_choice") === "true",
    options: (formData.get("options") as string).split(",").map(opt => opt.trim()),
    correctAnswers: (formData.get("correct_answers") as string).split(",").map(opt => opt.trim()),
    difficulty: formData.get("difficulty"),
    deadline: formData.get("deadline"),
    strictAnswer: formData.get("strict_answer") === "true",
    active: formData.get("active") === "true",
    suggested: formData.get("suggested") === "true"
  }

  const input = normalizeEmptyStrings(inputRaw);

  const parsed = weeklyChallengesAddSchema.safeParse(input);
  if (!parsed.success) {
    const errors = parsed.error.issues;
    return { data: null, error: 'Error de formato', errorCode: "BAD_REQUEST", details: errors.map((e) => ({ name: ERROR_MESSAGES[e.path[0].toString()], success: false, error: e.message })) };
  }

  const { title, description, isMultipleChoice, options, correctAnswers, difficulty, deadline, strictAnswer, active, suggested } = parsed.data;
  const challenge = {
    title,
    description,
    isMultipleChoice,
    options,
    correctAnswers,
    difficulty,
    deadline,
    strictAnswer,
    active,
    suggested
  };
  
  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL}/api/weekly-challenges`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookies().toString(),
    },
    body: JSON.stringify(challenge),
  });
  const resJson: ApiResponse = await response.json();
  if (!response.ok) {
    
    return { data: null, error: resJson.publicError??"Error al crear el desafío semanal", errorCode: resJson.errorCode, details: [] };
  }

  revalidateTag("weekly-challenges");
  return getWeeklyChallenges();
}



export async function updateWeeklyChallenge(formData: FormData): Promise<{ data: WeeklyChallenge[] | null; error: string | null; errorCode: ErrorCode | null | undefined, details: { name: string; success: boolean, error?: string | null }[] }> {
  
  const inputRaw = {
    id: formData.get("id"),
    title: formData.get("title"),
    description: formData.get("description"),
    isMultipleChoice: formData.get("is_multiple_choice") === "true",
    options: (formData.get("options") as string).split(",").map(opt => opt.trim()),
    correctAnswers: (formData.get("correct_answers") as string).split(",").map(opt => opt.trim()),
    difficulty: formData.get("difficulty"),
    deadline: formData.get("deadline"),
    strictAnswer: formData.get("strict_answer") === "true",
    active: formData.get("active") === "true",
    suggested: formData.get("suggested") === "true"
  }

  const input = normalizeEmptyStrings(inputRaw);

  const parsed = weeklyChallengesUpdateSchema.safeParse(input);
  if (!parsed.success) {
    const errors = parsed.error.issues;
    return { data: null, error: 'Error de formato', errorCode: "BAD_REQUEST", details: errors.map((e) => ({ name: ERROR_MESSAGES[e.path[0].toString()], success: false, error: e.message })) };
  }

  const { id, title, description, isMultipleChoice, options, correctAnswers, difficulty, deadline, strictAnswer, active, suggested } = parsed.data;

  const payload = {
    id,
    title,
    description,
    isMultipleChoice,
    options,
    correctAnswers,
    difficulty,
    deadline,
    strictAnswer,
    active,
    suggested
  };

  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL}/api/weekly-challenges/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookies().toString(),
    },
    body: JSON.stringify(payload),
  });
  const resJson: ApiResponse = await response.json();
  if (!response.ok) {
    return { data: null, error: resJson.publicError??"Error al actualizar el desafío semanal", errorCode: resJson.errorCode, details: [] };
  }

  revalidateTag("weekly-challenges");
  return getWeeklyChallenges();
}


export async function deleteWeeklyChallenge(formData: FormData): Promise<{ data: WeeklyChallenge[] | null; error: string | null; errorCode: ErrorCode | null | undefined, details: { name: string; success: boolean, error?: string | null }[] }> {
  const inputRaw = {
    id: formData.get("challengeid")
  }

  const parsed = weeklyChallengesDeleteSchema.safeParse(inputRaw);
  if (!parsed.success) {
    const errors = parsed.error.issues;
    return { data: null, error: 'Error de formato', errorCode: "BAD_REQUEST", details: errors.map((e) => ({ name: ERROR_MESSAGES[e.path[0].toString()], success: false, error: e.message })) };
  }

  const { id } = parsed.data;

  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL}/api/weekly-challenges/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookies().toString(),
    },
  });
  const resJson: ApiResponse = await response.json();
  if (!response.ok) {
    return { data: null, error: `Error al eliminar el desafío semanal: ${resJson.publicError}`, errorCode: resJson.errorCode, details: [] };
  }

  revalidateTag("weekly-challenges");
  return getWeeklyChallenges();
}


