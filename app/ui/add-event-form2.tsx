'use client'

import { useFormStatus, useFormState } from "react-dom";
import { addEvent } from "@/app/lib/actions/events/actions";
import { getSubjects } from "@/app/lib/actions/subjects/actions";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { mutate } from "swr";
import { useUser } from "../lib/use-user";
import { Subject } from "../lib/definitions";
import { useSubjects } from "../lib/use-subjects";
import { usePrimitiveSubjects } from "../lib/use-primitive-subjects";
import Loader from "./loader";
import { CircleAlert } from "lucide-react";
import ErrorPage from "./error";

export default function AddEventForm() {
  const addNewEvent = async (_currentState: unknown, formData: FormData) => {
    const subjectId = formData.get('subjectid') as string;
    const { data : allSubjects } = await getSubjects();
    const eventSubject = allSubjects?.find(subject => subject.id === subjectId);
    formData.append('primitiveid', eventSubject?.primitiveid || '');

    const result = await addEvent(formData);
    if (!result.error && result.data) {
      await mutate(`${process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL}/api/events`, result.data);
    }
    return result;
  };

  const [state, dispatch] = useFormState(addNewEvent, undefined);
  const [errorMessage, setErrorMessage] = useState<{ error: string, errorCode: string, details: { name: string; success: boolean, error?: string | null }[] }>();
  const [scope, setScope] = useState('user');
  const router = useRouter();
  const { user, isLoading, error } = useUser();
  const { subjects, isLoading: isLoadingSubjects, error: subjectsError } = useSubjects();
  const { primitiveSubjects, isLoading: isLoadingPrimitiveSubjects, error: primitiveSubjectsError } = usePrimitiveSubjects();
  const [disabled, setDisabled] = useState(true);

  useEffect(() => {
    if (state?.data) {
      router.back();
    } else if (state?.error === 'Error de formato') {
      setErrorMessage({ error: state.error, errorCode: state.errorCode ?? 'UNKNOWN_ERROR', details: state.details });
    } else if (!state?.data && state?.error) {
      setErrorMessage({ error: state.error ?? 'UNKNOWN_ERROR', errorCode: state.errorCode ?? 'UNKNOWN_ERROR', details: state.details });
    }
  }, [state, router, setErrorMessage]);

  const handleScopeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setScope(event.target.value);
  };

  if (error || subjectsError || primitiveSubjectsError) return <ErrorPage error={error?.message || subjectsError?.message || primitiveSubjectsError?.message} />

  return (
    <form action={dispatch} id="modalBox-3"
      className="starting:scale-[0] scale-[1] transition-[transform] duration-300 w-full max-w-3xl h-[90vh] flex flex-col bg-white rounded-xl shadow-xl overflow-hidden">
      
      <div className="p-4 border-b border-gray-200 shrink-0">
        <h4 className="text-lg font-bold text-gray-900 text-center">Añadir nuevo evento</h4>
      </div>

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

      <div className="flex-1 overflow-y-auto p-6">
        {
          isLoading || isLoadingPrimitiveSubjects || isLoadingSubjects ? (
            <div className="flex justify-center items-center w-full min-h-[4rem]">
              <div className="w-[40px] h-[30px]">
                <Loader />
              </div>
            </div>
          ) : !user ? (<p className="text-lg font-bold text-gray-900 text-center">No se ha encontrado el usuario</p>)
              : !primitiveSubjects ? (<p className="text-lg font-bold text-gray-900 text-center">No se han encontrado las asignaturas</p>)
              : !subjects ? (<p className="text-lg font-bold text-gray-900 text-center">No se ha encontrado las asignaturas</p>)
              : 
          <div className="flex flex-col md:flex-row justify-around gap-8 w-full">
            <div className="flex flex-col gap-8">
              <div className="relative">
                <label className="flex items-center mb-1 text-gray-600 text-xs font-medium">Título<span className='text-red-500'>*</span></label>
                <input type="text" name="name"
                  className="block w-full px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-[#DCEBFF] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#4A90E2] transition"
                  placeholder="Añade un título" />
              </div>

              <div className="relative">
                <label className="flex items-center mb-1 text-gray-600 text-xs font-medium">Descripción</label>
                <textarea name="description"
                  className="block w-full px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-[#DCEBFF] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#4A90E2] transition"
                  placeholder="Escribe una descripción..."></textarea>
              </div>
            </div>

            <div className="flex flex-col gap-8">
              <div className="relative">
                <label className="flex items-center mb-1 text-gray-600 text-xs font-medium">Fecha del evento<span className='text-red-500'>*</span></label>
                <input type="date" name="date"
                  defaultValue={new Date().toISOString().split('T')[0]}
                  className="block w-full px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-[#DCEBFF] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#4A90E2] transition" />
              </div>

              <div className="relative">
                <label className="flex items-center mb-1 text-gray-600 text-xs font-medium">Hora del evento<span className='text-red-500'>*</span></label>
                <input type="time" name="time"
                  defaultValue={new Date().toLocaleTimeString().slice(0, 5)}
                  className="block w-full px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-[#DCEBFF] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#4A90E2] transition" />
              </div>

              {user?.role === 'user' && (
                <input type="hidden" name="scope" value="user" />
              )}

              {user?.role === 'admin' && (
                <div className="flex flex-col">
                  <label htmlFor="options" className="mb-2 text-sm font-medium text-gray-600 w-full">Visibilidad<span className='text-red-500'>*</span></label>
                  <select
                    id="options"
                    name="scope"
                    value={scope}
                    onChange={handleScopeChange}
                    className="block w-full px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-[#DCEBFF] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#4A90E2] transition">
                    <option value="user">Individual</option>
                    <option value="admin">Clase</option>
                  </select>
                </div>
              )}

              {user?.role === 'dev' && (
                <div className="flex flex-col">
                  <label className="flex items-center mb-1 text-gray-600 text-xs font-medium">Visibilidad<span className='text-red-500'>*</span></label>
                  <select
                    id="options"
                    name="scope"
                    value={scope}
                    onChange={handleScopeChange}
                    className="block w-full px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-[#DCEBFF] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#4A90E2] transition">
                    <option value="user">Individual</option>
                    <option value="admin">Clase</option>
                    <option value="dev">Global</option>
                  </select>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="flex items-center mb-1 text-gray-600 text-xs font-medium">Asignatura<span className='text-red-500'>*</span></label>
              {subjects && (
                <SubjectRadios subjects={subjects.filter(s => !s.archived)} setDisabled={setDisabled} />
              )}
            </div>
          </div>
        }
      </div>
      <div className="p-4 border-t border-gray-200 flex items-center justify-end gap-3 shrink-0">
        <button onClick={() => router.back()} type="button"
          className="w-full text-center p-1.5 py-2 rounded-md bg-white text-black text-xs font-medium transition-all duration-300 border hover:border-gray-400"
          data-pd-overlay="#modalBox-3" data-modal-target="modalBox-3">
          Cancelar
        </button>
        <AddButton disabled={disabled || !user || isLoading || !subjects || isLoadingSubjects || !primitiveSubjects || isLoadingPrimitiveSubjects} />
      </div>
    </form>
  );
}

function AddButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (pending) event.preventDefault();
  };

  return (
    <button disabled={pending || disabled} type="submit" onClick={handleClick}
      className={`${disabled || pending ? 'pointer-events-none opacity-30' : 'opacity-100'} w-full text-center p-1.5 py-2 rounded-md bg-[#4A90E2] text-white text-xs font-medium close-modal-button transition-all duration-300 hover:bg-[#3A7BC4]`}>
      {pending ? 'Cargando...' : 'Crear'}
    </button>
  );
}

function SubjectRadios({ subjects, setDisabled }: { subjects: Subject[], setDisabled: React.Dispatch<React.SetStateAction<boolean>> }) {
  const initialState = () => {
    return Object.fromEntries(subjects.map(s => [s.name, s.primitiveid === '00000000']));
  };

  const emptyState = () => {
    return Object.fromEntries(subjects.map(s => [s.name, false]));
  };

  const [isChecked, setIsChecked] = useState(() => initialState());

  useEffect(() => {
    setDisabled(Object.values(isChecked).every(v => !v));
  }, [isChecked, setDisabled]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, name: string) => {
    const { checked } = e.target;
    const newState = emptyState();
    newState[name] = checked;
    setIsChecked(newState);
  };

  const handleClick = (e: React.MouseEvent<HTMLElement>, name: string) => {
    if (isChecked[name]) setIsChecked(initialState());
  };

  return (
    <>
      {subjects.map(subject => (
        <div key={subject.id} className="flex items-center">
          <input
            type="radio"
            id={subject.id}
            className="hidden peer"
            onChange={e => handleChange(e, subject.name)}
            value={subject.id}
            onClick={e => handleClick(e, subject.name)}
            checked={isChecked[subject.name]}
            name="subjectid"
          />
          <label htmlFor={subject.id}>
            <div
              style={{
                background: `linear-gradient(to right, ${subject.bgcolor}, white)`,
                borderColor: subject.bordercolor,
                color: subject.color,
                borderRadius: "4px"
              }}
              className="max-w-[170px] cursor-pointer flex items-center gap-2 border-[2px] text-xs font-medium mr-2 px-1.5 py-1"
            >
              <p className="overflow-hidden truncate w-[">{subject.name}</p>
              {isChecked[subject.name] && (
                <div className="min-w-[8px]">
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1.52539 6.47487L6.47514 1.52512M6.47514 6.47487L1.52539 1.52512"
                      stroke="#6B7280" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </div>
          </label>
        </div>
      ))}
    </>
  );
}
