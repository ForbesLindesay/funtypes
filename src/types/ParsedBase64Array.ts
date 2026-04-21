import { base64Decode, base64Encode, Base64EncodeOptions } from '../base64';
import { success } from '../result';
import { Codec } from '../runtype';
import { Base64String } from './Base64String';
import { InstanceOf } from './instanceof';
import { ParsedValue } from './ParsedValue';

export function ParsedBase64Array(encodeOptions?: Base64EncodeOptions): Codec<Uint8Array> {
  return ParsedValue(Base64String(), {
    name: `Unit8Array`,
    test: InstanceOf(Uint8Array),
    parse: value => success(base64Decode(value)),
    serialize: value => success(base64Encode(value, encodeOptions)),
  });
}
