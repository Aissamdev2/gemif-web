// components/posts-list.tsx
"use client";
import { MainPost } from "@/app/lib/definitions";
import { useState, useCallback } from "react";
import ListModal from "@/app/ui/list-modal";
import { Eye } from "lucide-react";

export default function PostsListClient({ posts }: { posts: MainPost[] }) {
  const [modalState, setModalState] = useState<{
    postId: string | null;
    type: "link" | "file" | null;
    position: { top: number; left: number };
  }>({ postId: null, type: null, position: { top: 0, left: 0 } });

  const toggleList = useCallback(
    (e: React.MouseEvent, type: "link" | "file", postId: string) => {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setModalState({
        postId,
        type,
        position: { top: Math.max(rect.top - 10, 10), left: Math.min(rect.left, window.innerWidth - 300) },
      });
    },
    []
  );

  const closeModal = useCallback(() => {
    setModalState({ postId: null, type: null, position: { top: 0, left: 0 } });
  }, []);

  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {posts.map((post) => (
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
  );
}


function ViewPostButton({ post }: { post: { id: string; name: string } }) {

  const openModal = () => {
    window.history.pushState(null, '', `/gemif/main/view-main-post/${post.id}`)
  }

  return (
    <button
      onClick={openModal}
      aria-label={`Ver detalles del recurso ${post.name}`}
      className="flex w-12 items-center justify-center rounded-r-xl hover:bg-blue-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
      tabIndex={0}
    >
      <Eye className="w-5 h-5 text-blue-500 hover:text-blue-600" aria-hidden="true" />
    </button>
  )
}