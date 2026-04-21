import { expected } from '../result';
import { Codec, showValue } from '../runtype';
import { Constraint } from './constraint';
import { String } from './primitive';

/**
 * A date represented as a string in the form "yyyy-mm-dd"
 */
export type DateStringValue = `${number}-${number}-${number}`;

/**
 * A range to constrain dates to
 */
export interface DateStringOptions {
  /**
   * The minimum date (inclusive)
   */
  min?: DateStringValue;
  /**
   * The maximum date (inclusive)
   */
  max?: DateStringValue;
}

/**
 * Validate a string is a valid date in the form "yyyy-mm-dd"
 */
export function DateString({
  min = '0000-01-01',
  max = '9999-12-30',
}: DateStringOptions = {}): Codec<DateStringValue> {
  if (!isValidDateString(min)) {
    throw new Error(
      `Expected min (${showValue(min)}) to be a valid date string in the form "yyyy-mm-dd"`,
    );
  }
  if (!isValidDateString(max)) {
    throw new Error(
      `Expected max (${showValue(max)}) to be a valid date string in the form "yyyy-mm-dd"`,
    );
  }
  if (min >= max) {
    throw new Error(`Expected min (${showValue(min)}) to be less than max (${showValue(max)})`);
  }
  return Constraint(
    String,
    value => {
      if (!isValidDateString(value) || value < min || value > max) {
        return expected(
          `a date in form "yyyy-mm-dd" between ${showValue(min)} and ${showValue(max)}`,
          value,
        );
      }
      return true;
    },
    { name: `DateString`, options: { min, max } },
  );
}

function isValidDateString(str: string): str is DateStringValue {
  if (!(typeof str === 'string' && /^\d\d\d\d-\d\d-\d\d$/.test(str))) {
    return false;
  }
  const date = new Date(str);
  if (Number.isNaN(date.getTime())) return false;
  return date.toISOString().split(`T`)[0] === str;
}
