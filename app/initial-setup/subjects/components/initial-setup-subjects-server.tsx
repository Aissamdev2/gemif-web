import InitialSetupSubjectsClient from "./initial-setup-subjects-client";
import ErrorPage from "../../../ui/error";
import { redirectErrorUrl, sortSubjects } from "@/lib/utils";
import { SimplePrim } from "@/app/lib/definitions";
import { dbGetPrimitiveSubjects } from "@/db/primitive-subjects";
import { redirect } from "next/navigation";
import { isFailure, unwrap, unwrapError } from "@/lib/errors/result";


export default async function InitialSetupSubjectsServer() {
  const primitiveSubjectsResult = await dbGetPrimitiveSubjects();
  if (isFailure(primitiveSubjectsResult)) return redirectErrorUrl(unwrapError(primitiveSubjectsResult))
  const primitiveSubjects = unwrap(primitiveSubjectsResult)

  const subj = primitiveSubjects
    .filter(p => p.id !== '00000000')
    .map(s => ({ 
      id: s.id, 
      name: s.name, 
      year: s.year ?? null, 
      quadri: s.quadri ?? null 
    })) as SimplePrim[];
        
  const initial = { toTake: sortSubjects(subj), taking: [], passed: [] };

  return (
      <InitialSetupSubjectsClient 
        initialCols={initial} 
      />
  );
}

