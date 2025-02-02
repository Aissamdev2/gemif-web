import useSWR from "swr";
import { getMainPosts } from "./actions";

export function useMainPosts() {

  const fetcher = (url: string) => getMainPosts();

  const { data, error, isLoading } = useSWR((process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string) + '/api/main-posts', fetcher);

  return { mainPosts: data, error, isLoading };
}