import { revalidateTag } from 'next/cache';

export async function POST(req: Request) {
  try {
    await revalidateTag('calendar');
    return new Response('Calendar revalidated', { status: 200 });
  } catch (err) {
    return new Response('Failed to revalidate', { status: 500 });
  }
}