'use client';

import { useSubjects } from "@/app/lib/use-subjects";
import { usePrimitiveSubjects } from "@/app/lib/use-primitive-subjects";
import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { mutate } from "swr";
import { archiveSubjects, updateSubjects } from "@/app/lib/actions";
import Loader from "@/app/ui/loader";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import { useRouter } from "next/navigation";

type Subject = {
  id: string;
  name: string;
  archived: boolean;
  primitiveid: string;
};

type ColumnId = 'toTake' | 'taking' | 'passed';

type Columns = {
  toTake: Subject[];
  taking: Subject[];
  passed: Subject[];
};

function areColumnsEqual(a: Columns, b: Columns): boolean {
  const sameIds = (arr1: Subject[], arr2: Subject[]) =>
    arr1.length === arr2.length && arr1.every((s, i) => s.id === arr2[i].id);
  return sameIds(a.toTake, b.toTake) && sameIds(a.taking, b.taking) && sameIds(a.passed, b.passed);
}

export default function Page() {
  const { subjects, error: subjectsError, isLoading: isLoadingSubjects } = useSubjects();
  const { primitiveSubjects, error: primitiveSubjectsError, isLoading: isLoadingPrimitiveSubjects } = usePrimitiveSubjects();

  const [columns, setColumns] = useState<Columns>({ toTake: [], taking: [], passed: [] });
  const [initialColumns, setInitialColumns] = useState<Columns>({ toTake: [], taking: [], passed: [] });
  const [hasChanges, setHasChanges] = useState(false);

  const sortByPrimitiveId = (a: Subject, b: Subject) =>
    a.primitiveid.localeCompare(b.primitiveid);

  const deduplicate = (arr: Subject[]) => {
    const seen = new Set();
    return arr.filter(item => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  };

  useEffect(() => {
    if (subjects && primitiveSubjects) {
      const toTake: Subject[] = [];
      const taking: Subject[] = [];
      const passed: Subject[] = [];

      const subjectNames = new Set(subjects.map(s => s.name));

      primitiveSubjects
        .filter(p => p.id !== '00000000')
        .forEach(p => {
          if (!subjectNames.has(p.name)) {
            toTake.push({ id: p.id, name: p.name, archived: false, primitiveid: p.id });
          }
        });

      subjects.filter(s => s.primitiveid !== '00000000').forEach(s => {
        if (s.archived) passed.push({ id: s.id??'', name: s.name, archived: true, primitiveid: s.primitiveid });
        else taking.push({ id: s.id??'', name: s.name, archived: false, primitiveid: s.primitiveid });
      });

      const newColumns = {
        toTake: toTake.sort(sortByPrimitiveId),
        taking: taking.sort(sortByPrimitiveId),
        passed: passed.sort(sortByPrimitiveId)
      };

      setColumns(newColumns);
      setInitialColumns(newColumns);
      setHasChanges(false);
    }
  }, [subjects, primitiveSubjects]);

  useEffect(() => {
    setHasChanges(!areColumnsEqual(columns, initialColumns));
  }, [columns, initialColumns]);

  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;

    const sourceCol = source.droppableId as ColumnId;
    const destCol = destination.droppableId as ColumnId;

    if (sourceCol === destCol) return; // ⛔ Reordering disallowed

    setColumns(prev => {
      const sourceItems = [...prev[sourceCol]];
      const destItems = [...prev[destCol]];
      const [moved] = sourceItems.splice(source.index, 1);

      const updatedItem = { ...moved, archived: destCol === 'passed' };

      const updatedSource = deduplicate(sourceItems);
      const updatedDest = deduplicate([...destItems, updatedItem]);

      return {
        ...prev,
        [sourceCol]: updatedSource.sort(sortByPrimitiveId),
        [destCol]: updatedDest.sort(sortByPrimitiveId)
      };
    });
  };

  const changeSubjectsAndArchives = async (_: unknown, formData: FormData) => {
    if (!primitiveSubjects || !subjects) return;

    const initialTakingNames = new Set(initialColumns.taking.map(s => s.name));
    const currentTakingNames = new Set(columns.taking.map(s => s.name));

    const subjectsToAdd = columns.taking
      .filter(s => !initialTakingNames.has(s.name))
      .map(s => primitiveSubjects.find(p => p.name === s.name)!)
      .filter(Boolean);

    const subjectsToRemove = initialColumns.taking
      .filter(s => !currentTakingNames.has(s.name) && !columns.passed.some(p => p.name === s.name))
      .map(s => subjects.find(sub => sub.name === s.name)!)
      .filter(Boolean);

    console.log({ subjectsToAdd, subjectsToRemove });

    const initialPassedNames = new Set(initialColumns.passed.map(s => s.name));
    const currentPassedNames = new Set(columns.passed.map(s => s.name));

    const subjectsToArchive = columns.passed
      .filter(s => !initialPassedNames.has(s.name))
      .map(s => subjects.find(sub => sub.name === s.name)!)
      .filter(Boolean);

    const subjectsToUnarchive = initialColumns.passed
      .filter(s => !currentPassedNames.has(s.name))
      .map(s => subjects.find(sub => sub.name === s.name)!)
      .filter(Boolean);

    formData.set("subjectsToAdd", JSON.stringify(subjectsToAdd));
    formData.set("subjectsToRemove", JSON.stringify(subjectsToRemove));
    formData.set("subjectsToArchive", JSON.stringify(subjectsToArchive));
    formData.set("subjectsToUnarchive", JSON.stringify(subjectsToUnarchive));

    mutate((process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string) + "/api/subjects", await updateSubjects(formData))
    mutate((process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string) + "/api/subjects", await archiveSubjects(formData))

    // ✅ Sync initial state to new
    const updatedInitial = {
      toTake: [...columns.toTake],
      taking: [...columns.taking],
      passed: [...columns.passed]
    };
    setInitialColumns(updatedInitial);
    setHasChanges(false);

    return "Subjects updated";
  };

  const [state, dispatch] = useFormState(changeSubjectsAndArchives, undefined);
  const router = useRouter()

    useEffect(() => {
      if (state === 'Subjects updated') {
        if (!subjects) return

        router.refresh();
      } else if (state === 'Failed to update subjects') {
      }
    }, [router, state, subjects]);

  const handleReset = () => {
    setColumns(initialColumns);
    setHasChanges(false);
  };

  const Column = ({ id, title, items }: { id: ColumnId; title: string; items: Subject[] }) => (
    <Droppable droppableId={id}>
      {(provided, snapshot) => (
        <div
          {...provided.droppableProps}
          ref={provided.innerRef}
          className={`flex flex-col gap-3 min-h-[300px] max-h-[calc(100vh-200px)] p-2`}
        >
          <p className="text-2xl text-slate-700 border-b px-2 py-2 ">{title}</p>
          <div className={`flex flex-col gap-3 min-h-[300px] max-h-[calc(100vh-200px)] overflow-y-auto rounded-md p-2 transition-[background-color] ${snapshot.isDraggingOver ? 'bg-[#ceddec]' : ''}`}>
            {items.length === 0 && !isLoadingSubjects && (
              <p className="text-slate-700 text-center py-8">No hay asignaturas</p>
            )}
            {isLoadingSubjects ? (
              <div className="flex items-center justify-center h-full"><Loader /></div>
            ) : (
              items.map((subject, index) => (
                <Draggable key={subject.id} draggableId={subject.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={`max-w-full flex justify-between items-stretch 
                                    rounded-md bg-white border border-[#e0e7ff] 
                                    shadow-sm hover:shadow-md hover:border-blue-400 
                                    transition-all duration-200 ease-in-out p-1`}
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
          </div>
      )}
    </Droppable>
  );

  if (subjectsError || primitiveSubjectsError) return <div>Error loading subjects.</div>;

  return (
    <div className="h-fit lg:h-full w-full flex bg-white py-3 text-gray-900 font-medium justify-center items-center">
      <form action={dispatch} className="w-[95%]">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="h-fit lg:h-[85%] lg:mt-5 bg-[#f4f9ff] border border-[#DCEBFF] hover:bg-[#EEF5FF] transition-[background-color] duration-300 rounded-2xl  grid grid-cols-1 md:grid-cols-3 gap-4 px-4 py-6">
            {
              isLoadingSubjects || isLoadingPrimitiveSubjects ? (
                <>
                  <div className="flex justify-center items-center w-full min-h-[4rem]">
                    <div className="w-[40px] h-[30px]">
                      <Loader />
                    </div>
                  </div>
                  <div className="flex justify-center items-center w-full min-h-[4rem]">
                    <div className="w-[40px] h-[30px]">
                      <Loader />
                    </div>
                  </div>
                  <div className="flex justify-center items-center w-full min-h-[4rem]">
                    <div className="w-[40px] h-[30px]">
                      <Loader />
                    </div>
                  </div>   
                </>
              ) : (
                <>
                  <Column id="toTake" title="Por cursar" items={columns.toTake} />
                  <Column id="taking" title="Cursando" items={columns.taking} />
                  <Column id="passed" title="Superadas" items={columns.passed} />
                </>
              )
            }
          </div>
        </DragDropContext>
        <div className="flex gap-3 justify-center mt-6">
          <button
            type="button"
            onClick={handleReset}
            className="w-full max-w-xs text-center p-1.5 py-2 rounded-md bg-red-600 text-white text-xs font-medium transition-all text-nowrap duration-300 hover:bg-red-700"
          >
            Reestablecer selección
          </button>
          <SubmitButton hasChanges={hasChanges} />
        </div>
      </form>
    </div>
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
      {pending ? 'Cargando...' : 'Guardar cambios'}
    </button>
  );
}
