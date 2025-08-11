import { getUser } from '@/app/lib/actions/user/actions';
import { getMainPosts } from '@/app/lib/actions/main-posts/actions';
import { getSubjects } from '@/app/lib/actions/subjects/actions';
import { MainClient } from './main-client'; // We will create this next
import ErrorPage from '../error';

// This is a Server Component by default. It has no client-side interactivity.
export default async function MainServer() {
  // 1. Fetch all initial data on the server concurrently. This is more
  // efficient than awaiting them one by one.
  const [initialUser, initialMainPosts, initialSubjects] = await Promise.all([
    getUser(),
    getMainPosts(),
    getSubjects(),
  ]);


  if (initialUser.error || !initialUser.data) return <ErrorPage error={initialUser.error ?? 'Error al recuperar el usuario'} />;
  if (initialMainPosts.error || !initialMainPosts.data) return <ErrorPage error={initialMainPosts.error ?? 'Error al recuperar los recursos'} />;
  if (initialSubjects.error || !initialSubjects.data) return <ErrorPage error={initialSubjects.error ?? 'Error al recuperar las asignaturas'} />;
  
  return (
    // 2. Render the Client Component and pass the server-fetched data as props.
    // This data will be used to provide an instant UI without loading spinners.
    <MainClient
      initialUser={initialUser.data}
      initialMainPosts={initialMainPosts.data}
      initialSubjects={initialSubjects.data}
    />
  );
}