import { success } from '../result';
import { Codec } from '../runtype';
import { DateTime } from './DateTime';
import type { DateTimeStringOptions } from './DateTimeString';
import { DateTimeString } from './DateTimeString';
import { ParsedValue } from './ParsedValue';

export function ParsedDateTimeString(options?: DateTimeStringOptions): Codec<Date> {
  return ParsedValue(DateTimeString(options), {
    name: `Date`,
    test: DateTime(options),
    parse: value => success(new Date(value)),
    serialize: value => success(value.toISOString()),
  });
}
