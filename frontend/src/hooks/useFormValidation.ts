import { useState, useCallback } from 'react';
import { ValidationSchema, validateField, validateAll } from '../utils/validation';

export function useFormValidation(schema: ValidationSchema) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());

  const validateOne = useCallback((field: string, value: any, allValues?: any) => {
    const validators = schema[field];
    if (!validators) return;
    const error = validateField(value, validators, allValues);
    setErrors(prev => {
      const next = { ...prev };
      if (error) next[field] = error;
      else delete next[field];
      return next;
    });
  }, [schema]);

  const touch = useCallback((field: string) => {
    setTouched(prev => new Set(prev).add(field));
  }, []);

  const validateForm = useCallback((values: Record<string, any>): boolean => {
    const allErrors = validateAll(values, schema);
    setErrors(allErrors);
    setTouched(new Set(Object.keys(schema)));
    return Object.keys(allErrors).length === 0;
  }, [schema]);

  const getError = useCallback((field: string): string | undefined => {
    return touched.has(field) ? errors[field] : undefined;
  }, [errors, touched]);

  const reset = useCallback(() => {
    setErrors({});
    setTouched(new Set());
  }, []);

  return { errors, validateOne, validateForm, getError, touch, reset };
}
