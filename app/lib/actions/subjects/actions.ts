'use server'

import { cookies } from "next/headers"
import { ApiResponse, ErrorCode, PrimitiveSubject, Ranking, Subject } from "../../definitions"
import { revalidateTag } from "next/cache"
import { getRanking } from "../ranking/actions";


export async function getSubjects(): Promise<{ data: Subject[] | null, error: string | null, errorCode: ErrorCode | null | undefined, details: { name: string; success: boolean, error?: string | null }[] }> {
  const response = await fetch((process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string) + '/api/subjects', {
    headers: {
      Cookie: cookies().toString()
    },
    next: { tags: ['subjects'] }
  });
  const resJson: ApiResponse = await response.json();
  if (!response.ok) {
    return { data: null, error: resJson.publicError??"Error al recuperar las asignaturas", errorCode: resJson.errorCode, details: resJson.details };
  }
  const subjects: Subject[] = resJson.data;
  return { data: subjects, error: null, errorCode: null, details: [] };
}

export async function updateSubjects(formData: FormData): Promise<{ data: Subject[] | null, error: string | null, errorCode: ErrorCode | null | undefined, details: { name: string; success: boolean, error?: string | null }[] }> {
  const subjectsToAddRaw = formData.get("subjectsToAdd") as string;
  const subjectsToRemoveRaw = formData.get("subjectsToRemove") as string | null;
  const subjectsToAdd: PrimitiveSubject[] = JSON.parse(subjectsToAddRaw);
  

  // Wait for all POST requests to complete
  await Promise.all(subjectsToAdd.map(async (subject: PrimitiveSubject) => {
    const payload = { 
      name: subject.name, 
      color: subject.color, 
      bgcolor: subject.bgcolor, 
      bordercolor: subject.bordercolor, 
      year: subject.year, 
      quadri: subject.quadri, 
      archived: false, 
      qual: null,
      diff: null, 
      primitiveid: subject.id 
    };
    const response = await fetch((process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string) + '/api/subjects/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookies().toString(),
      },
      body: JSON.stringify(payload)
    });
    const resJson: ApiResponse = await response.json();
    if (!response.ok) {
      
      return { data: null, error: 'No se ha podido añadir la asignatura ' + subject.name + ': ' + resJson.publicError, errorCode: resJson.errorCode, details: resJson.details };
    }
  }));

  // Handle subjects to remove if present
  if (subjectsToRemoveRaw) {
    const primitiveSubjectsToRemove: PrimitiveSubject[] = JSON.parse(subjectsToRemoveRaw);

    const { data: subjects, error, errorCode } = await getSubjects();
    if (!subjects) {
      return { data: null, error: error, errorCode: errorCode, details: [] };
    }

    const subjectsToRemove: Subject[] = primitiveSubjectsToRemove.map((subject: PrimitiveSubject) => {
      return subjects.find((s: Subject) => s.primitiveid === subject.id)!;
    })

    await Promise.all(subjectsToRemove.map(async (subject: Subject) => {
      const response = await fetch((process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string) + '/api/subjects/' + subject.id, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookies().toString(),
        },
      });
      const resJson: ApiResponse = await response.json();
      if (!response.ok) {
        return { data: null, error: 'No se ha podido borrar la asignatura ' + subject.name + ': ' + resJson.publicError, errorCode: resJson.errorCode, details: resJson.details };
      }
    }));
  }

  revalidateTag('subjects');
  const subjects= await getSubjects();
  return subjects;
}

export async function updateSubject( formData: FormData): Promise<{ data: Subject[] | { qual: Ranking, diff: Ranking } | null, error: string | null, errorCode: ErrorCode | null | undefined, details: { name: string; success: boolean, error?: string | null }[] }> {
  const id = formData.get("id") as string
  const color = formData.get('color') as string
  const bgcolor = formData.get('bgcolor') as string | null
  const bordercolor = formData.get('bordercolor') as string | null
  const payload = { color, bgcolor, bordercolor }
  const filteredpayload = Object.fromEntries(Object.entries(payload).filter(([_, v]) => v !== 'null'))

  const response = await fetch((process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string) + '/api/subjects/' + id, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookies().toString(),
    },
    body: JSON.stringify(filteredpayload),
  })
  const resJson: ApiResponse = await response.json();
  if (response.ok) {
    revalidateTag('subjects')
    const subjects = await getSubjects()
    return subjects
  }
  return { data: null, error: resJson.publicError??"Error al actualizar la asignatura", errorCode: resJson.errorCode, details: resJson.details };
}


export async function archiveSubjects(formData: FormData): Promise<{ data: Subject[] | null; error: string | null; errorCode: ErrorCode | null | undefined; details: { name: string; success: boolean, error?: string | null }[] }> {
  const primitiveSubjectsToArchiveRaw = formData.get("subjectsToArchive") as string;
  const primitiveSubjectsToArchive: PrimitiveSubject[] = JSON.parse(primitiveSubjectsToArchiveRaw);
  const { data: subjects, error, errorCode} = await getSubjects();
  if (error || !subjects) {
    return { data: null, error, errorCode, details: [] };
  }

  const subjectsToArchive: Subject[] = primitiveSubjectsToArchive.map((subject: PrimitiveSubject) => {
    return subjects.find((s: Subject) => s.primitiveid === subject.id)!;
  })


  // Process archive operations in parallel
  await Promise.all(subjectsToArchive.map(async (subject: Subject) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL}/api/subjects/${subject.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookies().toString(),
      },
      body: JSON.stringify({ archived: true })
    });
    const resJson: ApiResponse = await response.json();
    if (!response.ok) {
      return { data: null, error: resJson.publicError, errorCode: resJson.errorCode, details: resJson.details };
    }
  }));

  const primitiveSubjectsToUnarchiveRaw = formData.get("subjectsToUnarchive") as string | undefined;
  
  if (primitiveSubjectsToUnarchiveRaw) {
    const primitiveSubjectsToUnarchive: PrimitiveSubject[] = JSON.parse(primitiveSubjectsToUnarchiveRaw);

    const subjectsToUnarchive: Subject[] = primitiveSubjectsToUnarchive.map((subject: PrimitiveSubject) => {
      return subjects.find((s: Subject) => s.primitiveid === subject.id)!;
    })
    
    // Process unarchive operations in parallel
    await Promise.all(subjectsToUnarchive.map(async (subject: Subject) => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL}/api/subjects/${subject.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookies().toString(),
        },
        body: JSON.stringify({ archived: false })
      });
      const resJson: ApiResponse = await response.json();
      if (!response.ok) {
        return { data: null, error: resJson.publicError, errorCode: resJson.errorCode, details: resJson.details };
      }
    }));
  }

  revalidateTag('subjects');
  const fetchedSubjects = await getSubjects();
  return fetchedSubjects;
}




