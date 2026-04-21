import { expected, failure } from '../result';
import { Codec, showValue } from '../runtype';
import { Constraint } from './constraint';
import { Number as N } from './primitive';

/**
 * A range to constrain integers to
 */
export interface IntegerOptions {
  /**
   * The minimum integer (inclusive)
   *
   * @default Number.MIN_SAFE_INTEGER
   */
  min?: number;
  /**
   * The maximum integer (inclusive)
   *
   * @default Number.MAX_SAFE_INTEGER
   */
  max?: number;
}

/**
 * An integer within an optional range
 */
export function Integer({
  min = Number.MIN_SAFE_INTEGER,
  max = Number.MAX_SAFE_INTEGER,
}: IntegerOptions = {}): Codec<number> {
  if (min !== Math.floor(min)) {
    throw new Error(`Expected min (${showValue(min)}) to be an integer`);
  }
  if (max !== Math.floor(max)) {
    throw new Error(`Expected max (${showValue(max)}) to be an integer`);
  }
  if (min < Number.MIN_SAFE_INTEGER) {
    throw new Error(
      `Expected min (${showValue(
        min,
      )}) to be greater than or equal to Number.MIN_SAFE_INTEGER (${showValue(
        Number.MIN_SAFE_INTEGER,
      )})`,
    );
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
  if (min >= max) {
    throw new Error(`Expected min (${showValue(min)}) to be less than max (${showValue(max)})`);
  }
  return Constraint(
    N,
    value => {
      if (Number.isNaN(value)) {
        return failure(`NaN is not a valid number`);
      }
      if (value !== Math.floor(value) || value > max || value < min) {
        return expected(`an integer between ${showValue(min)} and ${showValue(max)}`, value);
      }
      return true;
    },
    { name: `Integer`, options: { min, max } },
  );
}
