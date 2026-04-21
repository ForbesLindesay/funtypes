import { failure } from '../result';
import { Codec } from '../runtype';
import { Constraint } from './constraint';
import { InstanceOf } from './instanceof';

/**
 * A range for a JavaScript Date representing a Date and Time
 */
export interface DateTimeOptions {
  /**
   * The minimum date (inclusive)
   *
   * @default new Date(-8640000000000000)
   */
  min?: Date;
  /**
   * The maximum date (inclusive)
   *
   * @default new Date(8640000000000000)
   */
  max?: Date;
}

export function validateDateOptions(min: Date | undefined, max: Date | undefined): void {
  if (min && !(min instanceof Date && !Number.isNaN(min.getTime()))) {
    throw new Error(`min is not a valid date.`);
  }
  if (max && !(max instanceof Date && !Number.isNaN(max.getTime()))) {
    throw new Error(`max is not a valid date.`);
  }
  if (min && max && min.getTime() >= max.getTime()) {
    throw new Error(
      `Expected min (${min.toISOString()}) to be less than max (${max.toISOString()})`,
    );
  }
}

/**
 * A JavaScript "Date" representing a date and time within an optional range
 */
export function DateTime({ min, max }: DateTimeOptions = {}): Codec<Date> {
  validateDateOptions(min, max);

  return Constraint(
    InstanceOf(Date),
    value => {
      if (Number.isNaN(value.getTime())) {
        return failure(`[INVALID DATE] is not a valid date`);
      }
      // Dates outside the valid range return NaN for .getTime()
      // so we don't need to encode these defaults
      if (min && value.getTime() < min.getTime()) {
        return failure(
          `Expected a date on or after ${min.toISOString()}, but was ${value.toISOString()}`,
        );
      }
      if (max && value.getTime() > max.getTime()) {
        return failure(
          `Expected a date on or before ${max.toISOString()}, but was ${value.toISOString()}`,
        );
      }
      return true;
    },
    { name: `Date`, options: { min, max } },
  );
}
