// components/posts-dashboard.tsx (Server Component)
import { getMainPosts } from "@/app/lib/actions/main-posts/actions";
import PostsListClient from "@/app/ui/main/posts-list-client";
import ErrorPage from "@/app/ui/error";

export default async function PostsListServer() {
  const res = await getMainPosts();
  if (res.error || !res.data) {
    return <ErrorPage error={res.error ?? "Error al recuperar los recursos"} />;
  }

  return <PostsListClient posts={res.data} />;
}
