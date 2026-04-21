import { expected, failure } from '../result';
import { Codec, showValue } from '../runtype';
import { Constraint } from './constraint';
import { validateDateOptions, type DateTimeOptions } from './DateTime';
import { String } from './primitive';

export type DateTimeStringValue = `${number}-${number}-${number}T${number}:${number}:${number}Z`;
export interface DateTimeStringOptions extends DateTimeOptions {
  strict?: boolean;
}
export interface StrictDateTimeStringOptions extends DateTimeOptions {
  strict?: true;
}
export function DateTimeString(options?: StrictDateTimeStringOptions): Codec<DateTimeStringValue>;
export function DateTimeString(options?: DateTimeStringOptions): Codec<string>;
export function DateTimeString({
  min,
  max,
  strict = true,
}: DateTimeStringOptions = {}): Codec<any> {
  validateDateOptions(min, max);

  return Constraint(
    String,
    value => {
      if (strict && !/^\d\d\d\d-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d\d\d)?Z$/.test(value)) {
        return notFullIsoError(value);
      }
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) {
        return failure(`${showValue(value)} is not a valid date`);
      }
      if (min && d.getTime() < min.getTime()) {
        return expected(`a date on or after ${min.toISOString()}`, value);
      }
      if (max && d.getTime() > max.getTime()) {
        return expected(`a date on or before ${max.toISOString()}`, value);
      }
      if (
        strict &&
        d.toISOString().replace(/(?:\.\d\d\d)?Z$/, ``) !== value.replace(/(?:\.\d\d\d)?Z$/, ``)
      ) {
        return notFullIsoError(value);
      }
      return true;
    },
    { name: `DateTimeString`, options: { min, max, strict } },
  );
}

function notFullIsoError(value: string) {
  return failure(`${showValue(value)} is not a valid date in the full ISO8601 format.`);
}
