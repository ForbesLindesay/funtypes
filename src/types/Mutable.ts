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
export function Mutable(input: any): any {
  assertRuntype(input);
  const internal = getInternal(input);
  return internal._asMutable ? internal._asMutable(Mutable) : input;
}
