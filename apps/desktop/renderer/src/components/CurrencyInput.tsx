import { useEffect, useState, type ChangeEvent } from 'react';

function formatCurrency(value: number | null | undefined): string {
  if (value === undefined || value === null || Number.isNaN(value)) return '';
  return value.toLocaleString('es-CO');
}

interface CurrencyInputProps {
  value: number | null | undefined;
  onChange: (value: number | undefined) => void;
  className?: string;
  placeholder?: string;
}

export function CurrencyInput({ value, onChange, className, placeholder }: CurrencyInputProps) {
  const [text, setText] = useState(formatCurrency(value));

  useEffect(() => {
    setText(formatCurrency(value));
  }, [value]);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, '');
    if (!digits) {
      setText('');
      onChange(undefined);
      return;
    }
    const num = Number(digits);
    setText(num.toLocaleString('es-CO'));
    onChange(num);
  }

  return (
    <input
      inputMode="numeric"
      value={text}
      onChange={handleChange}
      placeholder={placeholder}
      className={className}
    />
  );
}
