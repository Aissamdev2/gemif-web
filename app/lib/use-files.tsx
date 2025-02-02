import useSWR from "swr";
import { getFiles } from "./actions";

export function useFiles() {

  const fetcher = (url: string) => getFiles();

  const { data, error, isLoading } = useSWR(process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string + '/api/files', fetcher);

  return { files: data, error, isLoading };
}