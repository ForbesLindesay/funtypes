import { assertRuntype, Codec, getInternal, ObjectCodec } from '../runtype';

export function Readonly<const TElements extends unknown[]>(
  input: Codec<TElements>,
): Codec<{ readonly [k in keyof TElements]: TElements[k] }>;
export function Readonly<TObject extends { [key: string]: unknown }>(
  input: ObjectCodec<TObject>,
): ObjectCodec<{ readonly [K in keyof TObject]: TObject[K] }>;
export function Readonly<TObject extends { [key: string]: unknown }>(
  input: Codec<TObject>,
): Codec<{ readonly [K in keyof TObject]: TObject[K] }>;
export function Readonly(input: Codec<any>): Codec<any> {
  assertRuntype(input);
  const internal = getInternal(input);
  if (!internal._asReadonly) return input; // Since this only affects the printed type, we can just return the input unchanged if it doesn't support asReadonly
  return internal._asReadonly(Readonly);
}
