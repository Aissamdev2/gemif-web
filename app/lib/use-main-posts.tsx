import useSWR from "swr";
import { getMainPosts } from "./actions/main-posts/actions";
import { MainPost } from "./definitions";

export function useMainPosts() {

  const fetcher = async (url: string): Promise<MainPost[]> => {
    const { data, error, errorCode } = await getMainPosts();
    if (!error) return data ?? []

    if (!errorCode) throw new Error(error);
    var e = new Error(error);
    e.name = errorCode;
    throw e;
  };

  const { data, error, isLoading } = useSWR((process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string) + '/api/main-posts', fetcher);

  return { mainPosts: data, error, isLoading };
}