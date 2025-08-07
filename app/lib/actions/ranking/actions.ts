'use server'

import { cookies } from "next/headers";
import { ApiResponse, ErrorCode, PrimitiveSubject, Ranking, Subject } from "../../definitions";
import { normalizeEmptyStrings } from "../../utils";
import { rankingUpdateSchema } from "./validation";
import { revalidateTag } from "next/cache";


export async function getRanking(): Promise<{ data: { qual: Ranking, diff: Ranking } | null; error: string | null; errorCode: ErrorCode | null | undefined; details: { name: string; success: boolean, error?: string | null }[] }> {
  const response = await fetch((process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string) + '/api/ranking', {
    headers: {
      Cookie: cookies().toString()
    },
    next: { tags: ['ranking'] }
  });
  const resJson: ApiResponse = await response.json();
  if (!response.ok) {
    return { data: null, error: resJson.publicError ?? 'Error al obtener el ranking', errorCode: resJson.errorCode, details: resJson.details };
  }

  const primitiveSubjects: PrimitiveSubject[] = resJson.data;
  const qualFilteredArray = primitiveSubjects.filter((subject) => subject.qual[0] !== 0 && subject.qual[1] !== 0);
  const qualRanking = qualFilteredArray.map((sbj) => {
    return {
      primitiveid: sbj.id,
      score: sbj.qual[0] / sbj.qual[1]
    }
  }).toSorted((a, b) => b.score - a.score);

  const diffFilteredArray = primitiveSubjects.filter((subject) => subject.diff[0] !== 0 && subject.diff[1] !== 0);
  const diffRanking = diffFilteredArray.map((sbj) => {
    return {
      primitiveid: sbj.id,
      score: sbj.diff[0] / sbj.diff[1]
    }
  }).toSorted((a, b) => b.score - a.score);


  const result = { qual: qualRanking, diff: diffRanking };
  return { data: result, error: null, errorCode: null, details: [] };
}


const ERROR_MESSAGES: Record<string, string> = {
  id: 'Id',
  type: 'Tipo',
  score: 'Puntuación',
}


export async function updateRanking(formData: FormData): Promise<{ data: { qual: Ranking, diff: Ranking } | null; error: string | null; errorCode: ErrorCode | null | undefined; details: { name: string; success: boolean, error?: string | null }[] }> {
  const rawInput = {
    id: formData.get("id"),
    type: formData.get("type"),
    score: formData.get("score"),
  }

  const input = normalizeEmptyStrings(rawInput);

  const parsed = rankingUpdateSchema.safeParse(input);
  if (!parsed.success) {
    const errors = parsed.error.issues;
    return {
      data: null,
      error: 'Error de formato',
      errorCode: "BAD_REQUEST",
      details: errors.map((e) => ({ name: ERROR_MESSAGES[e.path[0].toString()], success: false, error: e.message }))
    };
  }

  const { id, type, score } = parsed.data;

  const response = await fetch((process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string) + '/api/ranking/' + id, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookies().toString()
    },
    body: JSON.stringify({ type, score })
  });
  const resJson: ApiResponse = await response.json();
  if (!response.ok) {
    return { data: null, error: resJson.publicError??'Error al actualizar el ranking', errorCode: resJson.errorCode, details: resJson.details };
  }

  revalidateTag('ranking')
  const ranking = await getRanking()
  return ranking

}









