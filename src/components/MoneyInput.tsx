import type { InputProps } from "antd";
import NumberInput from "./NumberInput";

interface MoneyInputProps extends Omit<InputProps, "value" | "onChange"> {
  value?: string;
  onChange?: (value: string) => void;
}

// Currency input for Toman amounts: grouped Persian numerals while typing, raw ASCII integer
// to the form/API. Thin semantic wrapper over NumberInput with grouping on. Use this for every
// money field (CONTEXT — Toman is an integer on the wire; ADR 0007).
export default function MoneyInput(props: MoneyInputProps) {
  return <NumberInput {...props} group />;
}
