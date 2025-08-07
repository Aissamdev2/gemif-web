import useSWR from "swr";
import { getMainData } from "./actions/main-data/actions";
import { get } from "http";

export function useMainData() {

  const fetcher = async (url: string) => {
    const { data, error, errorCode } = await getMainData();
    if (!error) return data

    if (!errorCode) throw new Error(error);
    var e = new Error(error);
    e.name = errorCode;
    throw e;
  };

  const { data, error, isLoading } = useSWR((process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string) + '/api/main-data', fetcher);

  return { mainData: data, error, isLoading };
}