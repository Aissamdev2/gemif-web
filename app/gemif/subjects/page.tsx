'use client'

import { PrimitiveSubject, Ranking, Subject } from "@/app/lib/definitions";
import { usePrimitiveSubjects } from "@/app/lib/use-primitive-subjects";
import { useRanking } from "@/app/lib/use-ranking";
import { useSubjects } from "@/app/lib/use-subjects";
import SubjectBoxInfo from "@/app/ui/subject-box-info"; // Not directly used in the provided snippet but keeping import
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { mutate } from "swr";
import { Award, CircleAlert, Copy, Pencil, Plus, Trash2, X } from "lucide-react"; // Added Pencil, Plus, Trash2
import Loader from "@/app/ui/loader";
import { updateRanking } from "@/app/lib/actions/ranking/actions";
import ErrorPage from "@/app/ui/error";
import MiniModal from "@/app/ui/mini-modal";
import CopyToClipboard from "@/app/ui/copy-to-clipboard";
import { updatePrimitiveSubject } from "@/app/lib/actions/primitive-subjects/actions";


export default function SubjectsPage() {
  const submitScore = async (_currentState: unknown, formData: FormData) => {
    formData.append('type', scoreType);

    const result = await updateRanking(formData)
    if (!result.error && result.data) {
      mutate((process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string) + "/api/ranking", result.data)
      mutate((process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string) + "/api/subjects")
    }

    return result
  }


  const handleUpdateSubject = async (_currentState: unknown, formData: FormData) => {
    if (!selectedOption) return;

    formData.append('id', selectedOption.id);

    // Create updated info object
    const updatedInfo = {
      ...selectedOption.info, // Keep existing info
      ...editedValues       // Override with edited values
    };

    // Stringify the updated info object
    formData.set('info', JSON.stringify(updatedInfo));

    const result = await updatePrimitiveSubject(formData);

    if (!result.error && result.data) {
      mutate((process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string) + "/api/primitive-subjects", result.data);
      setEditingRow([]);
      setEditedValues({});
      setIsAnyRowEditing(false);
      setErrorMessage(null);
    }

    return result;
  }



  // State for subject data
  const [selectedOptionId, setSelectedOptionId] = useState<string | undefined>('Seleccione una asignatura');
  const [selectedOption, setSelectedOption] = useState<any | undefined>(undefined);

  // State for score submission
  const [scoreSelectedOptionId, setScoreSelectedOptionId] = useState<string | undefined>('Seleccione una asignatura');
  const [scoreSelectedOption, setScoreSelectedOption] = useState<Subject | undefined>(undefined);
  const [scoreType, setScoreType] = useState<'qual' | 'diff'>('qual');

  // Error message state
  const [errorMessage, setErrorMessage] = useState<{ error: string, errorCode: string, details: { name: string; success: boolean, error?: string | null }[] } | null>(null);
  const [updateSubjectErrorMessage, setUpdateSubjectErrorMessage] = useState<{ error: string, errorCode: string, details: { name: string; success: boolean, error?: string | null }[] } | null>(null);

  // UI state
  const [subjectMenu, setSubjectMenu] = useState<'info' | 'review' | null>(null);
  const [emailToggles, setEmailToggles] = useState<Record<number, boolean>>({});

  // Data fetching hooks
  const { primitiveSubjects, error: primitiveError, isLoading: isLoadingPrimitive } = usePrimitiveSubjects();
  const router = useRouter()
  const { subjects, error: subjectsError, isLoading: isLoadingSubjects } = useSubjects();
  const { ranking, error: rankingError, isLoading: isLoadingRanking } = useRanking();

  // Form state for score submission
  const [state, dispatch] = useFormState(submitScore, undefined)

  // --- New states for editing functionality ---
  const [editingRow, setEditingRow] = useState<string[]>([]); // Stores the name of the row being edited (e.g., 'name', 'credits', 'professors')
  const [editedValues, setEditedValues] = useState<any>({}); // Stores values of currently edited fields
  const [isAnyRowEditing, setIsAnyRowEditing] = useState(false); // Tracks if any row is in editing mode

  
  const [updateSubjectState, updateSubjectDispatch] = useFormState(handleUpdateSubject, undefined);

  useEffect(() => {
    if (state?.data) {
      // Handle successful score update (if any specific UI feedback is needed)
    } else if (!state?.data && state?.error) {
      setErrorMessage({ error: state.error ?? 'UNKNOWN_ERROR', errorCode: state.errorCode ?? 'UNKNOWN_ERROR', details: state.details });
    }
  }, [state, router, setErrorMessage]);


  useEffect(() => {
    setSelectedOption(primitiveSubjects?.find((subject) => subject.id === selectedOptionId));
  }, [primitiveSubjects, selectedOptionId]);

  useEffect(() => {
    if (updateSubjectState?.error) {
      setUpdateSubjectErrorMessage({ error: updateSubjectState.error, errorCode: updateSubjectState.errorCode??'UNKNOWN_ERROR', details: updateSubjectState.details });
    } else if (updateSubjectState?.data && !updateSubjectState.error) {
      // If update was successful, clear error message
      setUpdateSubjectErrorMessage(null);
    }
  }, [updateSubjectState, setUpdateSubjectErrorMessage]);

  // Effect to update `isAnyRowEditing` when `editingRow` changes
  useEffect(() => {
    setIsAnyRowEditing(editingRow.length > 0);
  }, [editingRow]);


  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    if (!primitiveSubjects) return
    const targetSubject = primitiveSubjects.find((subject) => subject.id === event.target.value)
    setSubjectMenu(null);
    setEmailToggles({});
    setSelectedOptionId(event.target.value);
    setSelectedOption(targetSubject);
    setEditingRow([]); // Reset editing when subject changes
    setEditedValues({}); // Clear edited values
    setErrorMessage(null); // Clear any errors
  };

  const handleScoreSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    if (!subjects) return
    const targetSubject = subjects.find((subject) => subject.id === event.target.value)
    setScoreSelectedOptionId(event.target.value);
    setScoreSelectedOption(targetSubject)
  };

  const toggleEdit = (rowName: string, currentValue: any) => {
    if (editingRow.includes(rowName)) {
      setEditingRow((prev) => prev.filter((name) => name !== rowName));
      setEditedValues((prev: Partial<Record<string, any>>) => {
        delete prev[rowName];
        return prev;
      });
      setErrorMessage(null); 
    } else {
      setEditingRow((prev) => [...prev, rowName]);
      if (Array.isArray(currentValue)) {
        setEditedValues((prev: any) => ({ ...prev,  [rowName]: [...currentValue] }));
      } else {
        setEditedValues((prev: any) => ({ ...prev,  [rowName]: currentValue }));
      }
      setErrorMessage(null);
    }
  };

  // Handle change for single input fields
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditedValues((prev: any) => ({ ...prev, [name]: value }));
  };

  // Handle change for array input fields (professors, emails)
  const handleArrayInputChange = (e: React.ChangeEvent<HTMLInputElement>, index: number, field: 'professors' | 'emails') => {
    const newArray = [...((editedValues[field] || selectedOption![field]) as string[])]; // Use existing edited or original
    newArray[index] = e.target.value;
    setEditedValues((prev: any) => ({ ...prev, [field]: newArray }));
  };

  // Add new item to an array field
  const addArrayItem = (field: 'professors' | 'emails') => {
    const currentArray = (editedValues[field] || selectedOption![field] || []) as string[];
    setEditedValues((prev: any) => ({ ...prev, [field]: [...currentArray, ''] })); // Add empty string for new input
  };

  // Delete item from an array field
  const deleteArrayItem = (index: number) => {
    const professors = editedValues.professors || selectedOption!.professors || [] as string[];
    const emails = editedValues.emails || selectedOption!.emails || [] as string[];
    const newProfessors = professors.filter((_: any, i: number) => i !== index);
    const newEmails = emails.filter((_: any, i: number) => i !== index);
    setEditedValues((prev: any) => ({ ...prev, professors: newProfessors, emails: newEmails }));
  };


  if (primitiveError || subjectsError || rankingError) return <ErrorPage error={primitiveError?.message || subjectsError?.message || rankingError?.message} />

  return (
    <section className="z-50 w-full h-full flex flex-col lg:mb-0 px-2 lg:px-10 gap-12 pt-[80px] pb-[20px] lg:gap-12 lg:flex-row">
      <div className="p-5 bg-[#f4f9ff] border border-[#DCEBFF] hover:bg-[#EEF5FF] transition-[background-color] duration-300 rounded-2xl flex flex-col grow-[4] gap-4">
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-700 leading-tight md:text-3xl">
          Asignaturas de GEMiF
        </h2>
        <h3 className="text-slate-700">Aquí podrás ver información sobre cada asignatura</h3>
        <div className="flex gap-3">
          {
            isLoadingPrimitive || !primitiveSubjects ? (
              <div className="flex flex-col w-full">
                <label htmlFor="options" className="flex items-center mb-1 text-gray-600 text-xs font-medium">Asignatura</label>
                <select
                  id="options"
                  name="options"
                  value={selectedOptionId}
                  onChange={handleSelectChange}
                  className="block w-full px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-[#DCEBFF] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2C5AA0] transition">
                  <option value="Seleccione una asignatura">Cargando...</option>
                </select>
              </div>
            ) : (
              <div className="flex flex-col w-full">
                <label htmlFor="options" className="flex items-center mb-1 text-gray-600 text-xs font-medium">Asignatura</label>
                <select
                  id="options"
                  name="options"
                  value={selectedOptionId}
                  onChange={handleSelectChange}
                  className="block w-full px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-[#DCEBFF] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2C5AA0] transition">
                  <option value="Seleccione una asignatura">Seleccione una asignatura</option>
                  {
                    primitiveSubjects.filter((subject) => subject.id !== '00000000').map((subject) => {
                      return (
                        <option key={subject.id + 'color'} value={subject.id}>{subject.name}</option>
                      )
                    })
                  }
                </select>
              </div>
            )
          }
        </div>

        {selectedOption && selectedOptionId !== 'Seleccione una asignatura' && (
          <div className="flex flex-col gap-4 flex-grow overflow-hidden lg:h-[calc(100%-180px)]">
            
            {/* Menu options */}
            <div className="flex gap-2 flex-wrap">
              <button
                className={`px-4 py-1 rounded-md text-sm font-medium border ${
                  subjectMenu === 'info'
                    ? 'bg-[#2C5AA0] text-white border-[#2C5AA0]'
                    : 'bg-white text-[#2C5AA0] border-[#2C5AA0] hover:bg-[#eaf3ff]'
                }`}
                onClick={() => {
                  setSubjectMenu('info');
                  setEditingRow([]); // Exit edit mode when switching tabs
                  setEditedValues({});
                  setErrorMessage(null);
                }}
              >
                Información
              </button>
              <button
                className={`px-4 py-1 rounded-md text-sm font-medium border ${
                  subjectMenu === 'review'
                    ? 'bg-[#2C5AA0] text-white border-[#2C5AA0]'
                    : 'bg-white text-[#2C5AA0] border-[#2C5AA0] hover:bg-[#eaf3ff]'
                }`}
                onClick={() => {
                  setSubjectMenu('review');
                  setEditingRow([]); // Exit edit mode when switching tabs
                  setEditedValues({});
                  setErrorMessage(null);
                }}
              >
                Reseñas
              </button>
            </div>
            {updateSubjectErrorMessage && (
              <div className="p-4 bg-red-100 text-red-700 text-sm shrink-0 border-b border-red-300 overflow-auto max-w-full break-words">
                <div className="flex items-start gap-2">
                  <CircleAlert className="min-w-[20px] h-5 w-5 mt-[2px]" />
                  <div className="mt-[2px] text-left break-words">
                    <strong className="block mb-1 break-words">
                      {updateSubjectErrorMessage.errorCode + ': ' + updateSubjectErrorMessage.error}
                    </strong>
                    {updateSubjectErrorMessage.details && updateSubjectErrorMessage.details.length > 0 &&
                      updateSubjectErrorMessage.details.map((detail: { name: string; success: boolean, error?: string | null }, idx: number) => (
                        <p key={idx + detail.name} className="break-words">• {`${detail.name}: ${detail.error || 'Sin errores'}`}</p>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {/* Info Panel */}
            {subjectMenu === 'info' && (
        <form action={updateSubjectDispatch} className="flex flex-col flex-grow min-h-0">
          {/* ... existing UI ... */}
           {/* Submit button for edits */}
            {isAnyRowEditing && (
              <div className="flex justify-end mb-2">
                <SubmitEditButton />
              </div>
            )}
          <table className="w-full text-sm text-slate-700 border border-[#DCEBFF] bg-white rounded-md shadow-sm">
            <tbody>
              {/* ... existing rows ... */}
              
              {/* Créditos */}
              <tr className="border-b border-[#DCEBFF]">
                <th className="text-left text-white bg-[#2C5AA0] px-3 py-2 font-semibold">Créditos</th>
                <td className="px-3 py-2 flex justify-between items-center">
                  {editingRow.includes('credits') ? (
                    <input
                      type="number"
                      name="credits"
                      value={editedValues.credits ?? selectedOption.info.credits}
                      onChange={handleInputChange}
                      className="w-full px-2 py-1 border rounded"
                      step="0.5"
                      min="0"
                    />
                  ) : (
                    <span>{selectedOption.info.credits}</span>
                  )}
                  <button
                    type="button"
                    onClick={() => toggleEdit('credits', selectedOption.info.credits)}
                    className="ml-2 p-1 rounded-full hover:bg-gray-100 transition"
                    title="Editar créditos"
                  >
                    {
                      editingRow.includes('year') ? (
                        <X className="w-4 h-4 text-red-600" />
                      ) : (
                        <Pencil className="w-4 h-4 text-blue-600" />
                      )
                    }
                  </button>
                </td>
              </tr>
              
              {/* Curso */}
              <tr className="border-b border-[#DCEBFF]">
                <th className="text-left text-white bg-[#2C5AA0] px-3 py-2 font-semibold">Curso</th>
                <td className="px-3 py-2 flex justify-between items-center">
                  {editingRow.includes('year') ? (
                    <select
                      name="year"
                      value={editedValues.year ?? selectedOption.info.year ?? ''}
                      onChange={handleInputChange as any}
                      className="w-full px-2 py-1 border rounded"
                    >
                      <option value="">Sin definir</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                    </select>
                  ) : (
                    <span>{selectedOption.info.year ?? 'Sin definir'}</span>
                  )}
                  <button
                    type="button"
                    onClick={() => toggleEdit('year', selectedOption.info.year)}
                    className="ml-2 p-1 rounded-full hover:bg-gray-100 transition"
                    title="Editar curso"
                  >
                    {
                              editingRow.includes('year') ? (
                                <X className="w-4 h-4 text-red-600" />
                              ) : (
                                <Pencil className="w-4 h-4 text-blue-600" />
                              )
                            }
                  </button>
                </td>
              </tr>
              
              {/* Cuatrimestre */}
              <tr className="border-b border-[#DCEBFF]">
                <th className="text-left text-white bg-[#2C5AA0] px-3 py-2 font-semibold">Cuadrimestre</th>
                <td className="px-3 py-2 flex justify-between items-center">
                  {editingRow.includes('quadri') ? (
                    <select
                      name="quadri"
                      value={editedValues.quadri ?? selectedOption.info.quadri ?? ''}
                      onChange={handleInputChange as any}
                      className="w-full px-2 py-1 border rounded"
                    >
                      <option value="">Sin definir</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                    </select>
                  ) : (
                    <span>{selectedOption.info.quadri ?? 'Sin definir'}</span>
                  )}
                  <button
                    type="button"
                    onClick={() => toggleEdit('quadri', selectedOption.info.quadri)}
                    className="ml-2 p-1 rounded-full hover:bg-gray-100 transition"
                    title="Editar cuatrimestre"
                  >
                    {
                              editingRow.includes('year') ? (
                                <X className="w-4 h-4 text-red-600" />
                              ) : (
                                <Pencil className="w-4 h-4 text-blue-600" />
                              )
                            }
                  </button>
                </td>
              </tr>
              
              {/* Profesores y emails */}
              <tr className="align-top">
                <th className="text-left text-white bg-[#2C5AA0] px-3 py-2 font-semibold">
                  <span className="flex items-center">
                    Profesores y emails
                    <MiniModal >
                      <p>Los emails de los profesores se muestran al hacer click en nombres de los profesores.</p>
                    </MiniModal>
                  </span>
                </th>
                <td className="px-3 py-2 flex items-start justify-between">
                  {editingRow.includes('professors') || editingRow.includes('emails') ? (
                    <div className="flex flex-col gap-2">
                      {(editedValues.professors || selectedOption.info.professors).map((professor: string, idx: number) => (
                        <div key={`edit-prof-${idx}`} className="flex items-center gap-2">
                          <input
                            type="text"
                            name={`professors[]`}
                            value={(editedValues.professors?.[idx] as string) ?? professor}
                            onChange={(e) => handleArrayInputChange(e, idx, 'professors')}
                            placeholder="Nombre del profesor"
                            className="grow px-2 py-1 border rounded"
                          />
                          <input
                            type="email"
                            name={`emails[]`}
                            value={(editedValues.emails?.[idx] as string) ?? (selectedOption.info.emails[idx] || '')}
                            onChange={(e) => handleArrayInputChange(e, idx, 'emails')}
                            placeholder="Email del profesor"
                            className="grow px-2 py-1 border rounded"
                          />
                          <button
                            type="button"
                            onClick={() => deleteArrayItem(idx)}
                            className="p-1 rounded-full text-red-600 hover:bg-red-100 transition"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          addArrayItem('professors');
                          addArrayItem('emails');
                        }}
                        className="mt-2 flex items-center justify-center gap-1 px-3 py-1 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200 transition"
                      >
                        <Plus className="w-4 h-4" /> Añadir profesor
                      </button>
                    </div>
                  ) : (
                    selectedOption.info.professors.length > 0 ? (
                      <ul className="list-decimal list-inside space-y-1">
                        {selectedOption.info.professors.map((professor: string, idx: number) => {
                          const email = selectedOption.info.emails[idx];
                          const isShowingEmail = emailToggles[idx] ?? false;

                          return (
                            <li
                              key={idx}
                              className="flex items-center gap-1 text-blue-600 text-xs bg-[#e6f0ff] rounded-lg p-1 break-all max-w-sm truncate cursor-pointer hover:bg-[#d0e6ff]"
                              onClick={() =>
                                setEmailToggles((prev) => ({ ...prev, [idx]: !prev[idx] }))
                              }
                            >
                              {isShowingEmail ? email ?? '(sin email)' : professor}
                              {isShowingEmail && <CopyToClipboard text={email ?? ''} />}
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      'Sin definir'
                    )
                  )}
                  <button
                    type="button"
                    onClick={() => toggleEdit('professors', selectedOption.info.professors)}
                    className="ml-2 p-1 rounded-full hover:bg-gray-100 transition"
                    title="Editar profesores y emails"
                  >
                    {
                              editingRow.includes('year') ? (
                                <X className="w-4 h-4 text-red-600" />
                              ) : (
                                <Pencil className="w-4 h-4 text-blue-600" />
                              )
                            }
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </form>
      )}
          </div>
        )}
      </div>
      <div className="p-5 bg-[#f4f9ff] border border-[#DCEBFF] hover:bg-[#EEF5FF] transition-[background-color] duration-300 rounded-2xl lg:max-w-[600px] flex flex-col gap-1">
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-700 leading-tight md:text-3xl">
          Dale tu puntuación a las asignaturas
        </h2>
        <div className="flex justify-center p-2">
          <div className="flex w-fit overflow-hidden rounded-full border border-gray-300 shadow-sm">
            <button
              onClick={() => setScoreType('qual')}
              className={`px-4 py-2 max-md:px-2 max-md:py-1 text-sm max-md:text-xs font-medium transition-colors duration-200 ${
                scoreType === 'qual'
                  ? 'bg-[#2C5AA0] text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Calidad
            </button>
            <button
              onClick={() => setScoreType('diff')}
              className={`px-4 py-2 max-md:px-2 max-md:py-1 text-sm max-md:text-xs font-medium transition-colors duration-200 ${
                scoreType === 'diff'
                  ? 'bg-[#2C5AA0] text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Dificultad
            </button>
          </div>
        </div>
        <form action={dispatch} className=" flex flex-col gap-2 mt-3">
          {
            isLoadingSubjects || !subjects ? (
              <div className="flex flex-col grow">
                <label htmlFor="options" className="flex items-center mb-1 text-slate-700 text-xs font-medium">Asignatura</label>
                <select
                  id="scoreOptions"
                  name="id"
                  value={scoreSelectedOptionId}
                  onChange={handleScoreSelectChange}
                  className="block w-full px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-[#DCEBFF] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2C5AA0] transition">
                  <option value="Seleccione una asignatura">Cargando...</option>
                </select>
              </div>
            ) : (
              <div className="flex flex-col grow">
                <label htmlFor="options" className="flex items-center mb-1 text-slate-700 text-xs font-medium">Asignatura</label>
                <select
                  id="scoreOptions"
                  name="id"
                  value={scoreSelectedOptionId}
                  onChange={handleScoreSelectChange}
                  className="block w-full px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-[#DCEBFF] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2C5AA0] transition">
                  <option value="Seleccione una asignatura">Seleccione una asignatura</option>
                  {
                    subjects.filter((subject) => subject.primitiveid !== '00000000').map((subject) => {
                      return (
                        <option key={subject.id + 'score'} value={subject.id}>{subject.name}</option>
                      )
                    })
                  }
                </select>
              </div>
            )
          }
          <div className="flex gap-3">
            <div className="flex flex-col">
              <div className="flex items-center mb-1 gap-1">
                <label className="text-slate-700 text-xs font-medium flex items-center">
                  Puntuación
                </label>
                <MiniModal >
                  <p>Puntuación de 0 a 10 con un decimal como máximo, la puntuación debe ser un múltiplo de 0.1.</p>
                </MiniModal>
              </div>
              <div className="flex gap-2">
                <input type="number" key={scoreType + scoreSelectedOptionId} name={`score`} min={0} max={10} step={0.1} disabled={scoreSelectedOptionId === 'Seleccione una asignatura'}
                  defaultValue={scoreSelectedOption ? (scoreType === 'qual' ? scoreSelectedOption.qual : scoreSelectedOption.diff) : ''}
                  className="block w-full px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-[#DCEBFF] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2C5AA0] transition"
                  required />
                <ScoreButton text="Puntuar" active={scoreSelectedOptionId !== 'Seleccione una asignatura'} />
              </div>
            </div>

          </div>
        </form>
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
        <div className="flex mt-5 flex-col">
          <p className="text-xl font-extrabold tracking-tight text-slate-700 leading-tight md:text-3xl">Ranking de asignaturas por {scoreType === 'qual' ? 'calidad' : 'dificultad'}</p>
          <div className="flex flex-col justify-between text-slate-700">
            <div className="flex justify-between">
              <div className="flex grow">
                <p className="flex justify-start items-center py-1 border-b border-[#2C5AA0]">Top</p>
                <p className="flex justify-start items-center grow pl-4 py-1 border-b border-[#2C5AA0]">Asignatura</p>
              </div>
              <p className="flex justify-start items-center pl-1 py-1 border-b border-[#2C5AA0]">Puntuación</p>
            </div>
            {
              isLoadingRanking || isLoadingPrimitive || isLoadingSubjects ? (
                <div className="flex justify-center items-center w-full min-h-[4rem]">
                  <div className="w-[40px] h-[30px]">
                    <Loader />
                  </div>
                </div>
              ) : (
                !ranking || !ranking[scoreType] || ranking[scoreType].length === 0 ? <p className="flex justify-center items-center w-full min-h-[4rem]">No hay datos</p>
                  :
                  <div className="flex bg-white justify-between max-h-[200px] overflow-scroll scrollbar-hidden">
                    <div className="flex grow">
                      <div className="flex flex-col">
                        {
                          ranking[scoreType].map((rankingItem, index) => {
                            if (index === 0) return <div key={index + 'award'} className="flex justify-center items-center pr-3 py-1 border-b border-[#dad3ff]"><Award className="text-[#FFD700]" /></div>
                            if (index === 1) return <div key={index + 'award'} className="flex justify-center items-center pr-3 py-1 border-b border-[#dad3ff]"><Award className="text-[#C0C0C0]" /></div>
                            if (index === 2) return <div key={index + 'award'} className="flex justify-center items-center pr-3 py-1 border-b border-[#dad3ff]"><Award className="text-[#CD7F32]" /></div>
                            return (
                              <p className="flex justify-center items-center pr-3 py-1 border-b border-[#dad3ff]" key={index + 'pos'}>{index + 1}</p>
                            )
                          })
                        }
                      </div>
                      <div className="flex flex-col grow">
                        {primitiveSubjects && !isLoadingPrimitive &&
                          ranking[scoreType].map((rankingItem, index) => {
                            const name = primitiveSubjects.find((subject) => subject.id === rankingItem.primitiveid)?.name
                            return (
                              <p className="pl-2 py-1 box-border shrink-0 border-b border-[#dad3ff] truncate" key={index + 'name'}>{name}</p>
                            )
                          })
                        }
                      </div>
                    </div>
                    <div className="flex flex-col">
                      {
                        ranking[scoreType].map(rankingItem => {
                          return (
                            <p className="py-1 border-b px-8 border-[#dad3ff]" key={rankingItem.primitiveid + 'score'}>{rankingItem.score}</p>
                          )
                        })
                      }
                    </div>
                  </div>
              )
            }
          </div>
        </div>
      </div>
    </section>
  )
}

function ScoreButton({ text, active }: { text?: string, active?: boolean }) {
  const { pending } = useFormStatus()

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (pending) {
      event.preventDefault()
    }
  }

  return (
    <button disabled={pending || !active} type="submit" onClick={handleClick} className={`${pending || !active ? 'opacity-30' : 'opacity-100'} w-full text-center p-1.5 py-2 rounded-md bg-[#2C5AA0] text-white text-xs font-medium close-modal-button transition-all duration-300 hover:bg-[#3A7BC4]`}>
      {pending ? 'Puntuando...' : text}
    </button>
  )
}

// New SubmitEditButton component to show form status
function SubmitEditButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit" // This button will submit the form it's nested within
      disabled={pending}
      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200
        ${pending ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white'}
      `}
    >
      {pending ? 'Guardando...' : 'Guardar Cambios'}
    </button>
  );
}