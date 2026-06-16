interface FieldErrorProps {
  message?: string;
}

export function FieldError({ message }: FieldErrorProps) {
  if (!message) return null;
  return (
    <p style={{ color: 'var(--color-text-danger)', fontSize: '12px', marginTop: '4px' }}>
      {message}
    </p>
  );
}
