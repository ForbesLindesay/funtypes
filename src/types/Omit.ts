import { assertRuntype, Codec, getInternal } from '../runtype';

export function Omit<
  const TObject extends { [key: string]: unknown },
  const TKeys extends string[],
>(input: Codec<TObject>, keys: TKeys): Codec<Omit<TObject, TKeys[number]>> {
  assertRuntype(input);
  const internal = getInternal(input);
  if (!internal._omit) {
    throw new Error(
      `Omit: input runtype "${input.introspection.tag}" does not support 'omit' operation`,
    );
  }
  return internal._omit(keys, Omit);
}
