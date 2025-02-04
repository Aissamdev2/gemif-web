'use client'
import { useSubjects } from "@/app/lib/use-subjects";
import { useUser } from "@/app/lib/use-user";
import SubjectTag from "@/app/ui/subject-tag";
import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { updateSubject, updateUser } from "@/app/lib/actions";
import { mutate } from "swr";
import { useRouter } from "next/navigation";
import { Subject } from "@/app/lib/definitions";
import { CircleUserRound } from "lucide-react";
import Loader from "@/app/ui/loader";


export default function Page() {
  const { subjects, error: subjectsError, isLoading: isLoadingSubjects } = useSubjects();
  const { user, error: userError, isLoading: isLoadingUser } = useUser();
  const router = useRouter()

  const changeSubjectColor = async (_currentState: unknown, formData: FormData) => {
    mutate((process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string) + "/api/subjects", await updateSubject(formData))
    return 'Subject updated'
  }

  const changeUserColor = async (_currentState: unknown, formData: FormData) => {
    mutate((process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string) + "/api/user", await updateUser(formData))
    return 'User updated'
  }



  const [resetColors, setResetColors] = useState(false)
  const [resetUserColor, setResetUserColor] = useState(false)
  const [colorsState, dispatchColors] = useFormState(changeSubjectColor, undefined)
  const [userColorState, dispatchUserColor] = useFormState(changeUserColor, undefined)
  const [selectedOption, setSelectedOption] = useState('Seleccione una asignatura');
  const [previewSubject, setPreviewSubject] = useState<Subject | undefined>(undefined)
  const [color, setColor] = useState<string>('#000000')

  useEffect(() => {
    if (colorsState === 'Subject updated') {
      router.refresh();
    } else if (colorsState === 'Failed to update subjects') {
    }
  }, [colorsState, router]);

  useEffect(() => {
    if (userColorState === 'User updated') {
      router.refresh();
    } else if (userColorState === 'Failed to update subjects') {
    }
  }, [userColorState, router]);

  useEffect(() => {
    if (!user) return
    setColor(user.color)
  },[user])

  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedOption(event.target.value)
    setPreviewSubject(subjects?.find((subject) => subject.name === event.target.value))
  }


  const handleColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPreviewSubject((prevState) => {
      if (!prevState) return prevState
      return {
        ...prevState,
        [event.target.name]: event.target.value
      }
    })
  }

  const handleUserColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setColor(event.target.value)
  }


  useEffect(() => {
    if (subjects) {
      const selected = subjects.find((subject) => subject.name === selectedOption)
      setPreviewSubject(selected)
    }
  }, [subjects, selectedOption, resetColors]);

  useEffect(() => {
    if (user) {
      setColor(user.color)
    }
  }, [user, resetUserColor]);

  
  const onSubmitColorForm = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!previewSubject) return
    const formData = new FormData(e.currentTarget);
    const keys = Object.keys(previewSubject);
    keys.forEach((key) => {
      formData.append(key, previewSubject[key as keyof Subject] as string);
    })
    dispatchColors(formData);
  }
  
  if (userError) return <div>Error: {userError}</div>
  if (subjectsError) return <div>Error: {subjectsError}</div>

  return (
    <div className="h-fit lg:h-full w-full flex bg-[#eaf3ff] py-3 text-gray-900 font-medium justify-center items-center">
      <div className="w-[95%] h-fit lg:h-[85%] lg:mt-5 flex flex-col grow lg:flex-row gap-10 lg:gap-10 justify-start px-1 lg:px-[60px]">
        <form onSubmit={onSubmitColorForm} className="flex flex-col p-5 grow shrink basis-1/2 bg-white rounded-lg gap-3">
          <p className="text-sm border-b px-2 py-2 border-[#5f3fbe61]">Colores de asignatura</p>
          <div className="flex flex-col lg:flex-row items-center gap-[50px]">
            {
              !subjects || isLoadingSubjects ? (
                <div className="flex flex-col gap-8 justify-evenly">
                <div className="flex flex-col">
                  <label htmlFor="options" className=" mb-2 text-sm font-medium text-gray-600 w-full">Asignatura</label>
                  <select 
                  id="options"
                  name="options"
                  value={selectedOption}
                  onChange={handleSelectChange}
                  className="block w-full  pl-4 pr-3.5 py-2.5 text-sm font-normal shadow-xs text-gray-900 bg-transparent border border-gray-200 rounded-lg placeholder-gray-400 focus:outline-none leading-relaxed">
                    <option value="Seleccione una asignatura">Cargando...</option>
                  </select>
                </div>
              </div>
              ) : (
              <div className="flex flex-col gap-8 justify-evenly">
                <div className="flex flex-col">
                  <label htmlFor="options" className=" mb-2 text-sm font-medium text-gray-600 w-full">Asignatura</label>
                  <select 
                  id="options"
                  name="options"
                  value={selectedOption}
                  onChange={handleSelectChange}
                  className="block w-full  pl-4 pr-3.5 py-2.5 text-sm font-normal shadow-xs text-gray-900 bg-transparent border border-gray-200 rounded-lg placeholder-gray-400 focus:outline-none leading-relaxed">
                    <option value="Seleccione una asignatura">Seleccione una asignatura</option>
                    {
                      subjects.map((subject) => {
                        return (
                          <option key={subject.id + 'color'} value={subject.name}>{subject.name}</option>
                        )
                      })
                    }
                  </select>
                </div>
                
                {
                  previewSubject&& (
                    <SubjectTag subject={previewSubject} />
                  )
                }
              </div>
              )
            }
            <div className="flex flex-row lg:flex-col gap-4">
              <div className='flex flex-col items-center'>
                <label className="flex  items-center mb-1 text-gray-600 text-xs font-medium">Color</label>
                <input onChange={handleColorChange} disabled={selectedOption === 'Seleccione una asignatura'} type="color" name="color" className="p-1 h-10 w-14 bg-white border border-gray-200 cursor-pointer rounded-lg disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700" id="color" value={previewSubject?.color || '#000000'} ></input>
              </div>
              <div className='flex flex-col items-center '>
                <label className="flex  items-center mb-1 text-gray-600 text-xs font-medium">Color de fondo</label>
                <input onChange={handleColorChange} disabled={selectedOption === 'Seleccione una asignatura'} type="color" name="bgcolor" className="p-1 h-10 w-14 bg-white border border-gray-200 cursor-pointer rounded-lg disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700" id="bgcolor" value={previewSubject?.bgcolor || '#000000'}  ></input>
              </div>
              <div className='flex flex-col items-center '>
                <label className="flex  items-center mb-1 text-gray-600 text-xs font-medium">Color de borde</label>
                <input onChange={handleColorChange} disabled={selectedOption === 'Seleccione una asignatura'} type="color" name="bordercolor" className="p-1 h-10 w-14 bg-white border border-gray-200 cursor-pointer rounded-lg disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700" id="bordercolor" value={previewSubject?.bordercolor || '#000000'} ></input>
              </div>
            </div>
          </div>
          <div className="flex gap-3 justify-center">
            <button type="button" disabled={!subjects || isLoadingSubjects} onClick={() => setResetColors(!resetColors)} className={`${!subjects || isLoadingSubjects? 'opacity-30': 'opacity-100'} w-full text-center p-1.5 py-2 rounded-md bg-red-600 text-white text-xs font-medium close-modal-button transition-all duration-300 hover:bg-red-700`}>
              Reestablecer colores
            </button>
            <UpdateButton disabled={!subjects || isLoadingSubjects}/>
          </div>
        </form>
        <form action={dispatchUserColor} className="flex flex-col p-5 grow shrink basis-1/2 bg-white rounded-lg gap-3">
          <p className="text-sm border-b px-2 py-2 border-[#5f3fbe61]">Color de perfil de usuario</p>
          <div className="flex lg:flex-row items-center justify-center gap-3">
            {
              !user || isLoadingUser ? (
                <div className="flex justify-center items-center">
                  <Loader />
                </div>
              ) : (
                <div className="flex justify-center items-center p-2 rounded-lg bg-gray-300">
                  <CircleUserRound className="w-12 h-12"
                  style={{ color: color || '#000000' }}
                  />
                </div>

              )
            }
              <div className='flex flex-col '>
                <label className="flex  items-center mb-1 text-gray-600 text-xs font-medium">Color</label>
                <input onChange={handleUserColorChange} type="color" name="userColor" className="p-1 h-10 w-14 bg-white border border-gray-200 cursor-pointer rounded-lg disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700"  value={color || '#000000'} ></input>
              </div>
          </div>
          <div className="flex gap-3 justify-center">
            <button type="button" disabled={!user || isLoadingUser} onClick={() => setResetUserColor(!resetUserColor)} className={`${!user || isLoadingUser ? 'opacity-30' : 'opacity-100'} w-full text-center p-1.5 py-2 rounded-md bg-red-600 text-white text-xs font-medium close-modal-button transition-all duration-300 hover:bg-red-700`}>
              Reestablecer color
            </button>
            <UpdateButton disabled={!user || isLoadingUser} />
          </div>
        </form>
      </div>
    </div>
  );
}

function UpdateButton({ disabled }: { disabled: boolean}) {
  const { pending } = useFormStatus()

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (pending) {
      event.preventDefault()
    }
  }

  return (
    <button aria-disabled={pending || disabled} type="submit" onClick={handleClick} className={`${pending || disabled ? 'opacity-30' : 'opacity-100'} w-full text-center p-1.5 py-2 rounded-md bg-indigo-600 text-white text-xs font-medium close-modal-button transition-all duration-300 hover:bg-indigo-700`}>
      Aplicar
    </button>
  )
}