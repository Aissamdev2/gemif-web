import useSWR from "swr";
import { getUser } from "./actions/user/actions";
import { User } from "./definitions";

export function useUser() {

  const fetcher = async (url: string): Promise<User | null> => {
    const { data, error, errorCode } = await getUser();
    if (!error) return data 

    if (!errorCode) throw new Error(error);
    var e = new Error(error);
    e.name = errorCode;
    throw e;
  };

  const { data, error, isLoading } = useSWR((process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string) + '/api/user', fetcher);

  return { user: data, error, isLoading };
}