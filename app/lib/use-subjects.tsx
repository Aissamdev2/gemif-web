import useSWR from "swr";
import { getSubjects } from "./actions/subjects/actions";
import { Subject } from "./definitions";

export function useSubjects() {

  const fetcher = async (url: string): Promise<Subject[]> => {
    const { data, error, errorCode } = await getSubjects();
    if (!error) return data ?? [];

    if (!errorCode) throw new Error(error);
    var e = new Error(error);
    e.name = errorCode;
    throw e;
  };

  const { data, error, isLoading } = useSWR((process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string) + '/api/subjects', fetcher);

  return { subjects: data, error, isLoading };
}