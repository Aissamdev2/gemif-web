import useSWR from "swr";
import { getWeeklyChallengeAnswers } from "./actions/weekly-challenge-answers/actions";
import { WeeklyChallengeAnswer } from "./definitions";

export function useWeeklyChallengeAnswers() {

  const fetcher = async (url: string): Promise<WeeklyChallengeAnswer[]> => {
    const { data, error, errorCode } = await getWeeklyChallengeAnswers();
    if (!error) return data ?? []

    if (!errorCode) throw new Error(error);
    var e = new Error(error);
    e.name = errorCode;
    throw e;
  };

  const { data, error, isLoading } = useSWR((process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string) + '/api/weekly-challenge-answers', fetcher);

  return { weeklyChallengeAnswers: data, error, isLoading };
}