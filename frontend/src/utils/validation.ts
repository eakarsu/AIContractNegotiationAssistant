type Validator = (value: any) => string | undefined;

export const required = (msg = 'This field is required'): Validator => (v) =>
  v === undefined || v === null || v === '' ? msg : undefined;

export const email = (msg = 'Invalid email address'): Validator => (v) =>
  v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? msg : undefined;

export const minLength = (n: number, msg?: string): Validator => (v) =>
  v && v.length < n ? (msg || `Must be at least ${n} characters`) : undefined;

export const maxLength = (n: number, msg?: string): Validator => (v) =>
  v && v.length > n ? (msg || `Must be at most ${n} characters`) : undefined;

export const matches = (field: string, msg = 'Fields do not match'): Validator => (v, values?: any) =>
  values && v !== values[field] ? msg : undefined;

export type ValidationSchema = Record<string, Validator[]>;

export function validateField(value: any, validators: Validator[], allValues?: any): string | undefined {
  for (const validator of validators) {
    const error = validator(value, allValues);
    if (error) return error;
  }
  return undefined;
}

export function validateAll(values: Record<string, any>, schema: ValidationSchema): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const [field, validators] of Object.entries(schema)) {
    const error = validateField(values[field], validators, values);
    if (error) errors[field] = error;
  }
  return errors;
}
