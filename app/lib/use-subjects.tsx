import useSWR from "swr";
import { getSubjects } from "./actions";
import { subjects } from "./placeholder-data";

export function useSubjects() {

  const fetcher = (url: string) => getSubjects();

  const { data, error, isLoading } = useSWR(process.env.BASE_URL as string + '/api/subjects', fetcher);

  return { subjects: data, error, isLoading };
}