import { User } from "@/app/lib/definitions"
import { useSurveys } from "@/app/lib/use-surveys"
import { useUser } from "@/app/lib/use-user";
import Loader from "@/app/ui/loader";
import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom"


export default function SurveyPage() {
  const { user, error: userError, isLoading: isLoadingUser } = useUser();
  const { surveys, error: surveysError, isLoading: isLoadingSurveys } = useSurveys();
  const [surveysState, setSurveysState] = useState<Record<string, string[]>>({})
  const [multi, setMulti] = useState<Record<string,boolean>>({});


  const emptyState = () => {
    let temp: Record<string, string[]> = {};
    surveys?.forEach((survey) => {
      temp = {...temp, [survey.surveyInfo.id]: []}
    })
    return temp;
  }

  useEffect(() => {
    if (!surveys) return;
    setMulti((prevState) => {
      let newState = prevState;
      surveys.forEach(survey => {
        newState = {...newState, [survey.surveyInfo.id]: survey.surveyInfo.multi};
      })
      return newState;
    })
  }, [surveys])

  useEffect(() => {
    if (!surveys || !user) return;
    setSurveysState((prevState) => {
      let newState = prevState;
      surveys.forEach(survey => {
        newState = {...newState, [survey.surveyInfo.id]: survey.surveyOptions.filter((option) => option.votedid.includes(user?.id)).map((option) => option.id)};
      })
      return newState;
    });
  }, [surveys, user, user?.id])
  

  const handleMultiChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked } = event.target as HTMLInputElement
    setSurveysState((prevState) => {
      if (!prevState) return prevState;
      return {
        ...prevState,
        [name]: checked ? [...prevState[name], value] : prevState[name].filter((id) => id !== value)
      }
    })
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked } = event.target as HTMLInputElement
    let empty = emptyState();
    empty[name] = checked ? [value] : [];
    setSurveysState(empty)
  }

  const handleSubmit = (surveyid: string) => {
    
  }

  return (
    <section className="z-50 w-full h-full flex flex-col lg:mb-0 px-2 lg:px-10 gap-24 pt-[80px] pb-[20px] lg:gap-12 lg:flex-row">
      <div className="p-5 grow bg-white rounded-2xl flex flex-col gap-4">
        <h2>Encuestas</h2>
        <AddButton />
        {
          !surveys || isLoadingSurveys || !surveysState ? (
            <div className="w-full flex justify-center items-center">
              <Loader />
            </div>
          ) : (
            surveys.length > 0 && (
            <div className="w-full h-full flex flex-col lg:flex-row overflow-scroll scrollbar-hidden">
              {
                surveys.map((survey) => {
                  return (
                    <form key={survey.surveyInfo.id} onSubmit={() => { handleSubmit(survey.surveyInfo.id) }} className="flex p-2 flex-col gap-1">
                      <p className="font-bold text-lg">{survey.surveyInfo.name}</p>
                      { multi[survey.surveyInfo.id] ?
                        survey.surveyOptions.map((option) => {
                          return (
                            <div key={option.id} title={option.name} className="flex items-center">
                              <input checked={surveysState[survey.surveyInfo.id].includes(option.id)} id={option.id} type="checkbox" name={survey.surveyInfo.id} value={option.id} onChange={handleMultiChange} className="w-[21.6px] h-[21.6px] appearance-none border cursor-pointer border-gray-300  rounded-md mr-2 hover:border-indigo-500 checked:bg-no-repeat checked:bg-center checked:border-indigo-500 checked:bg-indigo-100"/>
                              <label htmlFor={option.id} className="text-sm font-norma cursor-pointer truncate max-w-[200px] text-gray-600">{option.name}</label>
                            </div>
                          )
                        }) : (
                          survey.surveyOptions.map((option) => {
                            return (
                              <div key={option.id} title={option.name} className="flex items-center">
                                <input checked={surveysState[survey.surveyInfo.id].includes(option.id)} id={option.id} type="radio" name={survey.surveyInfo.id} value={option.id} onChange={handleChange} className="w-[21.6px] h-[21.6px] appearance-none border cursor-pointer border-gray-300  rounded-md mr-2 hover:border-indigo-500 checked:bg-no-repeat checked:bg-center checked:border-indigo-500 checked:bg-indigo-100"/>
                                <label htmlFor={option.id} className="text-sm font-norma cursor-pointer truncate max-w-[200px] text-gray-600">{option.name}</label>
                              </div>
                            )
                          })
                        )
                      }
                      <SubmitButton />
                    </form>
                  )
                })
              }
            </div>
            )
          )
        }
      </div>
    </section>
  )
}


function AddButton() {
  const { pending } = useFormStatus()

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (pending) {
      event.preventDefault()
    }
  }

  return (
    <button  type="submit" onClick={handleClick} className={` w-full text-center p-1.5 py-2 rounded-md bg-indigo-600 text-white text-xs font-medium close-modal-button transition-all duration-300 hover:bg-indigo-700`}>
      Crear encuesta
    </button>
  )
}

function SubmitButton() {
  const { pending } = useFormStatus()

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (pending) {
      event.preventDefault()
    }
  }

  return (
    <button type="submit" onClick={handleClick} className={` w-full text-center p-1.5 py-2 rounded-md bg-indigo-600 text-white text-xs font-medium close-modal-button transition-all duration-300 hover:bg-indigo-700`}>
      Enviar respuesta
    </button>
  )
}