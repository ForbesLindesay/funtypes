import { expected } from '../result';
import { Codec, showValue } from '../runtype';
import { Constraint } from './constraint';
import { String } from './primitive';

const A_IS_SMALLER = -1;
const B_IS_SMALLER = 1;
const EQUAL = 0;

interface SplitNumber {
  isNegative: boolean;
  magnitude: string;
}
export interface IntegerStringOptions {
  min?: string;
  max?: string;
}
export function IntegerString({ min, max }: IntegerStringOptions = {}): Codec<`${number}`> {
  const sMin = validateInput(min, 'min');
  const sMax = validateInput(max, 'max');
  if (sMin && sMax && compare(sMin, sMax) !== A_IS_SMALLER) {
    throw new Error(`Expected min (${showValue(min)}) to be less than max (${showValue(max)})`);
  }
  return Constraint(
    String,
    value => {
      if (!isValid(value, sMin, sMax)) {
        return expected(
          sMin && sMax
            ? `an integer string between ${showValue(min)} and ${showValue(max)}`
            : sMin
              ? `an integer string greater than or equal to ${showValue(min)}`
              : sMax
                ? `an integer string less than or equal to ${showValue(max)}`
                : `an integer string`,
          value,
        );
      }
      return true;
    },
    { name: `IntegerString`, options: { min, max } },
  );
}
function validateInput(value: string | undefined, name: 'min' | 'max'): SplitNumber | undefined {
  if (value === undefined) return undefined;
  const sValue = splitNumber(value);
  if (!sValue) {
    throw new Error(`Expected ${name} (${showValue(value)}) to be a valid integer string`);
  }
  return sValue;
}
function isValid(value: string, sMin?: SplitNumber, sMax?: SplitNumber): boolean {
  const sValue = splitNumber(value);
  if (!sValue) return false;
  return !(
    (sMin && compare(sMin, sValue) === B_IS_SMALLER) ||
    (sMax && compare(sValue, sMax) === B_IS_SMALLER)
  );
}

function splitNumber(value: string): SplitNumber | undefined {
  if (!/^(0|\-?[1-9]\d*)$/.test(value)) {
    return undefined;
  }
  const isNegative = value.startsWith(`-`);
  return { isNegative, magnitude: isNegative ? value.substring(1) : value };
}

function compare(a: SplitNumber, b: SplitNumber) {
  if (a.isNegative) {
    if (!b.isNegative) return A_IS_SMALLER;
    return compareMagnitude(b.magnitude, a.magnitude);
  } else {
    if (b.isNegative) return B_IS_SMALLER;
    return compareMagnitude(a.magnitude, b.magnitude);
  }
}

function compareMagnitude(a: string, b: string) {
  if (a.length < b.length) return A_IS_SMALLER;
  if (a.length > b.length) return B_IS_SMALLER;
  if (a < b) return A_IS_SMALLER;
  if (a > b) return B_IS_SMALLER;
  return EQUAL;
}
