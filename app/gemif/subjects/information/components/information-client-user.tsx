"use client";

import { PrimitiveSubject } from "@/db/schema";
import { useActionState, useEffect, useState } from "react";
import { Pencil, X, Plus, Trash2 } from "lucide-react";
import { updatePrimitiveSubject } from "../actions/actions";
import { SanitizedAppError } from "@/lib/errors/types";
import { isSuccess } from "@/lib/errors/result";
import ErrorPopup from "@/app/ui/error-popup";
import EmailItem from "./email-item";
import SubjectCombobox from "../../components/subject-combobox";
import ScrollShadow from "./scroll-shadow";
import InfoBox from "@/app/components/info-box";
import Footer from "@/app/ui/footer/footer";

type InfoEntry = { key: string; values: string[] };

export default function InformationClientUser({
  primitiveSubjects,
}: {
  primitiveSubjects: PrimitiveSubject[];
}) {
  
  const [selected, setSelected] = useState<PrimitiveSubject | null>(null);

  // Reset editing state when selection changes
  useEffect(() => {
    const footer = document.querySelector<HTMLElement>("#footer");

    if (selected) {
      footer?.style.setProperty("display", "none");
    } else {
      footer?.style.removeProperty("display");
    }
  }, [selected]);

  return (
    <div className="flex flex-col h-full w-full overflow-hidden gap-2">
      <SubjectCombobox primtiveSubjects={primitiveSubjects} setSelected={setSelected} />
      {selected ? (
        <ScrollShadow className="flex flex-col gap-3">
          <div
            className={`rounded transition-colors p-2 sm:p-3 flex flex-col gap-4 grow`}
          >            
            {/* Basic Information Section */}
            <div className="flex flex-col gap-2 text-body">
              <div className="border border-border bg-surface rounded-md shadow-sm overflow-hidden">

                <div className="grid grid-cols-1 sm:grid-cols-[minmax(100px,_150px)_1fr] border-b border-border">
                  <div className="bg-primary text-text-on-accent px-3 py-2 flex items-center">
                    Código
                  </div>
                  <div className="px-3 py-2 bg-white">{selected.id}</div>
                </div>

                {/* Nombre Row */}
                <div className="grid grid-cols-1 sm:grid-cols-[minmax(100px,_150px)_1fr] border-b border-border">
                  <div className="bg-primary text-text-on-accent px-3 py-2 flex items-center">
                    Nombre
                  </div>
                  <div className="px-3 py-2 bg-white">{selected.name}</div>
                </div>

                {/* Créditos Row */}
                <div className="grid grid-cols-1 sm:grid-cols-[minmax(100px,_150px)_1fr] border-b border-border">
                  <div className="bg-primary text-text-on-accent px-3 py-2 flex items-center">
                    Créditos
                  </div>
                  <div className="px-3 py-2 bg-white">{selected.credits}</div>
                </div>

                {/* Curso Row */}
                <div className="grid grid-cols-1 sm:grid-cols-[minmax(100px,_150px)_1fr] border-b border-border">
                  <div className="bg-primary text-text-on-accent px-3 py-2 flex items-center">
                    Curso
                  </div>
                  <div className="px-3 py-2 bg-white">{selected.year}</div>
                </div>

                {/* Cuatrimestre Row */}
                <div className="grid grid-cols-1 sm:grid-cols-[minmax(100px,_150px)_1fr] border-b border-border">
                  <div className="bg-primary text-text-on-accent px-3 py-2 flex items-center">
                    Cuatrimestre
                  </div>
                  <div className="px-3 py-2 bg-white">{selected.quadri}</div>
                </div>

                {/* Profesores y correos Row */}
                <div className="grid grid-cols-1 sm:grid-cols-[minmax(100px,_150px)_1fr]">
                  <div className="bg-primary text-text-on-accent px-3 py-2 flex items-center">
                    Profesores y correos
                  </div>
                  <div className="px-3 py-2 bg-white">
                    {
                      selected.professors?.length > 0 ? (
                        <ul className="list-none space-y-2">
                          {selected.professors.map((prof, idx) => (
                            <EmailItem
                              key={idx}
                              prof={prof}
                              email={selected.emails[idx]}
                            />
                          ))}
                        </ul>
                      ) : (
                        <span className="text-muted">Sin definir</span>
                      )
                    }
                  </div>
                </div>
              </div>
            </div>

            {/* Extra Information Section */}
            <div className="flex flex-col gap-2 text-body">
              <div className="border border-border bg-surface rounded-md shadow-sm overflow-hidden">
                  {(() => {
                    const infoEntries = Object.entries(selected.info ?? {});
                    if (infoEntries.length === 0) {
                      return (
                        <div className="px-3 py-2 text-text-secondary bg-white">
                          Sin información adicional
                        </div>
                      );
                    }
                    return infoEntries.map(([k, v], idx) => (
                      <div key={idx} className="grid grid-cols-1 sm:grid-cols-[minmax(100px,_150px)_1fr] border-b border-border last:border-b-0">
                        <div className="bg-primary text-text-on-accent px-3 py-2 break-words flex items-center">
                          {k}
                        </div>
                        <div className="px-3 py-2 bg-white">
                          {Array.isArray(v) ? (
                            <ul className="flex flex-col gap-1">
                              {v.map((vv: string, i: number) => (
                                <li key={i} className="border border-border rounded px-2 py-1 bg-surface-hover break-words">
                                  {vv.split("\n").map((line, idx) => (
                                    <span key={idx + line}>
                                      {line}
                                      {idx < vv.split("\n").length - 1 && <br />}
                                    </span>
                                  ))}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <span className="break-words">
                              {v.split("\n").map((line, idx) => (
                                <span key={idx}>
                                  {line}
                                  {idx < v.split("\n").length - 1 && <br />}
                                </span>
                              ))}
                            </span>
                          )}
                        </div>
                      </div>
                    ));
                  })()}
              </div>
            </div>

            {/* Save button */}
          </div>
          
          <div className="p-2">
            <InfoBox important>
              La información mostrada en esta página puede no ser completamente precisa o encontrarse desactualizada. Para consultar datos oficiales y actualizados, le recomendamos visitar la página oficial correspondiente.
            </InfoBox>
          </div>
          {
            selected && (
              <Footer />
            )
          }
        </ScrollShadow>
      ): (
        <div className="flex flex-col items-center justify-center h-48 text-center text-muted px-4">
          <p className="mb-2 text-sm">Seleccione una asignatura para ver su información.</p>
          <p >Si la asignatura que busca no aparece, es posible que no haya sido añadida a la base de datos aún.</p>
        </div>
      )}
    </div>
  );
}
