import useSWR from "swr";
import { getUsers } from "./actions";

export function useUsers() {

  const fetcher = (url: string) => getUsers();

  const { data, error, isLoading } = useSWR((process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string) + '/api/users', fetcher);

  return { users: data, error, isLoading };
}