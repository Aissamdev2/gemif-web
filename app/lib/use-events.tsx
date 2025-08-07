import useSWR from "swr";
import { getEvents } from "./actions/events/actions";
import { Event } from "./definitions";

export function useEvents() {

  const fetcher = async (url: string): Promise<Event[]> => {
    const { data, error, errorCode } = await getEvents();
    if (!error) return data ?? []

    if (!errorCode) throw new Error(Array.isArray(error) ? error.join(', ') : error);
    var e = new Error(Array.isArray(error) ? error.join(', ') : error);
    e.name = errorCode;
    throw e;
  };

  const { data, error, isLoading } = useSWR((process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string) + '/api/events', fetcher);

  return { events: data, error, isLoading };
}