import { Base64EncodeOptions, stringToUnicode, unicodeToString } from '../base64';
import { success } from '../result';
import { Codec } from '../runtype';
import { ParsedBase64Array } from './ParsedBase64Array';
import { ParsedValue } from './ParsedValue';
import { String } from './primitive';

export function ParsedBase64String(encodeOptions?: Base64EncodeOptions): Codec<string> {
  return ParsedValue(ParsedBase64Array(encodeOptions), {
    name: `Base64EncodedString`,
    test: String,
    parse: value => success(unicodeToString(value)),
    serialize: value => success(stringToUnicode(value)),
  });
}
