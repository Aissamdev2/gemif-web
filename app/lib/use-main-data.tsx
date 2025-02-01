import useSWR from "swr";
import { getMainData } from "./actions";

export function useMainData() {

  const fetcher = (url: string) => getMainData();

  const { data, error, isLoading } = useSWR(process.env.BASE_URL as string + '/api/main-data', fetcher);

  return { mainData: data, error, isLoading };
}