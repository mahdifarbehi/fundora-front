import type { ChangeEvent } from "react";
import { Input } from "antd";
import type { InputProps } from "antd";
import { toEnglishDigits, toPersianDigits } from "../lib/digits";
import { formatNumber } from "../lib/money";

interface NumberInputProps extends Omit<InputProps, "value" | "onChange"> {
  value?: string;
  onChange?: (value: string) => void;
  /** Thousands grouping for currency (e.g. ۱٬۰۰۰٬۰۰۰). Off for plain counts. */
  group?: boolean;
}

// Numeric text input that DISPLAYS Persian numerals (optionally grouped) while the value
// handed to the form — and thus to Zod and the API — is always a raw ASCII integer string
// (ADR 0007). Used as the child of an Ant `Form.Item`, which injects `value`/`onChange`.
export default function NumberInput({ value, onChange, group = false, ...rest }: NumberInputProps) {
  const display = value ? (group ? formatNumber(Number(value)) : toPersianDigits(value)) : "";

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const ascii = toEnglishDigits(e.target.value)
      .replace(/\D/g, "") // keep digits only
      .replace(/^0+(?=\d)/, ""); // drop leading zeros
    onChange?.(ascii);
  };

  return <Input {...rest} inputMode="numeric" value={display} onChange={handleChange} />;
}
