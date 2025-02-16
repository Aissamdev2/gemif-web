import useSWR from "swr";
import { getSurveys } from "./actions";

export function useSurveys() {

  const fetcher = (url: string) => getSurveys();

  const { data, error, isLoading } = useSWR((process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string) + '/api/surveys', fetcher);

  return { surveys: data, error, isLoading };
}