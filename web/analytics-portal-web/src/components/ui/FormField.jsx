import { useId } from 'react'

/**
 * Label, control and messages wired together for screen readers. Pass the control as a function to receive the
 * id and the aria attributes:
 *   <FormField label="Name" error={errors.name}>{(props) => <input {...props} />}</FormField>
 */
export default function FormField({ label, error, hint, children }) {
  const id = useId()
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined
  const controlProps = { id, 'aria-invalid': error ? true : undefined, 'aria-describedby': describedBy }

  return (
    <div className={`form-field${error ? ' has-error' : ''}`}>
      <label htmlFor={id}>{label}</label>
      {typeof children === 'function' ? children(controlProps) : children}
      {hint && !error && (
        <span id={`${id}-hint`} className="field-hint">
          {hint}
        </span>
      )}
      {error && (
        <span id={`${id}-error`} className="field-error" role="alert">
          {error}
        </span>
      )}
    </div>
  )
}
