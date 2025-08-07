import useSWR from "swr";
import { getRanking } from "./actions/ranking/actions";
import { Ranking } from "./definitions";

export function useRanking() {

  const fetcher = async (url: string): Promise<Record<'qual' | 'diff', Ranking> > => {
    const { data, error, errorCode } = await getRanking();
    if (!error) return data ?? { qual: [], diff: [] }

    if (!errorCode) throw new Error(error);
    var e = new Error(error);
    e.name = errorCode;
    throw e;
  };

  const { data, error, isLoading } = useSWR((process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string) + '/api/ranking', fetcher);

  return { ranking: data, error, isLoading };
}