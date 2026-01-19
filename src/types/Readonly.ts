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
  const fn = internal._mapInternal ?? internal._asReadonly;
  return fn ? fn(Readonly) : input;
}
