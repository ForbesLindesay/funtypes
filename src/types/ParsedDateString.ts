import { failure } from '../result';
import { Codec } from '../runtype';
import { Constraint } from './constraint';
import { DateString, type DateStringValue, type DateStringOptions } from './DateString';
import { InstanceOf } from './instanceof';
import { ParsedValue } from './ParsedValue';

export function ParsedDateString(options?: DateStringOptions): Codec<Date> {
  const base = DateString(options);
  return ParsedValue(base, {
    name: `Date`,
    test: Constraint(InstanceOf(Date), value => {
      const str = value.toISOString();
      const [datePart, timePart] = str.split(`T`);
      if (timePart !== `00:00:00.000Z`) {
        return failure(`Expected a Date with no time portion but got ${str}`);
      }
      const result = base.safeParse(datePart);
      if (!result.success) return result;
      return true;
    }),
    parse(value) {
      return { success: true, value: new Date(`${value}T00:00:00.000Z`) };
    },
    serialize(value) {
      return { success: true, value: value.toISOString().split(`T`)[0] as DateStringValue };
    },
  });
}
