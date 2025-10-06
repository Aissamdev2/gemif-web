'use client';

import React, { useEffect, useState } from 'react';
import { useActionState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useRouter } from 'next/navigation';
import { ColumnId, Columns, ErrorMessage, SimplePrim } from '@/app/lib/definitions';
import { sortSubjects } from '@/lib/utils';
import { Book, CheckCheck, Clock, LucideIcon } from 'lucide-react';
import { initializeSubjects } from '../actions/actions';
import ErrorPopup from '@/app/ui/error-popup';
import { isSuccess } from '@/lib/errors/result';
import { SanitizedAppError } from '@/lib/errors/types';

const COLUMNS = [
  { id: 'toTake', icon: Book, title: "Assignar grupo a Por cursar" },
  { id: 'taking', icon: Clock, title: "Assignar grupo a Cursando" },
  { id: 'passed', icon: CheckCheck, title: "Assignar grupo a Superadas" },
] as { id: ColumnId, icon: LucideIcon, title: string }[]


export default function InitialSetupSubjectsClient({ initialCols }: { initialCols: Columns }) {

  // --- SUBJECTS ---
  const [columns, setColumns] = useState<Columns>(initialCols);
  const [initialColumns, setInitialColumns] = useState<Columns>(initialCols);
  const [hasChanges, setHasChanges] = useState(false);


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
        [sourceCol]: sortSubjects(sourceItems),
        [destCol]: sortSubjects([...destItems, moved]),
      };
    });
  };

  const submitAll = async (_: unknown, formData: FormData) => {
    formData.set('taking', JSON.stringify(columns.taking.map(s => ({ id: s.id, name: s.name }))));
    formData.set('passed', JSON.stringify(columns.passed.map(s => ({ id: s.id, name: s.name }))));

    return await initializeSubjects(formData);
  };

  const [state, dispatch, pending] = useActionState(submitAll, undefined);
  const [errorMessage, setErrorMessage] = useState<SanitizedAppError | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!state) return
    if (isSuccess(state)) {
      router.push('/gemif/main')
      return
    }
    setErrorMessage(state.error);
    }, [state, router]);

  const moveGroupByYear = (year: number | null, targetCol: ColumnId) => {
    setColumns(prev => {
      const newCols = { ...prev };
      const toMove: SimplePrim[] = [];

      // Remove from all columns and collect toMove
      (['toTake', 'taking', 'passed'] as ColumnId[]).forEach(col => {
        const remaining = newCols[col].filter(sub => {
          if (sub.year === year) {
            toMove.push(sub);
            return false;
          }
          return true;
        });
        newCols[col] = remaining;
      });

      // Add to target column immutably
      newCols[targetCol] = sortSubjects([...newCols[targetCol], ...toMove]);

      return newCols;
    });
  };

  const moveGroupByYearQuadri = (year: number | null, quadri: number | null, targetCol: ColumnId) => {
    setColumns(prev => {
      const newCols = { ...prev };
      const toMove: SimplePrim[] = [];

      (['toTake', 'taking', 'passed'] as ColumnId[]).forEach(col => {
        const remaining = newCols[col].filter(sub => {
          if (sub.year === year && sub.quadri === quadri) {
            toMove.push(sub);
            return false;
          }
          return true;
        });
        newCols[col] = remaining;
      });

      newCols[targetCol] = sortSubjects([...newCols[targetCol], ...toMove]);

      return newCols;
    });
  };



  const Column = ({ id, title, items }: { id: ColumnId; title: string; items: SimplePrim[] }) => {
    let lastYear: number | null | undefined = undefined;
    let lastQuadri: number | null | undefined = undefined;

    return (
      <Droppable droppableId={id}>
        {(provided, snapshot) => (
          <div {...provided.droppableProps} ref={provided.innerRef} className="flex flex-col gap-3 max-h-[calc(100vh-300px)] h-full p-2 overflow-hidden">
            <p className="heading-md border-b border-border">{title}</p>
            <div
              className={`flex flex-col h-full gap-2 overflow-y-auto rounded-md p-2 transition-[background-color] ${
                snapshot.isDraggingOver ? 'bg-gray-200' : 'bg-gray-100'
              }`}
            >
              {items.length === 0 ? (
                <p className="text-muted text-center">No hay asignaturas</p>
              ) : (
                items.map((subject, index) => {
                  const showYearSeparator = (subject.year !== lastYear) || (index === 0);
                  const showQuadriSeparator = (showYearSeparator || subject.quadri !== lastQuadri) && subject.quadri != null;

                  const groupButtonsInfo = COLUMNS.filter(c => c.id !== id)
                  const FirstIcon = groupButtonsInfo[0].icon;
                  const SecondIcon = groupButtonsInfo[1].icon;
                  const yearSeparator = showYearSeparator ? (
                    <div className="bg-gray-200 px-2 py-1 mt-3 -mx-2 border-y border-gray-300 flex justify-between items-center">
                      <h3 className="font-bold text-gray-700 text-sm uppercase">
                        {subject.year === null ? "Optativas" : `Año ${subject.year}`}
                      </h3>
                      {/* Button to move all subjects of this year to a column */}
                      <div className="flex gap-1">
                        <button
                          type="button"
                          className="btn btn-sm btn-secondary "
                          title={groupButtonsInfo[0].title}
                          onClick={() => moveGroupByYear(subject.year, groupButtonsInfo[0].id)}
                        >
                          {FirstIcon && (
                            <FirstIcon size={12} />
                          )}
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-secondary"
                          title={groupButtonsInfo[1].title}
                          onClick={() => moveGroupByYear(subject.year, groupButtonsInfo[1].id)}
                        >
                          {SecondIcon && (
                            <SecondIcon size={12} />
                          )}
                        </button>
                      </div>
                    </div>
                  ) : null;

                  const quadriSeparator = showQuadriSeparator ? (
                    <div className="pt-2 flex justify-between items-center">
                      <p className="font-semibold text-xs text-gray-500 pl-1 uppercase">
                        Cuatrimestre {subject.quadri}
                      </p>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          className="btn btn-sm btn-secondary "
                          title={groupButtonsInfo[0].title}
                          onClick={() => moveGroupByYearQuadri(subject.year, subject.quadri, groupButtonsInfo[0].id)}
                        >
                          {FirstIcon && (
                            <FirstIcon size={12} />
                          )}
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-secondary"
                          title={groupButtonsInfo[1].title}
                          onClick={() => moveGroupByYearQuadri(subject.year, subject.quadri, groupButtonsInfo[1].id)}
                        >
                          {SecondIcon && (
                            <SecondIcon size={12} />
                          )}
                        </button>
                      </div>
                    </div>
                  ) : null;
                  
                  lastYear = subject.year;
                  lastQuadri = subject.quadri;

                  return (
                    <React.Fragment key={subject.id}>
                      {yearSeparator}
                      {quadriSeparator}
                      <Draggable draggableId={subject.id} index={index}>
                        {(provided) => (
                           <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="max-w-full flex justify-between items-center rounded-md bg-bg border border-border shadow-sm hover:shadow-md hover:border-primary transition-all duration-200 ease-in-out p-2"
                          >
                            <p className="text-body font-medium truncate cursor-pointer">{subject.name}</p>
                          </div>
                        )}
                      </Draggable>
                    </React.Fragment>
                  );
                })
              )}
              {provided.placeholder}
            </div>
          </div>
        )}
      </Droppable>
    );
  }


  return (
    <form action={dispatch} className='flex-1 flex flex-col min-h-0'>
      <div className='panel-body w-full flex-1 overflow-y-auto p-3 flex flex-col gap-2'>
        <div className="flex flex-col items-start text-body p-1 bg-gray-100 rounded">
          <p>
            Este es un procedimiento obligatorio. Sin embargo, toda la información que introduzcas podrá ser modificada más adelante.
          </p>
          <p>
            Para añadir todo un bloque (año o quadrimestre) a otra columna, usa los botones al lado de las etiquetas.
          </p>
        </div>
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-3 max-md:grid-cols-1 gap-4 h-full">
            <Column id="toTake" title="Por cursar" items={columns.toTake} />
            <Column id="taking" title="Cursando" items={columns.taking} />
            <Column id="passed" title="Superadas" items={columns.passed} />
          </div>
        </DragDropContext>
      </div>
      <div className="panel-footer w-full flex-none flex justify-end gap-2 items-end border-t border-border p-3">
        {errorMessage && (
          <ErrorPopup 
            error={errorMessage}
            onClose={() => setErrorMessage(null)}
          />
        )}
        <button
          disabled={pending}
          type="submit"
          className="btn btn-primary"
        >
          {pending ? "Cargando..." : "Continuar"}
        </button>
      </div>
    </form>
  );
}
