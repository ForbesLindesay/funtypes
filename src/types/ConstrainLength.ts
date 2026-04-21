import { expected } from '../result';
import { Codec, showType, showValue } from '../runtype';
import { Constraint } from './constraint';

/**
 * The range to constrain the length to.
 */
export interface ConstrainLengthOptions {
  /**
   * The minimum length (inclusive).
   *
   * @default 0
   */
  min?: number;
  /**
   * The maximum length (inclusive).
   *
   * @default Number.MAX_SAFE_INTEGER
   */
  max?: number;
}
/**
 * Ensure the length of a value is within the specified range.
 * This can apply to strings, arrays, or any other type with a
 * length property of type `number`.
 */
export function ConstrainLength<T extends { readonly length: number }>(
  base: Codec<T>,
  { min = 0, max = Number.MAX_SAFE_INTEGER }: ConstrainLengthOptions = {},
): Codec<T> {
  if (min >= max) {
    throw new Error(`Expected min (${showValue(min)}) to be less than max (${showValue(max)})`);
  }
  if (min < 0) {
    throw new Error(`Expected min (${showValue(min)}) to be greater than or equal to 0`);
  }
  if (max > Number.MAX_SAFE_INTEGER) {
    throw new Error(
      `Expected max (${showValue(
        max,
      )}) to be less than or equal to Number.MAX_SAFE_INTEGER (${showValue(
        Number.MAX_SAFE_INTEGER,
      )})`,
    );
  }

  return Constraint(
    base,
    value => {
      if (value.length < min || value.length > max) {
        return expected(
          `length to be between ${showValue(min)} and ${showValue(max)}`,
          value.length,
        );
      }
      return true;
    },
    {
      name: `ConstrainLength<${showType(base)}, ${showValue(min)}-${showValue(max)}>`,
      options: { min, max },
    },
  );
}
