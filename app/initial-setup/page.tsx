'use client';

import { useEffect, useState } from 'react';
import { usePrimitiveSubjects } from '../lib/use-primitive-subjects';
import { useFormState, useFormStatus } from 'react-dom';
import { mutate } from 'swr';
import { archiveSubjects, initialize, updateSubjects, getSubjects } from '../lib/actions';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

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
  const { primitiveSubjects, isLoading: isLoadingPrimitiveSubjects } = usePrimitiveSubjects();

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

    // 1. ✅ Add "otros" + currently taking + currently passed
    const subjectsToAdd = [
      ...(otrosSubject ? [otrosSubject] : []),
      ...columns.taking,
      ...columns.passed
    ];
    formData.set("subjectsToAdd", JSON.stringify(subjectsToAdd));
    await mutate("/api/subjects", updateSubjects(formData));

    // 2. ✅ Archive passed ones that already exist
    const existingSubjects = await getSubjects();
    const subjectsToArchive = existingSubjects.filter(subject =>
      columns.passed.some(p => p.name === subject.name)
    );

    formData.set("subjectsToArchive", JSON.stringify(subjectsToArchive));

    // 3. 🔁 Mutate and reset
    await mutate("/api/subjects", archiveSubjects(formData));

    await initialize();
    setInitialColumns(columns);
    setHasChanges(false);

    return "Done";
  };



  const [_, dispatch] = useFormState(submitAll, undefined);

  const Column = ({ id, title, items }: { id: ColumnId; title: string; items: Subject[] }) => (
    <Droppable droppableId={id}>
      {(provided, snapshot) => (
        <div
          {...provided.droppableProps}
          ref={provided.innerRef}
          className="flex flex-col gap-3 min-h-[300px] max-h-[calc(100vh-200px)] p-2"
        >
          <p className="text-2xl text-slate-700 border-b px-2 py-2">{title}</p>
          <div
            className={`flex flex-col gap-3 min-h-[300px] max-h-[calc(100vh-200px)] overflow-y-auto rounded-md p-2 transition-[background-color] ${
              snapshot.isDraggingOver ? 'bg-[#ceddec]' : ''
            }`}
          >
            {items.length === 0 ? (
              <p className="text-slate-700 text-center py-8">No hay asignaturas</p>
            ) : (
              items.map((subject, index) => (
                <Draggable key={subject.id} draggableId={subject.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className="max-w-full flex justify-between items-stretch rounded-md bg-white border border-[#e0e7ff] shadow-sm hover:shadow-md hover:border-blue-400 transition-all duration-200 ease-in-out p-1"
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

  return (
    <main className="w-full h-full flex justify-center items-center p-5 bg-white">
      <form action={dispatch} className="w-[95%]">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="h-fit lg:h-[85%] lg:mt-5 bg-[#f4f9ff] border border-[#DCEBFF] hover:bg-[#EEF5FF] transition-[background-color] duration-300 rounded-2xl grid grid-cols-1 md:grid-cols-3 gap-4 px-4 py-6">
            <Column id="toTake" title="Por cursar" items={columns.toTake} />
            <Column id="taking" title="Cursando" items={columns.taking} />
            <Column id="passed" title="Superadas" items={columns.passed} />
          </div>
        </DragDropContext>
        <div className="flex justify-center mt-6">
          <SubmitButton hasChanges={hasChanges} />
        </div>
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
