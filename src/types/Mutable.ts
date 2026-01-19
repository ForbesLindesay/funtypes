import { assertRuntype, Codec, getInternal, ObjectCodec } from '../runtype';

export function Mutable<const TElements extends readonly unknown[]>(
  input: Codec<TElements>,
): Codec<{ -readonly [k in keyof TElements]: TElements[k] }>;
export function Mutable<TObject extends { readonly [key: string]: unknown }>(
  input: ObjectCodec<TObject>,
): ObjectCodec<{ -readonly [K in keyof TObject]: TObject[K] }>;
export function Mutable<TObject extends { readonly [key: string]: unknown }>(
  input: Codec<TObject>,
): Codec<{ -readonly [K in keyof TObject]: TObject[K] }>;
export function Mutable(input: Codec<any>): Codec<any> {
  assertRuntype(input);
  const internal = getInternal(input);
  if (!internal._asMutable) return input; // Since this only affects the printed type, we can just return the input unchanged if it doesn't support asMutable
  return internal._asMutable(Mutable);
}
