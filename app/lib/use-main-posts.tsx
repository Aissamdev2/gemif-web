// lib/use-main-posts.ts
import useSWR from "swr";
import { getMainPosts } from "./actions/main-posts/actions";
import { MainPost } from "./definitions";

export function useMainPosts({ fallbackData }: { fallbackData?: MainPost[] }) {
  const fetcher = async (): Promise<MainPost[]> => {
    const { data, error, errorCode } = await getMainPosts();
    if (error) {
      const customError = new Error(error);
      if (errorCode) customError.name = errorCode;
      throw customError;
    }
    return data ?? [];
  };

  const { data, error, isLoading } = useSWR<MainPost[]>((process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string) + '/api/main-posts', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
    shouldRetryOnError: false,
    fallbackData
  });

  return { 
    mainPosts: data, 
    error,
    isLoading: isLoading || (!data && !error)
  };
}