import { assertRuntype, ObjectCodec, getInternal } from '../runtype';

export function Omit<
  const TObject extends { [key: string]: unknown },
  const TKeys extends string[],
>(input: ObjectCodec<TObject>, keys: TKeys): ObjectCodec<Omit<TObject, TKeys[number]>> {
  assertRuntype(input);
  const internal = getInternal(input);
  const fn = internal._omit ?? internal._mapInternal;
  if (!fn) {
    throw new Error(
      `Omit: input runtype "${input.introspection.tag}" does not support the 'omit' operation`,
    );
  }

  const result = fn(
    t =>
      // @ts-expect-error Omit only allows ObjectCodec inputs
      Omit(t, keys),
    keys,
  );
  // @ts-expect-error Unsafe cast from Codec to ObjectCodec
  return result;
}
