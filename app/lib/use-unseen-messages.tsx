import useSWR from "swr";
import { checkUnseenMessages } from "./actions/messages/actions";
import { Message } from "./definitions";

export function useUnseenMessages() {

  const fetcher = async (url: string): Promise<Message[]> => {
    const { data, error, errorCode } = await checkUnseenMessages();
    if (!error) return data ?? []

    if (!errorCode) throw new Error(error);
    var e = new Error(error);
    e.name = errorCode;
    throw e;

  };

  const { data, error, isLoading } = useSWR((process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string) + '/api/messages/unseen', fetcher);

  return { unseenMessages: data, error, isLoading };
}