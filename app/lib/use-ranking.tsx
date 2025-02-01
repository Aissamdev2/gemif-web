import useSWR from "swr";
import { getRanking } from "./actions";

export function useRanking() {

  const fetcher = (url: string) => getRanking();

  const { data, error, isLoading } = useSWR(process.env.BASE_URL as string + '/api/ranking', fetcher);

  return { ranking: data, error, isLoading };
}