import useSWR from "swr";
import { getSubjects } from "./actions";

export function useSubjects() {

  const fetcher = (url: string) => getSubjects();

  const { data, error, isLoading } = useSWR(process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string + '/api/subjects', fetcher);

  return { subjects: data, error, isLoading };
}