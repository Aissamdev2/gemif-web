import useSWR from "swr";
import { getUser } from "./actions";

export function useUser() {

  const fetcher = (url: string) => getUser();

  const { data, error, isLoading } = useSWR(process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string + '/api/user', fetcher);

  return { user: data, error, isLoading };
}