import useSWR from "swr";
import { checkUnseenMessages } from "./actions";

export function useUnseenMessages() {

  const fetcher = (url: string) => checkUnseenMessages();

  const { data, error, isLoading } = useSWR((process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string) + '/api/messages/unseen', fetcher);

  return { unseenMessages: data, error, isLoading };
}