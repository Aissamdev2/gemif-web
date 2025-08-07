import useSWR from "swr";
import { getWeeklyChallenges } from "./actions/weekly-challenges/actions";
import { WeeklyChallenge } from "./definitions";

export function useWeeklyChallenges() {

  const fetcher = async (url: string): Promise<WeeklyChallenge[]> => {
    
    const { data, error, errorCode } = await getWeeklyChallenges();
    if (!error) return data ?? []

    if (!errorCode) throw new Error(error);
    var e = new Error(error);
    e.name = errorCode;
    throw e;
  };

  const { data, error, isLoading } = useSWR((process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string) + '/api/weekly-challenges', fetcher);

  return { weeklyChallenges: data, error, isLoading };
}