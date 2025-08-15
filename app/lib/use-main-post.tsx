// lib/use-main-post.ts
import useSWR from "swr";
import { getMainPost } from "./actions/main-posts/actions";
import { MainPost } from "./definitions";

export function useMainPost({
  fallbackData,
  id
}: { fallbackData?: MainPost; id: string }) {


  const fetchMainPost = async (): Promise<MainPost | null> => {
    const { data, error, errorCode } = await getMainPost({ id });
    if (error) {
      const customError = new Error(error);
      if (errorCode) customError.name = errorCode;
      throw customError;
    }
    return data;
  };

  const { data, error, isLoading } = useSWR<MainPost | null>(
    `${process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL}/api/main-posts/${id}`,
    fetchMainPost,
    {
      fallbackData,
      revalidateOnMount: false,
      revalidateOnFocus: false,
      revalidateIfStale: false,
      dedupingInterval: 30000,
      shouldRetryOnError: false
    }
  );

  return {
    data,
    error,
    isLoading: isLoading || (!data && !error)
  };
}
