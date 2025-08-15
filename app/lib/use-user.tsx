// lib/use-user.ts
import useSWR from "swr";
import { getUser } from "./actions/user/actions";
import { User } from "./definitions";

export function useUser({ fallbackData }: { fallbackData?: User | null }) {
  const fetcher = async (): Promise<User | null> => {
    const { data, error } = await getUser();
    if (error) throw new Error(error);
    return data;
  };
  const { data, error, isLoading } = useSWR<User | null>((process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string) + '/api/user', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
    fallbackData,
    revalidateIfStale: false,
    revalidateOnMount: false
  });

  return { 
    user: data, 
    error,
    isLoading: isLoading || (!data && !error)
  };
}