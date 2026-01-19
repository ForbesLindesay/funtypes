import { assertRuntype, ObjectCodec, getInternal } from '../runtype';

export function Pick<
  const TObject extends { [key: string]: unknown },
  const TKeys extends string[],
>(input: ObjectCodec<TObject>, keys: TKeys): ObjectCodec<Pick<TObject, TKeys[number]>> {
  assertRuntype(input);
  const internal = getInternal(input);
  if (!internal._pick) {
    throw new Error(
      `Pick: input runtype "${input.introspection.tag}" does not support the 'pick' operation`,
    );
  }

  const result = internal._pick(
    t =>
      // @ts-expect-error Pick only allows ObjectCodec inputs
      Pick(t, keys),
    keys,
  );
  // @ts-expect-error Unsafe cast from Codec to ObjectCodec
  return result;
}
