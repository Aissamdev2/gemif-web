"use client"

import { MainPost } from "@/app/lib/definitions"
import { useState, useCallback } from "react"
import ListModal from "@/app/ui/list-modal"
import ViewPostButton from "./view-post-button"

export default function PostsListClient({ posts, selected }: { posts: MainPost[], selected: string }) {
  const [modalState, setModalState] = useState<{
    postId: string | null
    type: "link" | "file" | null
    position: { top: number; left: number }
  }>({ postId: null, type: null, position: { top: 0, left: 0 } })

  const toggleList = useCallback((e: React.MouseEvent, type: "link" | "file", postId: string) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setModalState({
      postId,
      type,
      position: { top: Math.max(rect.top - 10, 10), left: Math.min(rect.left, window.innerWidth - 300) },
    })
  }, [])

  const closeModal = useCallback(() => {
    setModalState({ postId: null, type: null, position: { top: 0, left: 0 } })
  }, [])

  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 h-full">
      {posts.filter((post) => post.subjectid === selected).map((post) => (
        <li key={post.id} className="bg-white h-[100px] flex rounded-xl border p-3">
          <button
            onClick={(e) => toggleList(e, post.type as "link" | "file", post.id ?? "")}
            className="text-left flex flex-col justify-center grow"
          >
            <p className="text-sm font-semibold text-blue-600 truncate">{post.name}</p>
            <p className="text-xs text-gray-500 truncate">{post.description}</p>
          </button>
          <ViewPostButton post={{ id: post.id ?? "", name: post.name ?? "" }} />
        </li>
      ))}

      {modalState.type && modalState.postId && (
        <ListModal
          post={posts.find((p) => p.id === modalState.postId)}
          type={modalState.type}
          position={modalState.position}
          onClose={closeModal}
        />
      )}
    </ul>
  )
}
