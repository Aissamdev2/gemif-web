'use client'

import { useFormStatus } from 'react-dom'
import { useActionState } from 'react'
import { addWeeklyChallenge } from '@/app/lib/actions/weekly-challenges/actions'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { mutate } from 'swr'
import { CircleAlert, Crosshair, X } from 'lucide-react'
import { useUser } from '../lib/use-user'
import ErrorPage from './error'
import Loader from './loader'
import MiniModal from './mini-modal'
import { LATEX_DELIMITERS } from '../lib/utils'

export default function AddWeeklyChallengeForm() {
  const createWeeklyChallenge = async (_: unknown, formData: FormData) => {
    const options = formData.getAll('options[]') as string[]
    const optionsString = options.join(',')

    if (isMultipleChoice) {
      formData.set('correct_answers', selectedCorrect || '')
    } else {
      const correct_answers = formData.getAll('correct_answers[]') as string[]
      const correctAnswersString = correct_answers.join(',')
      formData.set('correct_answers', correctAnswersString)
    }

    formData.set('active', (user?.role !== 'dev' && user?.role !== 'admin') ? 'false' : formData.get('active')?? '')
    formData.set('is_multiple_choice', isMultipleChoice.toString())
    formData.set('options', optionsString)
    formData.set('suggested', (user?.role !== 'dev' && user?.role !== 'admin').toString())

    const result = await addWeeklyChallenge(formData)

    if (!result.error && result.data)
      await mutate(`${process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL}/api/weekly-challenges`, result.data)
    return result
  }

  const [state, dispatch] = useActionState(createWeeklyChallenge, undefined)
  const [errorMessage, setErrorMessage] = useState<{ error: string, errorCode: string, details: { name: string; success: boolean, error?: string | null }[] } | null>(null);
  const [isMultipleChoice, setIsMultipleChoice] = useState(false)
  const [selectedCorrect, setSelectedCorrect] = useState<string | null>(null)
  const [options, setOptions] = useState<string[]>([''])
  const [answers, setAnswers] = useState<string[]>([''])
  const router = useRouter()
  const { user, isLoading, error } = useUser({});

  useEffect(() => {
    if (state?.data) {
      router.back();
    } else if (state?.error) {
      setErrorMessage({
        error: state.error,
        errorCode: state.errorCode ?? 'UNKNOWN_ERROR',
        details: state.details,
      });
    }
  }, [state, router, setErrorMessage]);

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options]
    newOptions[index] = value
    setOptions(newOptions)
  }

  const addOption = () => {
    setOptions([...options, ''])
  }

  const removeOption = (index: number) => {
    const newOptions = options.filter((_, i) => i !== index)
    setOptions(newOptions)
  }

  const handleAnswerChange = (index: number, value: string) => {
    const newAnswers = [...answers]
    newAnswers[index] = value
    setAnswers(newAnswers)
  }

  const addAnswer = () => {
    setAnswers([...answers, ''])
  }

  const removeAnswer = (index: number) => {
    const newAnswers = answers.filter((_, i) => i !== index)
    setAnswers(newAnswers)
  }

  if (error) return <ErrorPage error={error?.message} />

  return (
    <form
      action={dispatch}
      className="starting:scale-[0] scale-[1] transition-[transform] duration-300 w-full max-w-3xl h-[90vh] flex flex-col bg-white rounded-xl shadow-xl overflow-hidden"
    >
      <div className="p-4 border-b border-gray-200 shrink-0">
        <h4 className="text-lg font-bold text-gray-900 text-center">{ user ? (user?.role === 'dev' || user?.role === 'admin' ? 'Crear desafío' : 'Sugerir desafío') : 'Cargando...'}</h4>
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

      {/* Scrollable content */}
      <div className='flex-1 overflow-y-auto p-6 flex flex-col gap-6'>
        { isLoading ? (
          <div className="flex justify-center items-center w-full min-h-[4rem]">
            <div className="w-[40px] h-[30px]">
              <Loader />
            </div>
          </div>     
          ) : ( !user ? <p className="text-lg font-bold text-gray-900 text-center">No se ha encontrado el usuario</p>
          :
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left column */}
          <div className="flex flex-col gap-4 w-full lg:w-1/2">
            <div>
              <label className="flex items-center mb-1 text-gray-600 text-xs font-medium">Título <span className='text-red-500'>*</span></label>
              <input
                name="title"
                type="text"
                placeholder="Título del desafío"
                className="block w-full px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-[#DCEBFF] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2C5AA0] transition"
              />
            </div>

            <div>
              <label className="flex items-center mb-1 text-gray-600 text-xs font-medium">Dificultad (1-5) <span className='text-red-500'>*</span></label>
              <input
                name="difficulty"
                type="number"
                min="1"
                max="5"
                defaultValue="3"
                className="block w-full px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-[#DCEBFF] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2C5AA0] transition"
              />
            </div>

            <div>
              <label className="flex items-center mb-1 text-gray-600 text-xs font-medium">Fecha límite <span className='text-red-500'>*</span></label>
              <input
                name="deadline"
                type="date"
                className="block w-full px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-[#DCEBFF] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2C5AA0] transition"
              />
            </div>

            <div>
              <div className="flex items-center mb-1 gap-1">
                <label className="text-gray-600 text-xs font-medium flex items-center">
                  Descripción <span className='text-red-500'>*</span>
                </label>
                <MiniModal position="top">
                  <div>
                    <p>Para abrir modo ecuación LaTeX se puede usar:</p>
                    <ul className="flex flex-col items-start gap-[2px]">
                      {LATEX_DELIMITERS.map((delimiter, idx) => (
                        <li
                          key={idx}
                          className="text-blue-600 text-xs bg-[#e6f0ff] rounded-lg p-1 break-all max-w-sm truncate"
                        >
                          {delimiter.left}
                        </li>
                      ))}
                    </ul>
                  </div>
                </MiniModal>
              </div>
          
              <textarea
                name="description"
                placeholder="Enuncia el desafío"
                className="block w-full px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-[#DCEBFF] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2C5AA0] transition"
              />
            </div>
            {
              (user?.role === 'dev' || user?.role === 'admin') && (
                <div>
                  <label className="flex items-center mb-1 text-gray-600 text-xs font-medium gap-2">
                    ¿Visible?
                    <Toggle name="active" />
                  </label>
                </div>
              )
            }
          </div>
          {/* Right column */}
          <div className="flex flex-col gap-4 w-full lg:w-1/2">
            <div>
              <label className="flex items-center mb-1 text-gray-600 text-xs font-medium gap-2">
                ¿Es de opción múltiple?
                <Toggle checked={isMultipleChoice} onChange={(e) => setIsMultipleChoice(e.target.checked)} />
              </label>
            </div>

            {isMultipleChoice && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Opciones</h3>
                {options.map((opt, i) => (
                  <div key={i} className={`${selectedCorrect === opt ? 'bg-green-200' : ''} p-1 rounded-md flex items-center gap-2 mb-2`}>
                    <input
                      type="text"
                      name={`options[]`}
                      value={opt}
                      onChange={(e) => handleOptionChange(i, e.target.value)}
                      className="block w-full px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-[#DCEBFF] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2C5AA0] transition"
                      placeholder={`Opción ${i + 1}`}
                    />
                    {options.length > 1 && (
                      <>
                        <button
                          title='Seleccionar como correcta'
                          type="button"
                          onClick={() => setSelectedCorrect(opt)}
                          className="text-green-500 hover:text-green-600 text-sm"
                        >
                          <Crosshair className="w-4 h-4" />
                        </button>
                        <button
                          title='Eliminar'
                          type="button"
                          onClick={() => removeOption(i)}
                          className="text-red-500 hover:text-red-600 text-sm"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addOption}
                  className="text-blue-500 text-xs font-medium hover:underline"
                >
                  + Añadir opción
                </button>
              </div>
            )}
            
            {
              !isMultipleChoice &&
                <>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Respuestas</h3>
                    {answers.map((opt, i) => (
                      <div key={i} className="flex items-center gap-2 mb-2">
                        <input
                          type="text"
                          name={`correct_answers[]`}
                          value={opt}
                          onChange={(e) => handleAnswerChange(i, e.target.value)}
                          className="block w-full px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-[#DCEBFF] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2C5AA0] transition"
                          placeholder={`Respuesta ${i + 1}`}
                        />
                        {answers.length > 1 && (
                          <button
                            title='Eliminar'
                            type="button"
                            onClick={() => removeAnswer(i)}
                            className="text-red-500 hover:text-red-600 text-sm"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addAnswer}
                      className="text-blue-500 text-xs font-medium hover:underline"
                    >
                      + Añadir respuesta
                    </button>
                  </div>
                  <div className='flex items-center mb-1 gap-1'>
                    <label htmlFor='strict' className="flex items-center  text-gray-600 text-xs font-medium gap-2">
                      ¿Comprobación estricta?
                      <Toggle id='strict' name="strict_answer" />
                    </label>
                    <MiniModal position='top'>
                      <p>Comprobación estricta significa que la respuesta debe ser exactamente la esperada (sin tener en cuenta mayúsculas ni tildes). Comprobación no estricta, sin embargo, significa que la respuesta esperada solo debe estar contenida en la respuesta proporcionada por el usuario.</p>
                    </MiniModal>
                  </div>
                </>
            }
          </div>
        </div>
        )}
      </div>

      {/* Bottom fixed footer */}
      <div className="p-4 border-t border-gray-200 flex items-center justify-end gap-3 shrink-0">
        <button onClick={() => router.back()} type="button"
          className="w-full text-center p-1.5 py-2 rounded-md bg-white text-black text-xs font-medium transition-all duration-300 border hover:border-gray-400"
          data-pd-overlay="#modalBox-3" data-modal-target="modalBox-3">
          Cancelar
        </button>
        <SubmitButton disabled={!user || isLoading} text={user?.role === 'dev' || user?.role === 'admin' ? 'Crear' : 'Sugerir'} />
      </div>
    </form>
  )
}

function SubmitButton({ disabled, text }: { disabled: boolean, text: string }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className={`${disabled || pending ? 'pointer-events-none opacity-30' : 'opacity-100'} w-full text-center p-1.5 py-2 rounded-md bg-[#2C5AA0] text-white text-xs font-medium close-modal-button transition-all duration-300 hover:bg-[#3A7BC4]`}
    >
      {pending ? 'Cargando...' : text}
    </button>
  )
}

function Toggle({
  id,
  name,
  checked,
  onChange,
}: {
  id?: string,
  name?: string
  checked?: boolean
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
}) {
  return (
    <div className="relative">
      <input
        type="checkbox"
        id={id}
        name={name}
        checked={checked}
        onChange={onChange}
        value="true"
        className="sr-only peer"
      />
      <div className="w-10 h-5 bg-gray-300 rounded-full peer-checked:bg-blue-600 transition-colors duration-300"></div>
      <div
        className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-md 
        transition-transform duration-300 peer-checked:translate-x-5"
      ></div>
    </div>
  )
}
