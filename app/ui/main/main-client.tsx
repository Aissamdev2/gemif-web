'use client';

import { useMainPosts } from '@/app/lib/use-main-posts';
import { useUser } from '@/app/lib/use-user';
import { useSubjects } from '../../lib/use-subjects';

import { useCallback, useState, useMemo } from 'react';
import Link from 'next/link';
import { Eye } from 'lucide-react';
import useSWR from 'swr';

import { MainPost, Subject, User } from '@/app/lib/definitions'; // Make sure User type is imported

// Import your presentation components
import Loader from '../loader';
import ErrorPage from '../error';
import ListModal from '../list-modal';

// Define the props to accept initial data from the Server Component
interface MainClientProps {
  initialUser: User;
  initialMainPosts: MainPost[];
  initialSubjects: Subject[];
}

export function MainClient({
  initialUser,
  initialMainPosts,
  initialSubjects,
}: MainClientProps) {
  // All state and interactivity remains here
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('11111111');
  const [modalState, setModalState] = useState<{
    postId: string | null;
    type: 'link' | 'file' | null;
    position: { top: number; left: number };
  }>({ postId: null, type: null, position: { top: 0, left: 0 } });

  // 3. Use the initial data to hydrate the SWR hooks.
  // SWR will not fetch on initial render, providing instant data.
  const { user, error: userError } = useUser({ fallbackData: initialUser });
  const { mainPosts, error: postsError } = useMainPosts({ fallbackData: initialMainPosts }) as { mainPosts: MainPost[], error: string };
  const { subjects, error: subjectsError } = useSubjects({ fallbackData: initialSubjects });

  // Since we have fallbackData, the isLoading state will be false on initial load.
  // We can derive a loading state for subsequent fetches if needed, but it's often not necessary.
  const isUserLoading = !user && !userError;
  const isPostsLoading = !mainPosts && !postsError;
  const isSubjectsLoading = !subjects && !subjectsError;

  // All your handlers and memos remain unchanged
  const handleSubjectChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSubjectId(e.target.value);
  }, []);

  const toggleList = useCallback(
    (e: React.MouseEvent, type: 'link' | 'file', postId: string) => {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const top = Math.max(rect.top - 10, 10);
      const left = Math.min(rect.left, window.innerWidth - 300);
      setModalState({ postId, type, position: { top, left } });
    },
    []
  );

  const closeModal = useCallback(() => {
    setModalState({ postId: null, type: null, position: { top: 0, left: 0 } });
  }, []);

  const filteredPosts = useMemo(() => {
    if (!Array.isArray(mainPosts)) return [];
    return mainPosts.filter(post => post.subjectid === selectedSubjectId);
  }, [mainPosts, selectedSubjectId]);

  const error = userError || subjectsError || postsError;
  if (error) return <ErrorPage error={error.message} />;

  // The rest of your JSX remains exactly the same
  return (
    <section
      aria-label="Recursos principales"
      className="z-50 w-full min-h-screen max-h-full flex flex-col lg:mb-0 px-4 sm:px-6 lg:px-10 gap-6 pt-[80px] pb-[20px]"
    >
      <Header isLoading={isUserLoading} userName={user?.publicname} />

      <div
        role="region"
        aria-live="polite"
        aria-busy={isPostsLoading || isSubjectsLoading}
        className="flex flex-col gap-5 shadow-[0_2px_4px_rgba(16,42,83,0.08)] bg-[#f4f9ff] border border-[#DCEBFF] hover:bg-[#EEF5FF] transition-colors p-5 grow rounded-2xl"
      >
        <div className="flex flex-col gap-3">
          <h2 className="text-xl font-bold text-slate-700">Recursos útiles</h2>
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 flex-wrap">
            <SubjectSelect
              subjects={subjects}
              isLoading={isSubjectsLoading}
              value={selectedSubjectId}
              onChange={handleSubjectChange}
            />
            {user && (user.role === 'admin' || user.role === 'dev') && <AddMainFileButton />}
          </div>
        </div>

        <PostsList isLoading={isPostsLoading} posts={filteredPosts} toggleList={toggleList} />

        {modalState.type && modalState.postId && (
          <ListModal
            post={mainPosts?.find(p => p.id === modalState.postId) ?? undefined}
            type={modalState.type}
            position={modalState.position}
            onClose={closeModal}
          />
        )}
      </div>
    </section>
  );
}


// Header Component
const Header = ({ isLoading, userName }: { isLoading: boolean; userName?: string }) => (
  <header
    role="banner"
    className="shadow-[0_2px_4px_rgba(16,42,83,0.08)] bg-[#f4f9ff] border border-[#DCEBFF] hover:bg-[#EEF5FF] rounded-2xl p-5 basis-[15%] flex flex-col sm:flex-row justify-between items-center gap-4 transition-colors"
  >
    <h1 className="text-3xl font-extrabold text-slate-700">
      {isLoading ? (
        <span
          className="h-[36px] w-[250px] bg-slate-100 animate-pulse block rounded-md"
          aria-label="Cargando nombre de usuario"
        />
      ) : (
        `Hola, ${userName ?? 'Usuario'}`
      )}
    </h1>
    <Link
      href="/gemif/weekly-challenges"
      className="text-center sm:text-left py-2 px-3 hover:bg-[#d3e5ff] transition-colors rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2C5AA0]"
      aria-label="Ir a desafíos semanales"
    >
      <p className="text-md font-bold text-slate-700 md:text-xl leading-none">Atrévete con los</p>
      <p className="text-md font-bold text-slate-700 md:text-xl leading-none">Desafíos semanales 🔥</p>
    </Link>
  </header>
);

// Subject Select Component
const SubjectSelect = ({
  subjects,
  isLoading,
  value,
  onChange,
}: {
  subjects?: Subject[];
  isLoading: boolean;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}) => (
  <div className="flex flex-col w-full max-w-xs md:w-auto" role="group" aria-labelledby="subjectSelectLabel">
    <label
      id="subjectSelectLabel"
      htmlFor="subjectSelect"
      className="mb-1 text-xs font-medium text-slate-700"
    >
      Asignatura
    </label>
    <select
      id="subjectSelect"
      name="subject"
      value={value}
      onChange={onChange}
      disabled={isLoading}
      aria-disabled={isLoading}
      aria-live="polite"
      className="block w-full px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-[#DCEBFF] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2C5AA0] transition"
    >
      <option value="11111111">{isLoading ? 'Cargando...' : 'General'}</option>
      {Array.isArray(subjects) &&
        subjects
          .filter(s => s.primitiveid !== '00000000')
          .map(subject => (
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
    className="w-full max-w-xs text-center p-2 rounded-md bg-[#2C5AA0] text-white text-sm font-semibold transition-colors duration-300 hover:bg-[#3A7BC4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2C5AA0]"
    aria-label="Añadir nuevo recurso"
  >
    Añadir recurso
  </Link>
);

// Posts List Component
const PostsList = ({
  isLoading,
  posts,
  toggleList,
}: {
  isLoading: boolean;
  posts: MainPost[];
  toggleList: (e: React.MouseEvent, type: 'link' | 'file', postId: string) => void;
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center w-full min-h-[4rem]" role="status" aria-live="polite">
        <Loader />
        <span className="sr-only">Cargando recursos...</span>
      </div>
    );
  }

  if (!Array.isArray(posts) || posts.length === 0) {
    return (
      <div className="flex justify-center items-center h-full text-gray-500" role="alert">
        No se encontraron recursos para esta asignatura
      </div>
    );
  }

  return (
    <ul
      className="grid grid-cols-1 sm:grid-cols-2 auto-rows-max gap-3 overflow-y-auto flex-1 min-h-0 bg-[#e4ecf6] p-3 rounded-lg"
      aria-label="Lista de recursos"
    >
      {posts.map(post => (
        <PostItem key={post.id} post={post} toggleList={toggleList} />
      ))}
    </ul>
  );
};

// Post Item Component
const PostItem = ({
  post,
  toggleList,
}: {
  post: MainPost;
  toggleList: (e: React.MouseEvent, type: 'link' | 'file', postId: string) => void;
}) => {
  const isSingleFile = Array.isArray(post.filenames) && post.filenames.length === 1;
  const isSingleLink = Array.isArray(post.links) && post.links.length === 1;

  const handleClick = (e: React.MouseEvent, type: 'link' | 'file') => {
    e.preventDefault();
    if ((type === 'file' && isSingleFile) || (type === 'link' && isSingleLink)) {
      if (type === 'file') {
        const url = `https://raw.githubusercontent.com/Aissamdev2/Archive/main/main-data/${post.foldername}/${post.filenames?.[0] ?? ''}`;
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        window.open(post.links?.[0] ?? '', '_blank', 'noopener,noreferrer');
      }
    } else {
      toggleList(e, type, post.id ?? '');
    }
  };

  return (
    <li className="bg-white h-[100px] flex rounded-xl border border-[#e0e7ff] shadow-sm hover:shadow-md hover:border-blue-400 transition-all">
      <button
        onClick={e => handleClick(e, post.type as 'link' | 'file')}
        className="text-left flex flex-col justify-center grow px-4 py-3 overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-1 rounded-l-xl"
        aria-label={`Abrir recurso: ${post.name}`}
        type="button"
      >
        <p title={post.name} className="text-sm font-semibold text-blue-600 truncate">
          {post.name}
        </p>
        <p title={post.description} className="text-xs text-gray-500 truncate mt-1">
          {post.description}
        </p>
      </button>

      <ViewPostButton post={{ id: post.id ?? '', name: post.name ?? '' }} />

    </li>
  );
};


export default function ViewPostButton({ post }: { post: { id: string; name: string } }) {

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
