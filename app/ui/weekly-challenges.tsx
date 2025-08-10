"use client";

import { useEffect, useRef, useState } from "react";
import { useWeeklyChallenges } from "../lib/use-weekly-challenges";
import { WeeklyChallenge } from "@/app/lib/definitions";
import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { deleteWeeklyChallenge } from "../lib/actions/weekly-challenges/actions";
import { addWeeklyChallengeAnswer } from "../lib/actions/weekly-challenge-answers/actions";
import { mutate } from "swr";
import { useWeeklyChallengeAnswers } from "../lib/use-weekly-challenge-answers";
import Loader from "./loader";
import { useUser } from "../lib/use-user";
import ErrorPage from "./error";
import { useRouter } from "next/navigation";
import ConfirmModal from "./confirm-modal";
import Latex from "react-latex-next";
import { LATEX_DELIMITERS } from "../lib/utils";









export default function WeeklyChallenges() {

  function normalize(str: string) {
  return str
    .normalize("NFD") // Decompose accents
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .toLowerCase(); // Make case-insensitive
}

function checkNonStrict(haystack: string, needle: string) {
  return normalize(haystack).includes(normalize(needle));
}


  const createWeeklyChallengeAnswer = async (_: unknown, formData: FormData) => {
    const answer = formData.get("answer")?.toString();

    const score = selectedChallenge?.strictanswer ? (selectedChallenge?.correctanswers.some(a => a.localeCompare(answer || "") === 0) ? 100 : 0) : selectedChallenge?.correctanswers.some(a => checkNonStrict(answer || "", a)) ? 100 : 0;
    formData.set("score", String(score));

    const result = await addWeeklyChallengeAnswer(formData)

    if (!result.error && result.data)
      mutate((process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL) + "/api/weekly-challenge-answers", result.data);
    return result;
  };


  const removeWeeklyChallenge = async (_currentState: unknown, formData: FormData) => {
    const result = await deleteWeeklyChallenge(formData);
    if (!result.error && result.data)
      mutate((process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL) + "/api/weekly-challenges", result.data);
    setIsDeleting(false)
    return result;
  };

  const [selectedChallenge, setSelectedChallenge] = useState<WeeklyChallenge | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | undefined>(undefined)
  const [errorMessage, setErrorMessage] = useState<{ error: string, errorCode: string, details: { name: string; success: boolean, error?: string | null }[] } | null>(null);
  const [deleteModal, setDeleteModal] = useState<boolean>(false);
  const [selectedSuggested, setSelectedSuggested] = useState<"existing" | "suggested">("existing");
  const [filteredWeeklyChallenges, setFilteredWeeklyChallenges] = useState<WeeklyChallenge[] | undefined>(undefined);
  const [isDeleting, setIsDeleting] = useState(false);

  const { weeklyChallenges, error: weeklyChallengesError, isLoading } = useWeeklyChallenges();
  const { weeklyChallengeAnswers, error: answerError, isLoading: answerIsLoading } = useWeeklyChallengeAnswers();
  const { user, error, isLoading: userIsLoading } = useUser();
  const [state, dispatch] = useFormState(createWeeklyChallengeAnswer, undefined);
  const [deleteState, dispatchDelete] = useFormState(removeWeeklyChallenge, undefined);
  const router = useRouter();

  const submittedAnswer = weeklyChallengeAnswers?.find((answer) => answer.challengeid === selectedChallenge?.id)

  function isDeadlineWithinNext7Days(challenge: WeeklyChallenge): boolean {
  if (!challenge.deadline) return false;

  const deadlineDate = new Date(challenge.deadline);
  const now = new Date();
  const oneWeekFromNow = new Date();
  oneWeekFromNow.setDate(now.getDate() + 7);

  return deadlineDate <= oneWeekFromNow;
}



  const indicatorRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    if (state?.data) {
    } else if (state?.error) {
      setErrorMessage({
        error: state.error,
        errorCode: state.errorCode ?? 'UNKNOWN_ERROR',
        details: state.details,
      });
    }
  }, [state, router, deleteModal,setErrorMessage]);

    useEffect(() => {
    if (deleteState?.data) {
      setDeleteModal(false);
    } else if (deleteState?.error) {
      setErrorMessage({
        error: deleteState.error,
        errorCode: deleteState.errorCode ?? 'UNKNOWN_ERROR',
        details: deleteState.details,
      });
    }
  }, [deleteState, router, setErrorMessage]);



  // 1. Update filteredWeeklyChallenges when source data changes
  useEffect(() => {
    if (!weeklyChallenges || !user) return;

    const filtered = (user.role === "admin" || user.role === "dev")
      ? selectedSuggested === "suggested"
        ? weeklyChallenges.filter((challenge) => challenge.suggested)
        : weeklyChallenges.filter((challenge) => !challenge.suggested)
      : weeklyChallenges.filter(
          (challenge) =>
            challenge.active &&
            isDeadlineWithinNext7Days(challenge) &&
            !challenge.suggested
        );

    setFilteredWeeklyChallenges(filtered);
  }, [selectedSuggested, user, weeklyChallenges]);

  // 2. Select the first challenge once filteredWeeklyChallenges updates
  useEffect(() => {
    if (filteredWeeklyChallenges && filteredWeeklyChallenges.length > 0) {
      setSelectedChallenge(filteredWeeklyChallenges[0]);
    }
  }, [filteredWeeklyChallenges]);




  useEffect(() => {
    if (!selectedChallenge || !indicatorRef.current) return;
    const activeEl = buttonRefs.current[selectedChallenge.id];
    if (activeEl) {
      indicatorRef.current.style.top = `${activeEl.offsetTop}px`;
      indicatorRef.current.style.height = `${activeEl.offsetHeight}px`;
    }
  }, [selectedChallenge, filteredWeeklyChallenges]);

  useEffect(() => {
    const answer = weeklyChallengeAnswers?.find((a) => a.challengeid === selectedChallenge?.id);
    if (answer) setSelectedAnswer(answer.answer);
  }, [weeklyChallengeAnswers, selectedChallenge]);

  const handleSelect = (challenge: WeeklyChallenge) => {
    setSelectedChallenge(challenge);
    setSelectedAnswer(null);
  };

  const onChangeSuggested = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSuggested(e.target.value as "existing" | "suggested");
  }

  if (error || weeklyChallengesError || answerError) return <ErrorPage error={error?.message || weeklyChallengesError?.message || answerError?.message} />;


  return (
    <>
      <div className="w-full h-full flex flex-col lg:flex-row">
        <aside className="w-full lg:w-[15%] pt-[90px] bg-white relative border-[#a19aff6b]">
          <div className="px-4 pb-2 hidden lg:flex">
            <h6 className="text-slate-700 text-sm font-semibold">DESAFÍOS SEMANALES</h6>
          </div>
          <div className="px-4 pb-3 hidden lg:block">
            <Link
              href="/gemif/weekly-challenges/add-weekly-challenge"
              className="block w-full text-center p-1.5 py-2 rounded-md bg-[#4A90E2] text-white text-xs font-medium transition hover:bg-[#3A7BC4]"
            >
              {user?.role === "admin" || user?.role === "dev" ? "Crear desafío" : "Sugerir desafío" }
            </Link>
          </div>
          { user?.role === "admin" || user?.role === "dev" &&
            <div className="flex flex-col grow px-4 pb-3">
              <select
                id="suggestedSelect"
                value={selectedSuggested}
                onChange={onChangeSuggested}
                className="block w-full px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-[#DCEBFF] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#4A90E2] transition"
              >
                <option value="existing">Desafíos existentes</option>
                <option value="suggested">Desafíos sugeridos</option>
              </select>
            </div>
          }
          <div className="relative flex gap-1 ml-3 pr-2 overflow-x-auto lg:overflow-visible flex-row lg:flex-col scroll-smooth scrollbar-thin scrollbar-thumb-blue-300">
            {/* Sliding indicator */}
            <div
              ref={indicatorRef}
              className="hidden lg:block absolute left-0 w-[4px] z-[11] bg-[#76aae6] rounded transition-all duration-300 ease-in-out opacity-0">

              </div> 
            {
              isLoading ? (
                <div className="flex justify-center items-center w-full min-h-[4rem]">
                  <div className="w-[40px] h-[30px]">
                    <Loader />
                  </div>
                </div>
              ) : (
                <>
                  {filteredWeeklyChallenges && filteredWeeklyChallenges.length > 0 ? filteredWeeklyChallenges.map((challenge, idx) => {
                    const isActive = selectedChallenge?.id === challenge.id;
                    return (
                      <button
                        key={challenge.id}
                        ref={(el: HTMLButtonElement | null) => {
                          if (el) {
                            buttonRefs.current[challenge.id] = el;
                            
                            if (isActive && indicatorRef.current) {
                              indicatorRef.current.style.top = `${el.offsetTop}px`;
                              indicatorRef.current.style.height = `${el.offsetHeight}px`;
                              indicatorRef.current.style.opacity = '1';
                            }
                          }
                        }}
                        onClick={() => handleSelect(challenge)}
                        className={`relative text-left min-w-max p-3 z-0
                          after:opacity-0 after:transition-opacity after:duration-500 after:delay-500
                          after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-full after:z-[1]
                          ${isActive ? "font-semibold text-blue-900 after:opacity-100 after:bg-[linear-gradient(to_right,#ddebfc,transparent)]" : ""}
                        `}
                      >
                        <div className="z-[10] relative max-w-[200px] truncate overflow-hidden text-sm text-slate-700 whitespace-nowrap">
                          <span className={`p-1 w-6 h-5 rounded-full text-white ${challenge.active && isDeadlineWithinNext7Days(challenge) && !(new Date(challenge.deadline ?? '') < new Date())  ? 'bg-gradient-to-br from-blue-400 to-blue-600' : 'bg-gradient-to-br from-red-400 to-red-600'} shadow text-sm font-semibold`}>{filteredWeeklyChallenges.length - idx}</span> {challenge.title}
                        </div>
                      </button>
        
                    );
                  }) : <p>No hay desafíos disponibles</p>}
                </>
              )
            }
            
          </div>
          <div className="ml-3 mt-2 lg:hidden">
            <Link
              href="/gemif/weekly-challenges/add-weekly-challenge"
              className="block text-center p-1.5 py-2 rounded-md bg-[#4A90E2] text-white text-xs font-medium transition hover:bg-[#3A7BC4]"
            >
              {user?.role === "admin" || user?.role === "dev" ? "Crear desafío" : "Sugerir desafío" }
            </Link>
          </div>
        </aside>

        <main className="flex-1 p-8 flex items-center justify-center overflow-y-auto">
          {!isLoading && selectedChallenge && !userIsLoading && user ? (
            <div className={`relative ${submittedAnswer ? (submittedAnswer.score > 0 ? "bg-[#dcfce7] hover:bg-[#d5ffe4]" : "bg-[#fee2e2] hover:bg-[#ffd9d9]") : "bg-[#f4f9ff] hover:bg-[#EEF5FF]"}
            max-w-2xl w-full border border-[#DCEBFF] transition rounded-2xl p-6`}>
              {submittedAnswer && (
                <div className={`absolute top-0 right-0 transform translate-x-1/4  rotate-45 text-white text-xs font-bold py-1 px-4 rounded-md shadow-md
                  ${submittedAnswer.score > 0 ? "bg-green-500" : "bg-red-500"}`}>
                  {submittedAnswer.score > 0 ? "Correcto" : "Incorrecto"}
                </div>
              )}

              <h2 className="text-2xl font-bold mb-2">{selectedChallenge.title}</h2>
              <p className="text-sm text-gray-500 mb-4">
                Dificultad: {"⭐".repeat(selectedChallenge.difficulty)}
                {selectedChallenge.deadline && (
                  <span> {' • '}Fecha límite: {new Date(selectedChallenge.deadline ?? '') < new Date() ? <span className="text-red-500">{new Date(selectedChallenge.deadline).toLocaleDateString() + " a las 00:00"}</span> : new Date(selectedChallenge.deadline).toLocaleDateString() + " a las 00:00"}</span>
                )}
              </p>

              <div className="mb-6 text-gray-800 overflow-auto max-w-full break-words">
                <div className="prose max-w-full whitespace-pre-wrap break-words">
                  <Latex delimiters={LATEX_DELIMITERS}>{selectedChallenge.description}</Latex>
                </div>
              </div>

              <form action={dispatch} className="flex flex-col gap-2">
                {selectedChallenge.ismultiplechoice && selectedChallenge.options?.length && selectedChallenge.options?.length > 0 ? (
                  <>
                    <input type="hidden" name="challengeid" value={selectedChallenge.id} />
                    <label className="text-slate-600">Seleccione una opción:</label>
                    <fieldset className="grid grid-cols-2 max-md:grid-cols-1  gap-2">
                      {selectedChallenge.options.map((option, idx) => (
                        <label
                          key={idx}
                          className={`${submittedAnswer && selectedChallenge?.correctanswers.some(a => a === option) ? "bg-green-300" : submittedAnswer && !selectedChallenge?.correctanswers.some(a => a === submittedAnswer.answer) && submittedAnswer.answer === option ? "bg-red-300" : "bg-white"} flex items-center justify-center rounded-md border border-[#e0e7ff] shadow-sm hover:shadow-md hover:border-blue-400 p-2 peer-checked:shadow-inner peer-checked:scale-95 peer-checked:border-blue-500 peer-checked:ring peer-checked:ring-blue-200 has-[input:checked]:scale-95 has-[input:checked]:shadow-inner has-[input:checked]:border-blue-500 has-[input:checked]:ring has-[input:checked]:ring-blue-200`}
                        >
                          <input
                            type="radio"
                            name="answer"
                            disabled={!!submittedAnswer || new Date(selectedChallenge.deadline ?? '') < new Date()}
                            value={option}
                            checked={selectedAnswer === option}
                            onChange={() => setSelectedAnswer(option)}
                            className="peer hidden"
                          />
                          <span>{option}</span>
                        </label>
                        
                      ))}
                    </fieldset>
                  </>
                ) : (
                  <>
                    <input type="hidden" name="challengeid" value={selectedChallenge.id} />
                    <p className="text-slate-600">Respuesta:</p> 

                  <input
                    type="text"
                    name="answer"
                    defaultValue={submittedAnswer !== undefined ? submittedAnswer.answer : ''}
                    disabled={submittedAnswer !== undefined || new Date(selectedChallenge.deadline ?? '') < new Date()}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                  <div className="flex flex-col gap-4">
                    <label className="text-slate-600 text-pretty">
                      {submittedAnswer !== undefined && selectedChallenge.correctanswers && (
                        (selectedChallenge.strictanswer
                          ? selectedChallenge.correctanswers.some(a => a.localeCompare(submittedAnswer.answer || "") === 0)
                          : selectedChallenge.correctanswers.some(a => checkNonStrict(submittedAnswer.answer || "", a)))
                          ? null : <p> Respuesta/s correcta/s: {selectedChallenge.correctanswers.join(", ")}</p>
                      )}
                    </label>
                  </div>
                  </>
                )}
                <div className="flex justify-around gap-1">
                  {
                    (user.role === 'dev' || user.role === 'admin') && (
                      <Link
                        href={`/gemif/weekly-challenges/edit-weekly-challenge/${selectedChallenge.id}`}
                        className="w-full text-center p-1.5 py-2 rounded-md bg-[#4A90E2] text-white text-xs font-medium transition hover:bg-[#3A7BC4]"
                      >
                        Editar desafío
                      </Link>
                    )
                  }
                  <SubmitButton disabled={(selectedChallenge.ismultiplechoice && !selectedAnswer) ||
          submittedAnswer !== undefined ||
          (selectedChallenge.deadline ? new Date(selectedChallenge.deadline) < new Date() : false)} />
                </div>
              </form>
              {
                (user.role === 'dev' || user.role === 'admin') && selectedChallenge?.id && (
                  <div className="flex flex-col gap-2 mt-4">
                    <DeleteButton setDeleteModal={setDeleteModal} />
                  </div>
                )
              }
            </div>
          ) : (
            <div className="flex justify-center items-center w-full min-h-[4rem]">
              <div className="w-[40px] h-[30px]">
                <Loader />
              </div>
            </div>
          )}
        </main>
      </div>
      {
        deleteModal && (
          <ConfirmModal
            title="¿Eliminar desafío?"
            subtitle="Esta seguro que desea eliminar este desafío? No se puede revertir."
            color="#ef4444"
            isLoading={isDeleting}
            onCancel={() => setDeleteModal(false)}
            onConfirm={() => {
              if (!selectedChallenge) return
              setIsDeleting(true)
              const formData = new FormData();
              formData.append("challengeid", selectedChallenge.id);
              dispatchDelete(formData);
            }}
          />
        )
      }
    </>
  );
}

// disabled={!filteredWeeklyChallenges || filteredWeeklyChallenges.length < 1 || !user}

function SubmitButton({ disabled }: { disabled: boolean}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className={`w-full text-center p-1.5 py-2 rounded-md bg-[#4A90E2] text-white text-xs font-medium transition hover:bg-[#3A7BC4] ${disabled || pending ? "pointer-events-none opacity-30" : ""
      }`}
    >
      {pending ? "Cargando..." : "Enviar"}
    </button>
  );
}

  function DeleteButton({ setDeleteModal }: { setDeleteModal: any }) {  
    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setDeleteModal(true)
    }
  
    return (
      <button onClick={handleClick} className={`w-full text-center p-1.5 py-2 rounded-md bg-red-600 text-white text-xs font-medium close-modal-button transition-all duration-300 hover:bg-red-700`}>
        Eliminar
      </button>
    )
  }