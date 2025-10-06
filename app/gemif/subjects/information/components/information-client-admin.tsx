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

export default function InformationClientAdmin({
  primitiveSubjects,
}: {
  primitiveSubjects: PrimitiveSubject[];
}) {
  // When called by useActionState, handleSubmit receives (_currentState, formData)
  const handleSubmit = async (_currentState: unknown, formData: FormData) => {
  if (!selected) return;

  // Helper: detect change between original and edited value
  const hasValueChanged = (key: string, newVal: any) => {
    const orig = (selected as any)[key];

    // normalize undefined -> null for comparison stability
    const norm = (x: any) => (x === undefined ? null : x);

    // Compare arrays/objects by JSON, primitives by strict equality
    if (Array.isArray(orig) || Array.isArray(newVal) || typeof orig === "object" || typeof newVal === "object") {
      try {
        return JSON.stringify(norm(orig)) !== JSON.stringify(norm(newVal));
      } catch {
        return true;
      }
    }

    return norm(orig) !== norm(newVal);
  };

  // Append id always
  formData.append("id", String(selected.id));

  const finalPrimitiveSubject: PrimitiveSubject = selected;

  // Append only edited base fields that actually changed
  Object.entries(editedValues).forEach(([k, v]) => {
    if (v === undefined || typeof v === "function") return;

    // skip if value not changed compared to selected
    if (!hasValueChanged(k, v)) return;

    if (Array.isArray(v) || typeof v === "object") {
      formData.append(k, JSON.stringify(v));
    } else {
      formData.append(k, String(v));
    }
    (finalPrimitiveSubject as any)[k] = v;
  });


  // If info was edited, build final merged info object (preserve existing keys) and append it
  if (editedInfoEntries && editingRows.includes("info")) {
    const finalInfoObj: Record<string, string | string[]> = {};

    editedInfoEntries.forEach((e) => {
      const key = e.key?.trim();
      if (!key) return;
      const cleanedValues = (e.values ?? [])
        .map((v) => (v ?? "").trim())
        .filter((v) => v !== "");
      if (cleanedValues.length === 0) {
        // If user left this key with no values, remove it from final object
        delete finalInfoObj[key];
      } else if (cleanedValues.length === 1) {
        finalInfoObj[key] = cleanedValues[0];
      } else {
        finalInfoObj[key] = cleanedValues;
      }
    });

    finalPrimitiveSubject.info = finalInfoObj;
    formData.append("info", JSON.stringify(finalInfoObj));
  }

  // call server action
  const result = await updatePrimitiveSubject(formData);

  if (isSuccess(result)) {
    // reset local editing state
    setSelected(prev => ({ ...prev, ...finalPrimitiveSubject }))
    setEditingRows([]);
    setEditedValues({});
    setEditedInfoEntries([]);
    setHasChanges(false);
  }

  return result;
};

  const [selected, setSelected] = useState<PrimitiveSubject | null>(null);
  const [editingRows, setEditingRows] = useState<string[]>([]);
  const [editedValues, setEditedValues] = useState<Record<string, any>>({});
  const [editedInfoEntries, setEditedInfoEntries] = useState<InfoEntry[] | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const [errorMessage, setErrorMessage] = useState<SanitizedAppError | null>(null);
  const [state, dispatch, pending] = useActionState(handleSubmit, undefined);

  useEffect(() => {
    if (!state || isSuccess(state)) return
    setErrorMessage(state.error);
  }, [state]);


  // Reset editing state when selection changes
  useEffect(() => {
    setEditingRows([]);
    setEditedValues({});
    setEditedInfoEntries([]);
    setHasChanges(false);

    const footer = document.querySelector<HTMLElement>("#footer");

    if (selected) {
      footer?.style.setProperty("display", "none");
    } else {
      footer?.style.removeProperty("display");
    }
  }, [selected]);



  // Track whether there are any edited values or info edits
  useEffect(() => {
    const hasEditedValues = Object.keys(editedValues).length > 0;
    const hasEditedInfo = !!editedInfoEntries;
    setHasChanges(hasEditedValues || hasEditedInfo);
  }, [editedValues, editedInfoEntries]);

  // toggleEdit: open/close editing mode for a field. When opening, prefill editedValues with current value
  const toggleEdit = (field: string, currentValue?: any) => {
    if (editingRows.includes(field)) {
      // turn off edit
      setEditingRows((prev) => prev.filter((f) => f !== field));
      setEditedValues((prev) => {
        const newValues = { ...prev };
        delete newValues[field];
        return newValues;
      });
      // if closing info, clear edited info entries
      if (field === "info") {
        setEditedInfoEntries([]);
      }
    } else {
      // turn on edit
      setEditingRows((prev) => [...prev, field]);

      // initialize editedValues for simple fields
      if (field === "professors") {
        setEditedValues((prev) => ({
          ...prev,
          professors: currentValue?.professors ?? selected?.professors ?? [],
          emails: currentValue?.emails ?? selected?.emails ?? [],
        }));
      } else if (field === "credits" || field === "year" || field === "quadri") {
        setEditedValues((prev) => ({
          ...prev,
          [field]: currentValue ?? selected?.[field] ?? "",
        }));
      } else {
        // generic fallback
        setEditedValues((prev) => ({
          ...prev,
          [field]: currentValue ?? (selected as any)?.[field] ?? "",
        }));
      }

      // if opening info, initialize edited info entries from selected.info
      if (field === "info" && selected) {
        const entries = Object.entries(selected.info ?? {}).map(([k, v]) => {
          if (Array.isArray(v)) {
            return { key: k, values: v.map((x) => String(x ?? "")) };
          } else {
            return { key: k, values: [String(v ?? "")] };
          }
        });
        // ensure at least one empty row to add new keys easily
        setEditedInfoEntries(entries.length > 0 ? entries : [{ key: "", values: [""] }]);
      }
    }
  };

  // handle base input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    let parsedValue: any = value;
    if (type === "number") {
      parsedValue = value === "" ? "" : Number(value);
    }
    setEditedValues((prev) => ({
      ...prev,
      [name]: parsedValue,
    }));
  };

  // Professors/emails edit helpers
  const handleProfessorChange = (
    index: number,
    field: "professors" | "emails",
    value: string
  ) => {
    setEditedValues((prev) => {
      const updated = { ...prev };
      const arr = [...(updated[field] ?? [])];
      arr[index] = value;
      updated[field] = arr;
      return updated;
    });
  };

  const addProfessorEmail = () => {
    setEditedValues((prev) => ({
      ...prev,
      professors: [...(prev.professors ?? selected?.professors ?? []), ""],
      emails: [...(prev.emails ?? selected?.emails ?? []), ""],
    }));
  };

  const deleteProfessorEmail = (index: number) => {
    setEditedValues((prev) => {
      const updated = { ...prev };
      updated.professors = (prev.professors ?? selected?.professors ?? []).filter(
        (_: any, i: number) => i !== index
      );
      updated.emails = (prev.emails ?? selected?.emails ?? []).filter(
        (_: any, i: number) => i !== index
      );
      return updated;
    });
  };

  // Info editing helpers (array of entries so key renaming is possible)
  const handleInfoKeyChange = (index: number, key: string) => {
    setEditedInfoEntries((prev) => {
      if (!prev) return prev;
      const copy = [...prev];
      copy[index] = { ...copy[index], key };
      return copy;
    });
  };

  // Change a single value in an entry (valueIndex selects which value in the array)
  const handleInfoValueChange = (entryIndex: number, valueIndex: number, value: string) => {
    setEditedInfoEntries((prev) => {
      if (!prev) return prev;
      const copy = [...prev];
      const values = [...(copy[entryIndex]?.values ?? [])];
      values[valueIndex] = value;
      copy[entryIndex] = { ...copy[entryIndex], values };
      return copy;
    });
  };

  const addInfoRow = () => {
    setEditedInfoEntries((prev) => {
      if (!prev) return [{ key: "", values: [""] }];
      return [...prev, { key: "", values: [""] }]
    });
  };
  const deleteInfoRow = (index: number) => {
    setEditedInfoEntries((prev) => {
      if (!prev) return prev;
      return prev.filter((_, i) => i !== index)
    })
  };

  // Add a new value input to a specific entry
  const addValueToEntry = (entryIndex: number) => {
    setEditedInfoEntries((prev) => {
      if (!prev) return prev;
      const copy = [...prev];
      const values = [...(copy[entryIndex]?.values ?? [])];
      values.push("");
      copy[entryIndex] = { ...copy[entryIndex], values };
      return copy;
    });
  };

  // Delete a specific value input from an entry
  const deleteValueFromEntry = (entryIndex: number, valueIndex: number) => {
    setEditedInfoEntries((prev) => {
      if (!prev) return prev;
      const copy = [...prev];
      const values = [...(copy[entryIndex]?.values ?? [])].filter((_, i) => i !== valueIndex);
      copy[entryIndex] = { ...copy[entryIndex], values };
      return copy;
    });
  };


  return (
    <div className="flex flex-col h-full w-full overflow-hidden gap-2">
      <SubjectCombobox primtiveSubjects={primitiveSubjects} setSelected={setSelected} />
      {selected ? (
        <ScrollShadow className="flex flex-col gap-3">
          <form
            action={dispatch}
            className={`${editingRows.length > 0 ? "bg-blue-100" : ""} rounded transition-colors p-2 sm:p-3 flex flex-col gap-4 grow`}
          >
            <input type="hidden" name="id" value={selected.id} />
            {errorMessage && (
              <ErrorPopup error={errorMessage} onClose={() => setErrorMessage(null)} />
            )}
            
            {/* Basic Information Section */}
            <div className="flex flex-col gap-2 text-body">
              <p className="text-muted">
                Información básica
                {editingRows.length > 0 && (
                  <span className="text-blue-500"> (Modo edición)</span>
                )}
              </p>

              <div className="border border-border bg-surface rounded-md shadow-sm overflow-hidden">
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
                  <div className="px-3 py-2 flex justify-between items-center gap-2 bg-white">
                    {editingRows.includes("credits") ? (
                      <input
                        type="number"
                        name="credits"
                        value={editedValues.credits ?? selected.credits ?? ""}
                        onChange={handleChange}
                        className="input input-sm w-full max-w-[200px]"
                        step="0.5"
                        min="0"
                      />
                    ) : (
                      <span className="">{selected.credits}</span>
                    )}
                    <button
                      type="button"
                      onClick={() => toggleEdit("credits", selected.credits)}
                      className="p-1 rounded-full hover:bg-gray-100 transition flex-shrink-0"
                      title="Editar créditos"
                    >
                      {editingRows.includes("credits") ? (
                        <X className="w-4 h-4 text-red-600" />
                      ) : (
                        <Pencil className="w-4 h-4 text-blue-600" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Curso Row */}
                <div className="grid grid-cols-1 sm:grid-cols-[minmax(100px,_150px)_1fr] border-b border-border">
                  <div className="bg-primary text-text-on-accent px-3 py-2 flex items-center">
                    Curso
                  </div>
                  <div className="px-3 py-2 flex justify-between items-center gap-2 bg-white">
                    {editingRows.includes("year") ? (
                      <input
                        type="number"
                        name="year"
                        value={editedValues.year ?? selected.year ?? ""}
                        onChange={handleChange}
                        className="input input-sm w-full max-w-[200px]"
                      />
                    ) : (
                      <span className="">{selected.year ?? "Sin definir"}</span>
                    )}
                    <button
                      type="button"
                      onClick={() => toggleEdit("year", selected.year)}
                      className="p-1 rounded-full hover:bg-gray-100 transition flex-shrink-0"
                      title="Editar curso"
                    >
                      {editingRows.includes("year") ? (
                        <X className="w-4 h-4 text-red-600" />
                      ) : (
                        <Pencil className="w-4 h-4 text-blue-600" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Cuatrimestre Row */}
                <div className="grid grid-cols-1 sm:grid-cols-[minmax(100px,_150px)_1fr] border-b border-border">
                  <div className="bg-primary text-text-on-accent px-3 py-2 flex items-center">
                    Cuatrimestre
                  </div>
                  <div className="px-3 py-2 flex justify-between items-center gap-2 bg-white">
                    {editingRows.includes("quadri") ? (
                      <input
                        type="number"
                        name="quadri"
                        value={editedValues.quadri ?? selected.quadri ?? ""}
                        onChange={handleChange}
                        className="input input-sm w-full max-w-[200px]"
                      />
                    ) : (
                      <span className="">{selected.quadri ?? "Sin definir"}</span>
                    )}
                    <button
                      type="button"
                      onClick={() => toggleEdit("quadri", selected.quadri)}
                      className="p-1 rounded-full hover:bg-gray-100 transition flex-shrink-0"
                      title="Editar cuatrimestre"
                    >
                      {editingRows.includes("quadri") ? (
                        <X className="w-4 h-4 text-red-600" />
                      ) : (
                        <Pencil className="w-4 h-4 text-blue-600" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Profesores y correos Row */}
                <div className="grid grid-cols-1 sm:grid-cols-[minmax(100px,_150px)_1fr]">
                  <div className="bg-primary text-text-on-accent px-3 py-2 flex items-center">
                    Profesores y correos
                  </div>
                  <div className="px-3 py-2 bg-white">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div className="flex-1 w-full">
                        {editingRows.includes("professors") ? (
                          <div className="flex flex-col gap-2">
                            {(editedValues.professors ?? selected.professors ?? []).map(
                              (prof: string, idx: number) => (
                                <div key={idx} className="flex flex-col sm:flex-row gap-2">
                                  <input
                                    type="text"
                                    value={prof ?? ""}
                                    onChange={(e) =>
                                      handleProfessorChange(idx, "professors", e.target.value)
                                    }
                                    className="input input-sm flex-1"
                                    placeholder="Profesor"
                                  />
                                  <input
                                    type="email"
                                    value={(editedValues.emails ?? selected.emails ?? [])[idx] ?? ""}
                                    onChange={(e) =>
                                      handleProfessorChange(idx, "emails", e.target.value)
                                    }
                                    className="input input-sm flex-1"
                                    placeholder="Correo"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => deleteProfessorEmail(idx)}
                                    className="p-1 rounded-full hover:bg-gray-100 self-center"
                                  >
                                    <Trash2 className="w-4 h-4 text-red-600" />
                                  </button>
                                </div>
                              )
                            )}
                            <button type="button" onClick={addProfessorEmail} className="btn btn-ghost text-sm">
                              <Plus className="w-4 h-4" /> Añadir profesor
                            </button>
                          </div>
                        ) : selected.professors?.length > 0 ? (
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
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleEdit("professors", selected)}
                        className="p-1 rounded-full hover:bg-gray-100 transition flex-shrink-0"
                        title="Editar profesores"
                      >
                        {editingRows.includes("professors") ? (
                          <X className="w-4 h-4 text-red-600" />
                        ) : (
                          <Pencil className="w-4 h-4 text-blue-600" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Extra Information Section */}
            <div className="flex flex-col gap-2 text-body">
              <div className="flex justify-between items-end">
                <p className="text-muted">
                  Información extra
                  {editingRows.includes("info") && <span className="text-blue-500"> (Modo edición)</span>}
                </p>

                <button
                  type="button"
                  onClick={() => toggleEdit("info", null)}
                  className="p-1 rounded-full hover:bg-gray-100 transition"
                  title="Editar información extra"
                >
                  {editingRows.includes("info") ? (
                    <X className="w-4 h-4 text-red-600" />
                  ) : (
                    <Pencil className="w-4 h-4 text-blue-600" />
                  )}
                </button>
              </div>

              <div className="border border-border bg-surface rounded-md shadow-sm overflow-hidden">
                {editingRows.includes("info") ? (
                  <>
                    {editedInfoEntries && editedInfoEntries.map((entry, idx) => (
                      <div key={idx} className="grid grid-cols-1 sm:grid-cols-[minmax(100px,_150px)_1fr] border-b border-border">
                        <div className="bg-primary px-3 py-2 flex items-center">
                          <input
                            type="text"
                            value={entry.key}
                            onChange={(e) => handleInfoKeyChange(idx, e.target.value)}
                            className="input input-sm w-full bg-gray-700 text-text-on-accent"
                            placeholder="Nombre del campo"
                          />
                        </div>

                        <div className="px-3 py-2 bg-white">
                          <div className="flex flex-col gap-2">
                            {(entry.values ?? []).map((val, vi) => (
                              <div key={vi} className="flex gap-2">
                                <textarea
                                  rows={1}
                                  value={val}
                                  onChange={(e) => handleInfoValueChange(idx, vi, e.target.value)}
                                  className="input input-sm w-full resize-none"
                                  placeholder="Información adicional"
                                />
                                <button
                                  type="button"
                                  onClick={() => deleteValueFromEntry(idx, vi)}
                                  className="p-1 rounded-full hover:bg-gray-100 flex-shrink-0"
                                  title="Eliminar información"
                                >
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </button>
                              </div>
                            ))}
                            <div className="flex items-center justify-between">
                              <button
                                type="button"
                                onClick={() => addValueToEntry(idx)}
                                className="btn btn-ghost"
                              >
                                <Plus className="w-4 h-4" /> Añadir valor
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteInfoRow(idx)}
                                className="p-1 rounded-full hover:bg-gray-100"
                                title="Eliminar campo"
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="px-3 py-2 bg-white">
                      <button
                        type="button"
                        onClick={addInfoRow}
                        className="btn btn-ghost"
                      >
                        <Plus className="w-4 h-4" /> Añadir campo
                      </button>
                    </div>
                  </>
                ) : (
                  (() => {
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
                  })()
                )}
              </div>
            </div>

            {/* Save button */}
            {editingRows.length > 0 && (
              <div className="flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={!hasChanges}
                  className={`btn btn-primary btn-md ${hasChanges ? "" : "opacity-60"}`}
                >
                  {pending ? 'Cargando...' : 'Guardar cambios' }
                </button>
              </div>
            )}
          </form>
          
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
