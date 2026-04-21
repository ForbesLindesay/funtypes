import { failure, success } from '../result';
import { Codec } from '../runtype';
import { Constraint } from './constraint';
import { ParsedValue } from './ParsedValue';
import { String } from './primitive';
import type { UrlOptions } from './Url';
import { Url } from './Url';

export function UrlString(options?: UrlOptions): Codec<string> {
  const u = Url(options);
  return ParsedValue(String, {
    name: `UrlString`,
    test: Constraint(
      String,
      value => {
        let url;
        try {
          url = new URL(value);
        } catch (_ex) {
          return failure(`Invalid URL: ${value}`);
        }
        const result = u.safeParse(url);
        if (!result.success) return result;
        return true;
      },
      { name: `URL` },
    ),
    parse(value) {
      let url;
      try {
        url = new URL(value);
      } catch (_ex) {
        return failure(`Invalid URL: ${value}`);
      }
      const result = u.safeParse(url);
      if (!result.success) return result;
      return success(result.value.href);
    },
    serialize: value => success(new URL(value).href),
  });
}
