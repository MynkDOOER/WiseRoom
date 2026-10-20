import { useId } from "react";
export default function TextField({ label, hint, error, id, ref, className = "", ...props }) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const describedBy = [hint && `${inputId}-hint`, error && `${inputId}-error`, props["aria-describedby"]].filter(Boolean).join(" ") || undefined;
  return <div className="ui-field"><label htmlFor={inputId}>{label}</label><input {...props} ref={ref} id={inputId} className={className} aria-describedby={describedBy} aria-invalid={error ? true : undefined}/>{hint && <p id={`${inputId}-hint`} className="field-hint">{hint}</p>}{error && <p id={`${inputId}-error`} className="form-error" role="alert">{error}</p>}</div>;
}
