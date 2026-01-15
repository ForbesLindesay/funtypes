import { assertRuntype, Codec, getInternal } from '../runtype';

export function Pick<
  const TObject extends { [key: string]: unknown },
  const TKeys extends string[],
>(input: Codec<TObject>, keys: TKeys): Codec<Pick<TObject, TKeys[number]>> {
  assertRuntype(input);
  const internal = getInternal(input);
  if (!internal._pick) {
    throw new Error(
      `Pick: input runtype "${input.introspection.tag}" does not support 'pick' operation`,
    );
  }
  return internal._pick(keys, Pick);
}
