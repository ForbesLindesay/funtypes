import type { RuntypeBase } from './runtype';
import show from './show';
import showValue from './showValue';

export function success<T>(value: T): Success<T> {
  return { success: true, value };
}

export function failure(
  message: string,
  options: Omit<Failure, 'success' | 'message'> = {},
): Failure {
  return { success: false, message, ...options };
}
export function expected(
  expected: RuntypeBase | string,
  value: unknown,
  options: Omit<Failure, 'success' | 'message'> = {},
): Failure {
  return failure(
    `Expected ${typeof expected === 'string' ? expected : show(expected)}, but was ${showValue(
      value,
    )}`,
    options,
  );
}

/**
 * A successful validation result.
 */
export type Success<T> = {
  /**
   * A tag indicating success.
   */
  success: true;

  /**
   * The original value, cast to its validated type.
   */
  value: T;
};

/**
 * A failed validation result.
 */
export type Failure = {
  /**
   * A tag indicating failure.
   */
  success: false;

  /**
   * A message indicating the reason validation failed.
   */
  message: string;

  fullError?: FullError;

  /**
   * A key indicating the location at which validation failed.
   */
  key?: string;
};

export type FullError = [string, ...FullError[]];

/**
 * The result of a type validation.
 */
export type Result<T> = Success<T> | Failure;

export function showError(failure: Omit<Failure, 'success'>): string {
  return failure.fullError
    ? showFullError(failure.fullError)
    : failure.key
    ? `${failure.message} in ${failure.key}`
    : failure.message;
}
export function showFullError([title, ...children]: FullError, indent: string = ''): string {
  return [`${indent}${title}`, ...children.map(e => showFullError(e, `${indent}  `))].join('\n');
}
