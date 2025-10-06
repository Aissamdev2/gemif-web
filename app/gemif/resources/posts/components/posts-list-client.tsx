// components/posts-list-client.tsx
"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import ViewPostButton from "./view-post-button";
import { ResourcesPost, Subject } from "@/db/schema";
import { ArrowRight, BookImage } from "lucide-react";
import Link from "next/link";

export default function PostsListClient({
  posts,
  selected,
  search, // Added search prop
}: {
  posts: ResourcesPost[];
  selected: Subject | null;
  search: string;
}) {
  const [modalState, setModalState] = useState<{
    postId: string | null;
    position: { top: number; left: number };
  }>({ postId: null, position: { top: 0, left: 0 } });

  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null);

  const toggleList = useCallback(
    (e: React.MouseEvent, postId: string) => {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setButtonRect(rect);
      setModalState({
        postId,
        position: { top: 0, left: 0 },
      });
    },
    []
  );

  const modalRef = useCallback(
    (node: HTMLDivElement) => {
      if (node !== null && buttonRect !== null) {
        const modalHeight = node.offsetHeight;
        const modalWidth = node.offsetWidth;

        const spaceBelow = window.innerHeight - buttonRect.bottom;
        const top = spaceBelow >= modalHeight
          ? buttonRect.bottom + 10
          : buttonRect.top - modalHeight - 10;

        const spaceRight = window.innerWidth - buttonRect.left;
        const left = spaceRight >= modalWidth
          ? buttonRect.left
          : buttonRect.right - modalWidth;

        setModalState((prevState) => ({
          ...prevState,
          position: { top, left },
        }));
      }
    },
    [buttonRect]
  );

  const closeModal = useCallback(() => {
    setModalState({ postId: null, position: { top: 0, left: 0 } });
    setButtonRect(null);
  }, []);

  // New state for filtered and sorted posts
  const [filteredPosts, setFilteredPosts] = useState<ResourcesPost[]>([]);

  // Effect to filter and sort posts whenever search or selected changes
  useEffect(() => {
    if (!selected) return
    // 1. Filter by selected subject
    let filtered = (posts || []).filter(p => p.subjectId === selected.primitiveId);
    
    
    // 2. Filter and score by search string if it exists
    if (search !== "") {
      const lowerSearch = search.toLowerCase();
      filtered = filtered
        .map(post => {
          let score = 0;
          // Most important: post.name
          if (post.name && post.name.toLowerCase().includes(lowerSearch)) {
            score = 3;
          }
          // Second most important: post.description
          else if (post.description && post.description.toLowerCase().includes(lowerSearch)) {
            score = 2;
          }
          // Least important: filenames or links
          else if (
            (post.fileNames && post.fileNames.some(file => file.toLowerCase().includes(lowerSearch))) ||
            (post.links && post.links.some(link => link.toLowerCase().includes(lowerSearch)))
          ) {
            score = 1;
          }
          return { ...post, score };
        })
        .filter(post => post.score > 0) // Keep only posts that match
        .sort((a, b) => b.score - a.score); // Sort by score (descending)
    }

    setFilteredPosts(filtered);
  }, [posts, selected, search]); // Dependency array

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-h-0">
      { selected ? (filteredPosts.length === 0 ? (search ===  '' ? (
        <div className="col-span-full flex items-center justify-center p-6">
          <div className="text-muted">No hay recursos para esta asignatura.</div>
        </div>
      ) : (
        <div className="col-span-full flex items-center justify-center p-6">
          <div className="text-muted">No hay resultados de búsqueda.</div>
        </div>
      )
      ) : (
        filteredPosts.map((post: ResourcesPost) => {
          return (
            <Link
              key={post.id}
              href={`/gemif/resources/posts/view-post/${post.id}`}
              className="card group p-6 no-underline hover:shadow-md transition-all duration-300"
              aria-label={`Acceder a ${post.name}`}
            >
              <div className="flex items-start gap-4">
                {/* Icono con color temático */}
                <div className={`w-12 h-12 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200`}>
                  <BookImage className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <h2 className="text-body truncate">{post.name}</h2>
                    <span className="text-muted bg-surface-hover px-2 py-1 rounded-full ml-2">
                      Aissam Khadraoui
                    </span>
                  </div>
                  <p className="text-muted text-xs leading-relaxed">
                    {post.description}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between pt-3 border-t border-border">
                <span className="text-body font-medium">Explorar {}</span>
                <div className="group-hover:translate-x-1 transition-transform duration-200">
                  <ArrowRight className="w-4 h-4 text-blue-700" />
                </div>
              </div>
            </Link>
          )
        })
        )) : ( search === '' ? (
          <li className="col-span-full flex items-center justify-center p-6">
            <div className="text-muted">Seleccione una asignatura.</div>
          </li>
        ) : (
          <div className="col-span-full flex items-center justify-center p-6">
            <div className="text-muted">No hay resultados de búsqueda.</div>
          </div>
        ))
      }
    </div>
  );
}