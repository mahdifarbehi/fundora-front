import { useEffect, useState } from "react";
import { Flex, Select } from "antd";
import NumberInput from "./NumberInput";
import {
  isoToJalaliParts,
  jalaliPartsToIso,
  type JalaliParts,
} from "../lib/jalali";
import { strings } from "../lib/strings";

interface Props {
  value?: string; // ISO/UTC — the canonical value handed to the form and the API (ADR 0004)
  onChange?: (value?: string) => void;
  showTime?: boolean;
}

// A plain field-entry Jalali date (and optional time) input — day / month / year boxes, not a
// calendar popup. Displays Persian digits + month names; emits a Gregorian/UTC ISO string.
// Used as the child of an Ant `Form.Item`, which injects value/onChange.
export default function JalaliDateTimeInput({ value, onChange, showTime = false }: Props) {
  const [parts, setParts] = useState<JalaliParts>(() => isoToJalaliParts(value));

  // Resync from external value changes (form reset / initialValues). Skips when the current
  // parts already produce `value`, so typing doesn't fight this effect.
  useEffect(() => {
    if (value !== jalaliPartsToIso(parts, showTime)) {
      setParts(isoToJalaliParts(value));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const setPart = (key: keyof JalaliParts, ascii: string) => {
    const next = { ...parts, [key]: ascii };
    setParts(next);
    onChange?.(jalaliPartsToIso(next, showTime));
  };

  return (
    <Flex gap="small" wrap align="center">
      <NumberInput
        value={parts.jd}
        onChange={(v) => setPart("jd", v)}
        placeholder={strings.dateInput.day}
        style={{ width: 70 }}
      />
      <Select
        value={parts.jm || undefined}
        onChange={(v) => setPart("jm", v)}
        placeholder={strings.dateInput.month}
        style={{ width: 120 }}
        options={strings.jalaliMonths.map((name, i) => ({ value: String(i + 1), label: name }))}
      />
      <NumberInput
        value={parts.jy}
        onChange={(v) => setPart("jy", v)}
        placeholder={strings.dateInput.year}
        style={{ width: 90 }}
      />

      {showTime && (
        <>
          <span style={{ opacity: 0.5 }}>—</span>
          <NumberInput
            value={parts.hh}
            onChange={(v) => setPart("hh", v)}
            placeholder={strings.dateInput.hour}
            style={{ width: 70 }}
          />
          <span>:</span>
          <NumberInput
            value={parts.mm}
            onChange={(v) => setPart("mm", v)}
            placeholder={strings.dateInput.minute}
            style={{ width: 70 }}
          />
          <span>:</span>
          <NumberInput
            value={parts.ss}
            onChange={(v) => setPart("ss", v)}
            placeholder={strings.dateInput.second}
            style={{ width: 70 }}
          />
        </>
      )}
    </Flex>
  );
}
