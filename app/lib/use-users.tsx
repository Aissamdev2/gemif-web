import useSWR from "swr";
import { getUsers } from "./actions/users/actions";
import { FetchedUser } from "./definitions";

export function useUsers() {

  const fetcher = async (url: string): Promise<FetchedUser[]> => {
    const { data, error, errorCode } = await getUsers();
    if (!error) return data ?? []

    if (!errorCode) throw new Error(error);
    var e = new Error(error);
    e.name = errorCode;
    throw e;
  };

  const { data, error, isLoading } = useSWR((process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string) + '/api/users', fetcher);

  return { users: data, error, isLoading };
}