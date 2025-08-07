import useSWR from "swr";
import { getPrimitiveSubjects } from "./actions/primitive-subjects/actions";
import { PrimitiveSubject } from "./definitions";

export function usePrimitiveSubjects() {

  const fetcher = async (url: string): Promise<PrimitiveSubject[]> => {
    const { data, error, errorCode } = await getPrimitiveSubjects();
    if (!error) return data ?? []

    if (!errorCode) throw new Error(error);
    var e = new Error(error);
    e.name = errorCode;
    throw e;
  };

  const { data, error, isLoading } = useSWR((process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string) + '/api/primitive-subjects', fetcher);

  return { primitiveSubjects: data, error, isLoading };
}