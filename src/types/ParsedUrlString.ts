import { failure, success } from '../result';
import { Codec } from '../runtype';
import { ParsedValue } from './ParsedValue';
import { String } from './primitive';
import type { UrlOptions } from './Url';
import { Url } from './Url';

export function ParsedUrlString(options?: UrlOptions): Codec<URL> {
  const u = Url(options);
  return ParsedValue(String, {
    name: `URL`,
    test: u,
    parse(value) {
      let url;
      try {
        url = new URL(value);
      } catch (_ex) {
        return failure(`Invalid URL: ${value}`);
      }
      return u.safeParse(url);
    },
    serialize: value => success(value.href),
  });
}
