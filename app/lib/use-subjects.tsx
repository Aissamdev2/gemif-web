// lib/use-subjects.ts
import useSWR from "swr";
import { getSubjects } from "./actions/subjects/actions";
import { Subject } from "./definitions";

export function useSubjects() {
  const fetcher = async (): Promise<Subject[]> => {
    const { data, error } = await getSubjects();
    if (error) throw new Error(error);
    return data ?? [];
  };

  const { data, error, isLoading } = useSWR<Subject[]>((process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string) + '/api/subjects', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000
  });

  return { 
    subjects: data, 
    error,
    isLoading: isLoading || (!data && !error)
  };
}