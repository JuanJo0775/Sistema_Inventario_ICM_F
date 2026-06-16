const SKU_REGEX = /^[A-Za-z]{1,4}-\d{1,4}$/;

interface SkuInputProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
}

export function SkuInput({
  value,
  onChange,
  id = "sku",
  label,
  error,
  disabled = false,
}: SkuInputProps) {
  const errorId = error ? `${id}-error` : undefined;
  const hasError = error || (value && !SKU_REGEX.test(value));

  return (
    <div>
      {label && (
        <label className="f-label" htmlFor={id}>
          {label}
        </label>
      )}
      <input
        id={id}
        className={`f-input sku-input ${hasError ? "sku-input--error" : ""}`}
        type="text"
        inputMode="text"
        placeholder="AB-123"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        aria-label={label || "SKU"}
        aria-invalid={!!hasError}
        aria-describedby={errorId}
        autoComplete="off"
      />
      <p className={`f-note ${hasError ? "f-note--err" : ""}`} id={errorId} role={error ? "alert" : undefined}>
        {error || "Formato: 1–4 letras + guion + 1–4 dígitos. Ej: AB-123"}
      </p>
    </div>
  );
}
