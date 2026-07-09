import type { FormInstance } from "antd";
import type { ZodError } from "zod";
import type { ApiError } from "./errors";
import { fieldErrorMessage } from "./strings";

// Bridge between Zod validation and Ant Design forms (the locked "Ant forms + Zod"
// decision). Ant handles layout + required-on-blur; Zod is the source of truth on submit.
// This maps a ZodError's issues onto the matching form fields so errors render inline.
export function applyZodErrors(form: FormInstance, error: ZodError): void {
  form.setFields(
    error.issues.map((issue) => ({
      name: issue.path as (string | number)[],
      errors: [issue.message],
    })),
  );
}

// Map a backend VALIDATION_ERROR's `fields` map ({ field: [code, ...] }, FRONTEND_API §2.2)
// onto the matching form fields, translating each code to Persian. Returns true if it placed
// any field error, so callers can fall back to a form-level message for non-field errors.
export function applyApiFieldErrors(form: FormInstance, error: ApiError): boolean {
  if (!error.fields) return false;
  const entries = Object.entries(error.fields);
  if (entries.length === 0) return false;
  form.setFields(
    entries.map(([name, codes]) => ({
      name,
      errors: codes.map(fieldErrorMessage),
    })),
  );
  return true;
}
