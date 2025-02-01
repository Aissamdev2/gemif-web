import useSWR from "swr";
import { getEvents } from "./actions";

export function useEvents() {

  const fetcher = (url: string) => getEvents();

  const { data, error, isLoading } = useSWR(process.env.BASE_URL as string + '/api/events', fetcher);

  return { events: data, error, isLoading };
}