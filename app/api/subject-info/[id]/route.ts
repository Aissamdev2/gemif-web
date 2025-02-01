import { verifySession } from '@/app/lib/helpers'

export async function GET(request: Request, { params }: { params: { id: string } }) {

  try {
    const verification = await verifySession();
    const session = verification.session
    if (!session) return new Response('Unauthorized', { status: 401 })
    const { id: userId } = session
    const { id } = params

    const url = 'https://magicloops.dev/api/loop/cf5fe711-4a63-4882-bd81-820d6c6e54b0/run';

    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({ "input": id }),
    });

    const responseJson = await response.json();

    return new Response(JSON.stringify(responseJson))
  } catch (error) {
    console.log(error)
    return new Response('Unauthorized', { status: 401 })
  }
}