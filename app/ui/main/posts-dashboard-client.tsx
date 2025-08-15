'use client'

import React, { useState } from "react"
import AddMainPostButton from "./add-main-post-button"
import SubjectSelectClient from "./subject-select-client"
import PostsListClient from "./posts-list-client"
import { MainPost, Subject } from "@/app/lib/definitions"

export default function PostsDashboardClient({ posts, subjects }: { posts: MainPost[]; subjects: Subject[] }) {
  const [selected, setSelected] = useState("11111111")

  return (
    <div className="flex flex-col gap-5 bg-[#f4f9ff] border border-[#DCEBFF] rounded-2xl p-5 h-screen">
      <div className="flex flex-col gap-3">
        <h2 className="text-xl font-bold text-slate-700">Recursos útiles</h2>
        <div className="flex gap-4 flex-wrap">
          <SubjectSelectClient subjects={subjects} setSelected={setSelected} />
          <AddMainPostButton />
        </div>
      </div>

      {/* Make posts list take the rest of available space */}
      <div className="flex-1 overflow-y-auto">
        <PostsListClient posts={posts} selected={selected} />
      </div>
    </div>
  )
}
