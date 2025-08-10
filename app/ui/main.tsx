'use client'

import { useCallback, useState, useMemo } from 'react';
import Link from 'next/link';
import { Eye } from 'lucide-react';
import { useMainPosts } from '@/app/lib/use-main-posts';
import { useUser } from '@/app/lib/use-user';
import { useSubjects } from '../lib/use-subjects';
import { MainPost, Subject } from '../lib/definitions';
//import Loader from './loader';
//import ErrorPage from './error';
//import ListModal from './list-modal';

export default function Main() {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('11111111');
  const [modalState, setModalState] = useState<{
    postId: string | null;
    type: 'link' | 'file' | null;
    position: { top: number; left: number };
  }>({ postId: null, type: null, position: { top: 0, left: 0 } });

  const { user, error: userError, isLoading: isUserLoading } = useUser();
  const { mainPosts, error: postsError, isLoading: isPostsLoading } = useMainPosts();
  const { subjects, error: subjectsError, isLoading: isSubjectsLoading } = useSubjects();

  const handleSubjectChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSubjectId(e.target.value);
  }, []);

  const toggleList = useCallback((e: React.MouseEvent, type: 'link' | 'file', postId: string) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setModalState({
      postId,
      type,
      position: { top: rect.top - 10, left: rect.left }
    });
  }, []);

  const closeModal = useCallback(() => {
    setModalState(prev => ({ ...prev, postId: null, type: null }));
  }, []);

  const filteredPosts = useMemo(() => {
    if (!mainPosts) return [];
    return mainPosts.filter(post => post.subjectid === selectedSubjectId);
  }, [mainPosts, selectedSubjectId]);

  const error = userError || subjectsError || postsError;
  if (error) return null;

  return (
    <section className="z-50 w-full h-full max-h-full flex flex-col lg:mb-0 px-2 lg:px-10 gap-4 md:gap-6 pt-[80px] pb-[20px]">
      <Header isLoading={isUserLoading} userName={user?.publicname} />
      
      <div className="flex flex-col gap-4 shadow-[0_2px_4px_rgba(16,42,83,0.08)] bg-[#f4f9ff] border border-[#DCEBFF] hover:bg-[#EEF5FF] transition-colors p-5 grow rounded-2xl">
        <div className="flex flex-col gap-2">
          <h3 className="text-xl font-bold text-slate-700">Recursos útiles</h3>
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            <SubjectSelect
              subjects={subjects}
              isLoading={isSubjectsLoading}
              value={selectedSubjectId}
              onChange={handleSubjectChange}
            />
            {user && (user.role === 'admin' || user.role === 'dev') && <AddMainFileButton />}
          </div>
        </div>

        <PostsList 
          isLoading={isPostsLoading}
          posts={filteredPosts}
          toggleList={toggleList}
        />

        {modalState.type && modalState.postId && (
          // <ListModal
          //   post={mainPosts?.find(p => p.id === modalState.postId)}
          //   type={modalState.type}
          //   position={modalState.position}
          //   onClose={closeModal}
          // />
          null
        )}
      </div>
    </section>
  );
}

// Header Component
const Header = ({ isLoading, userName }: { isLoading: boolean; userName?: string }) => (
  <div className="shadow-[0_2px_4px_rgba(16,42,83,0.08)] bg-[#f4f9ff] border border-[#DCEBFF] hover:bg-[#EEF5FF] rounded-2xl p-5 basis-[15%] flex flex-col sm:flex-row justify-between items-center gap-4 transition-colors">
    <h2 className="text-3xl font-extrabold text-slate-700">
      {isLoading ? (
        <span className="h-[36px] w-[250px] bg-slate-100 animate-pulse block" />
      ) : (
        `Hola, ${userName || 'Usuario'}`
      )}
    </h2>
    <Link 
      href="/gemif/weekly-challenges" 
      className="text-center sm:text-left py-2 px-3 hover:bg-[#d3e5ff] transition-colors rounded-2xl"
    >
      <p className="text-md font-bold text-slate-700 md:text-xl">Atrévete con los</p>
      <p className="text-md font-bold text-slate-700 md:text-xl">Desafíos semanales 🔥</p>
    </Link>
  </div>
);

// Subject Select Component
const SubjectSelect = ({
  subjects,
  isLoading,
  value,
  onChange
}: {
  subjects?: Subject[];
  isLoading: boolean;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}) => (
  <div className="flex flex-col w-full md:w-auto">
    <label htmlFor="subjectSelect" className="mb-1 text-xs font-medium text-slate-700">
      Asignatura
    </label>
    <select
      id="subjectSelect"
      value={value}
      onChange={onChange}
      disabled={isLoading}
      className="block w-full px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-[#DCEBFF] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#4A90E2] transition"
    >
      <option value="11111111">{isLoading ? "Cargando..." : "General"}</option>
      {subjects?.filter(s => s.primitiveid !== '00000000').map(subject => (
        <option key={subject.id} value={subject.id}>
          {subject.name}
        </option>
      ))}
    </select>
  </div>
);

// Add File Button Component
const AddMainFileButton = () => (
  <Link 
    href="/gemif/main/add-main-post" 
    className="w-full text-center p-1.5 py-[10px] rounded-md bg-[#4A90E2] text-white text-xs font-medium transition-all duration-300 hover:bg-[#3A7BC4]"
  >
    Añadir recurso
  </Link>
);

// Posts List Component
const PostsList = ({
  isLoading,
  posts,
  toggleList
}: {
  isLoading: boolean;
  posts: MainPost[];
  toggleList: (e: React.MouseEvent, type: 'link' | 'file', postId: string) => void;
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center w-full min-h-[4rem]">
        {/*<Loader /> */}
      </div>
    );
  }

  if (!posts.length) {
    return (
      <div className="flex justify-center items-center h-full text-gray-500">
        No se encontraron recursos para esta asignatura
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 auto-rows-max gap-2 overflow-y-auto flex-1 min-h-0 bg-[#e4ecf6] p-2 rounded-lg">
      {posts.map(post => (
        <PostItem key={post.id} post={post} toggleList={toggleList} />
      ))}
    </ul>
  );
};

// Post Item Component
const PostItem = ({
  post,
  toggleList
}: {
  post: MainPost;
  toggleList: (e: React.MouseEvent, type: 'link' | 'file', postId: string) => void;
}) => {
  const isSingleFile = post.filenames?.length === 1;
  const isSingleLink = post.links?.length === 1;
  
  const handleClick = (e: React.MouseEvent, type: 'link' | 'file') => {
    if ((type === 'file' && isSingleFile) || (type === 'link' && isSingleLink)) {
      if (type === 'file') {
        window.open(
          `https://raw.githubusercontent.com/Aissamdev2/Archive/main/main-data/${post.foldername}/${post.filenames?.[0] || ''}`,
          "_blank",
          "noopener,noreferrer"
        );
      } else {
        window.open(post.links?.[0] || '', "_blank", "noopener,noreferrer");
      }
    } else {
      toggleList(e, type, post.id ?? '');
    }
  };

  return (
    <li className="bg-white h-[100px] flex rounded-xl border border-[#e0e7ff] shadow-sm hover:shadow-md hover:border-blue-400 transition-all">
      <button
        onClick={(e) => handleClick(e, post.type as 'link' | 'file')}
        className="text-left flex flex-col justify-center grow px-4 py-3 overflow-hidden"
      >
        <p title={post.name} className="text-sm font-semibold text-blue-600 truncate">
          {post.name}
        </p>
        <p title={post.description} className="text-xs text-gray-500 truncate mt-1">
          {post.description}
        </p>
      </button>
      
      <Link
        href={`/gemif/main/view-main-post/${post.id}`}
        className="flex w-12 items-center justify-center rounded-r-xl hover:bg-blue-50 transition-colors"
        aria-label="Ver detalles"
      >
        <Eye className="w-5 h-5 text-blue-500 hover:text-blue-600" />
      </Link>
    </li>
  );
};