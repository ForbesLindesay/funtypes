import { assertRuntype, ObjectCodec, getInternal } from '../runtype';

export function Omit<
  const TObject extends { [key: string]: unknown },
  const TKeys extends string[],
>(input: ObjectCodec<TObject>, keys: TKeys): ObjectCodec<Omit<TObject, TKeys[number]>> {
  assertRuntype(input);
  const internal = getInternal(input);
  if (!internal._omit) {
    throw new Error(
      `Omit: input runtype "${input.introspection.tag}" does not support the 'omit' operation`,
    );
  }

  const result = internal._omit(
    t =>
      // @ts-expect-error Omit only allows ObjectCodec inputs
      Omit(t, keys),
    keys,
  );
  // @ts-expect-error Unsafe cast from Codec to ObjectCodec
  return result;
}
