import React from "react";
import PostsDashboardClient from "./posts-dashboard-client";
import ErrorPage from "@/app/ui/error";
import { getMainPosts } from "@/app/lib/actions/main-posts/actions";
import { getSubjects } from "@/app/lib/actions/subjects/actions";


export default async function PostsDashboardServer() {
 
  const [postsRes, subjectsRes] = await Promise.all([getMainPosts(), getSubjects()]);

  if (postsRes.error || !postsRes.data) return <ErrorPage error={postsRes.error ?? "Error al recuperar los recursos"} />;
  if (subjectsRes.error || !subjectsRes.data) return <ErrorPage error={subjectsRes.error ?? "Error al recuperar las asignaturas"} />;

  return (
    <PostsDashboardClient posts={postsRes.data} subjects={subjectsRes.data} />
  )
}