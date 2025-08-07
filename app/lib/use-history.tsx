import useSWR from "swr";
import { getHistory } from "./actions/history/actions";

export function useHistory({ section }: { section: string }) {
  // The fetcher function uses the passed section (via key argument)
  const fetcher = async ([_, section]: [string, string]) => {
    const { structure , error, errorCode } = await getHistory({ section });
    if (!error) return structure

    if (!errorCode) throw new Error(error);
    var e = new Error(error);
    e.name = errorCode;
    throw e;
  };

  const { data, error, isLoading } = useSWR(
    [`${(process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string)}/api/history`, section],
    fetcher
  );


  return { history: data, error, isLoading };
}
