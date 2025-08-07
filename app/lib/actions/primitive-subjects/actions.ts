'use server'

import { cookies } from "next/headers";
import { ApiResponse, ErrorCode, PrimitiveSubject } from "../../definitions";
import { revalidateTag } from "next/cache";
import { primitiveSubjectsUpdateSchema } from "./validation";
import { normalizeEmptyStrings } from "../../utils";
import { info } from "console";

export async function getPrimitiveSubjects(): Promise<{ data: PrimitiveSubject[] | null, error: string | null, errorCode: ErrorCode | null | undefined, details: { name: string; success: boolean, error?: string | null }[] }> {
  const response = await fetch((process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string) + '/api/primitive-subjects', {
    headers: {
      Cookie: cookies().toString()
    },
  });
  const resJson: ApiResponse = await response.json();
  if (!response.ok) {
    return { data: null, error: resJson.publicError??"Error al recuperar las asignaturas", errorCode: resJson.errorCode, details: resJson.details };
  }
  const primitive_subjects: PrimitiveSubject[] = resJson.data;
  return { data: primitive_subjects, error: null, errorCode: null, details: [] };
}

const ERROR_MESSAGES: Record<string, string> = {
  "id": "Id",
  "name": "Nombre",
  "credits": "Créditos",
  "year": "Año",
  "quadri": "Cuatrimestre",
  "professors": "Profesores",
  "emails": "Emails",
  "form": "Formulario",
}


export async function updatePrimitiveSubject( formData: FormData): Promise<{ data: PrimitiveSubject[] | null, error: string | null, errorCode: ErrorCode | null | undefined, details: { name: string; success: boolean, error?: string | null }[] }> {
  // const inputRaw = {
  //   id: formData.get("id"),
  //   name: formData.get("name"),
  //   info: formData.get("info"),
  // }

  

  // const input = normalizeEmptyStrings(inputRaw);

  // const parsed = primitiveSubjectsUpdateSchema.safeParse(input);
  // if (!parsed.success) {
  //   const errors = parsed.error.issues;
  //   return { data: null, error: 'Error de formato', errorCode: "BAD_REQUEST", details: errors.map((e) => ({ name: ERROR_MESSAGES[e.path[0].toString()], success: false, error: e.message })) };
  // }

  // const { id, ...inputData } = parsed.data;
  
  const id = formData.get("id")
  const inputData = {
    name: formData.get("name"),
    info: formData.get("info"),
  }

  const response = await fetch((process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string) + '/api/primitive-subjects/' + id, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookies().toString(),
    },
    body: JSON.stringify(inputData),
  })
  const resJson: ApiResponse = await response.json();
  if (response.ok) {
    revalidateTag('primitive-subjects')
    const subjects = await getPrimitiveSubjects()
    return subjects
  }
  return { data: null, error: resJson.publicError??"Error al actualizar la asignatura", errorCode: resJson.errorCode, details: resJson.details };
}