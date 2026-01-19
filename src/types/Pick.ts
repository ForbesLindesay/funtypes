import { assertRuntype, ObjectCodec, getInternal } from '../runtype';

export function Pick<
  const TObject extends { [key: string]: unknown },
  const TKeys extends string[],
>(input: ObjectCodec<TObject>, keys: TKeys): ObjectCodec<Pick<TObject, TKeys[number]>> {
  assertRuntype(input);
  const internal = getInternal(input);
  if (!internal._pick) {
    throw new Error(
      `Pick: input runtype "${input.introspection.tag}" does not support 'pick' operation`,
    );
  }
  // @ts-expect-error
  return internal._pick(keys, Pick);
}
