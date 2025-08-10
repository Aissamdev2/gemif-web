'use client';

import { useEffect, useState } from 'react';
import { usePrimitiveSubjects } from '../lib/use-primitive-subjects';
import { useFormState, useFormStatus } from 'react-dom';
import { mutate } from 'swr';
import { initialize } from '../lib/actions/session/actions';
import { updateSubjects, archiveSubjects } from '../lib/actions/subjects/actions';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import Loader from '../ui/loader';
import { CircleAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ErrorPage from '../ui/error';

type Subject = {
  id: string;
  name: string;
};

type ColumnId = 'toTake' | 'taking' | 'passed';

type Columns = {
  toTake: Subject[];
  taking: Subject[];
  passed: Subject[];
};


export default function InitialSetup() {
  const { primitiveSubjects, isLoading: isLoadingPrimitiveSubjects, error: primitiveSubjectsError } = usePrimitiveSubjects();

  const [columns, setColumns] = useState<Columns>({ toTake: [], taking: [], passed: [] });
  const [initialColumns, setInitialColumns] = useState<Columns>({ toTake: [], taking: [], passed: [] });
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (primitiveSubjects) {
      const subj = primitiveSubjects.filter(p => p.id !== '00000000');

      const sorted = (arr: Subject[]) => [...arr].sort((a, b) => a.id.localeCompare(b.id));

      const initial = {
        toTake: sorted(subj),
        taking: [],
        passed: []
      };

      setColumns(initial);
      setInitialColumns(initial);
      setHasChanges(false);
    }
  }, [primitiveSubjects]);

  useEffect(() => {
    const equal = JSON.stringify(columns) === JSON.stringify(initialColumns);
    setHasChanges(!equal);
  }, [columns, initialColumns]);

  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;

    const sourceCol = source.droppableId as ColumnId;
    const destCol = destination.droppableId as ColumnId;

    if (sourceCol === destCol) return;

    setColumns(prev => {
      const sourceItems = [...prev[sourceCol]];
      const destItems = [...prev[destCol]];
      const [moved] = sourceItems.splice(source.index, 1);

      return {
        ...prev,
        [sourceCol]: sourceItems,
        [destCol]: [...destItems, moved].sort((a, b) => a.id.localeCompare(b.id))
      };
    });
  };

  const submitAll = async (_: unknown, formData: FormData) => {
    if (!primitiveSubjects) return;

    const otrosSubject = primitiveSubjects.find(subject => subject.id === '00000000');

    // ✅ Subjects to ADD = taking + passed + "otros"
    const subjectsToAdd = [
      ...(otrosSubject ? [otrosSubject] : []),
      ...[...columns.taking, ...columns.passed].map(s => {
        const match = primitiveSubjects.find(p => p.id === s.id);
        if (!match) throw new Error(`Subject to add not found: ${s.name}`);
        return match;
      })
    ];
    formData.set("subjectsToAdd", JSON.stringify(subjectsToAdd));

    // ✅ Subjects to ARCHIVE = all passed
    const subjectsToArchive = columns.passed.map(s => {
      const match = primitiveSubjects.find(p => p.id === s.id);
      if (!match) throw new Error(`Subject to archive not found: ${s.name}`);
      return match;
    });
    formData.set("subjectsToArchive", JSON.stringify(subjectsToArchive));

    // ✅ Subjects to UNARCHIVE = none on first-time setup
    formData.set("subjectsToUnarchive", JSON.stringify([]));

    // ✅ Subjects to REMOVE = none on first-time setup
    formData.set("subjectsToRemove", JSON.stringify([]));

    // 🔁 Mutate and reset
    const updateRes = await updateSubjects(formData);
    console.log(updateRes)
    if (updateRes?.error) return updateRes;
    const archiveRes = await archiveSubjects(formData)
    console.log(archiveRes)
    if (archiveRes.error) return archiveRes;

    mutate((process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string) + "/api/subjects", archiveRes.data);
    const initializeRes = await initialize();
    if (initializeRes?.error || !initializeRes.data) return initializeRes;

    return archiveRes;
  };




  const [state, dispatch] = useFormState(submitAll, undefined);
  const [errorMessage, setErrorMessage] = useState<{ error: string, errorCode: string, details: { name: string; success: boolean, error?: string | null }[] } | null>(null);
  const router = useRouter()


  useEffect(() => {
    if (state?.data) {
      router.push('/gemif/main');
    } else if (state?.error) {
      setErrorMessage({
        error: state.error,
        errorCode: state.errorCode ?? 'UNKNOWN_ERROR',
        details: state.details,
      });
    }
  }, [state, router, setErrorMessage]);


  if (primitiveSubjectsError) return <ErrorPage error={primitiveSubjectsError?.message} />

  const Column = ({ id, title, items }: { id: ColumnId; title: string; items: Subject[] }) => (
    <Droppable droppableId={id}>
      {(provided, snapshot) => (
        <div
          {...provided.droppableProps}
          ref={provided.innerRef}
          className="flex flex-col gap-3 max-h-[calc(100vh-300px)] p-2 overflow-hidden"
        >
          <p className="text-xl sm:text-2xl text-slate-700 border-b px-2 py-2 break-words">
            {title}
          </p>

          {isLoadingPrimitiveSubjects ? (
            <div className="flex justify-center items-center w-full min-h-[4rem]">
              <div className="w-[40px] h-[30px]">
                <Loader />
              </div>
            </div>
          ) : (
            <div className={`flex flex-col gap-3 overflow-y-auto rounded-md p-2 transition-[background-color] ${snapshot.isDraggingOver ? 'bg-[#ceddec]' : 'bg-[#dbe7f4]'}`}>
              {items.length === 0 ? (
                <p className="text-slate-700 text-center py-8">No hay asignaturas</p>
              ) : (
                items.map((subject, index) => (
                  <Draggable key={subject.id} draggableId={subject.id} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className="max-w-full flex justify-between items-stretch 
                                  rounded-md bg-white border border-[#e0e7ff] 
                                  shadow-sm hover:shadow-md hover:border-blue-400 
                                  transition-all duration-200 ease-in-out p-1"
                      >
                        <div className="flex items-center w-full">
                          <label className="text-sm cursor-pointer truncate max-w-[200px] text-slate-600">
                            {subject.name}
                          </label>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))
              )}
              {provided.placeholder}
            </div>
          )}
        </div>
      )}
    </Droppable>

  );

  return (
    <main className="min-h-screen w-full flex justify-center bg-white py-6 px-3 md:px-6 overflow-x-hidden">
      <form action={dispatch} className="w-full max-w-6xl">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex flex-col bg-[#f4f9ff] border border-[#DCEBFF] hover:bg-[#EEF5FF] transition-[background-color] duration-300 rounded-2xl px-4 py-6 overflow-hidden">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-700 leading-snug break-words">
              Configuración inicial
            </h2>
            <h3 className="text-sm sm:text-base text-slate-700 mt-1 break-words">
              Arrastre y suelte las asignaturas que está cursando y las que ya ha cursado
            </h3>

            {errorMessage && (
              <div className="p-4 bg-red-100 text-red-700 text-sm shrink-0 border-b border-red-300 overflow-auto max-w-full break-words">
                <div className="flex items-start gap-2">
                  <CircleAlert className="min-w-[20px] h-5 w-5 mt-[2px]" />
                  <div className="mt-[2px] text-left break-words">
                    <strong className="block mb-1 break-words">
                      {errorMessage.errorCode + ': ' + errorMessage.error}
                    </strong>
                    {errorMessage.details && errorMessage.details.length > 0 &&
                      errorMessage.details.map((detail: { name: string; success: boolean, error?: string | null }, idx: number) => (
                        <p key={idx + detail.name} className="break-words">• {`${detail.name}: ${detail.error || 'Sin errores'}`}</p>
                      ))}
                  </div>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <Column id="toTake" title="Por cursar" items={columns.toTake} />
              <Column id="taking" title="Cursando" items={columns.taking} />
              <Column id="passed" title="Superadas" items={columns.passed} />
            </div>
            <div className="flex justify-center mt-6">
              <SubmitButton hasChanges={hasChanges} />
            </div>
          </div>
        </DragDropContext>
        
      </form>
    </main>
  );
}

function SubmitButton({ hasChanges }: { hasChanges: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={!hasChanges || pending}
      className={`${
        !hasChanges || pending ? 'opacity-30' : 'opacity-100'
      } w-full max-w-xs text-center text-nowrap p-1.5 py-2 rounded-md bg-[#4A90E2] text-white text-xs font-medium transition-all duration-300 hover:bg-[#3A7BC4]`}
    >
      {pending ? 'Cargando...' : 'Aceptar'}
    </button>
  );
}
