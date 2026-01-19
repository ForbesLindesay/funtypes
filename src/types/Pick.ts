import { assertRuntype, ObjectCodec, getInternal } from '../runtype';

export function Pick<
  const TObject extends { [key: string]: unknown },
  const TKeys extends string[],
>(input: ObjectCodec<TObject>, keys: TKeys): ObjectCodec<Pick<TObject, TKeys[number]>> {
  assertRuntype(input);
  const internal = getInternal(input);
  const fn = internal._pick ?? internal._mapInternal;
  if (!fn) {
    throw new Error(
      `Pick: input runtype "${input.introspection.tag}" does not support the 'pick' operation`,
    );
  }

  const result = fn(
    t =>
      // @ts-expect-error Pick only allows ObjectCodec inputs
      Pick(t, keys),
    keys,
  );
  // @ts-expect-error Unsafe cast from Codec to ObjectCodec
  return result;
}
