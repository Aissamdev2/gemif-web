import useSWR from "swr";
import { getMessages } from "./actions";

export function useMessages() {

  const fetcher = (url: string) => getMessages();

  const { data, error, isLoading } = useSWR(process.env.BASE_URL as string + '/api/messages', fetcher);

  return { messages: data, error, isLoading };
}