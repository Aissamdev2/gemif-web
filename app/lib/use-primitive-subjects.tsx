import useSWR from "swr";
import { getPrimitiveSubjects } from "./actions";

export function usePrimitiveSubjects() {

  const fetcher = (url: string) => getPrimitiveSubjects();

  const { data, error, isLoading } = useSWR((process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string) + '/api/primitive-subjects', fetcher);

  return { primitiveSubjects: data, error, isLoading };
}