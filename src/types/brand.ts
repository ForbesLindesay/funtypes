import { create, Codec, assertRuntype, showType } from '../runtype';

const RuntypeName = Symbol('RuntypeName');
export type BrandedType<B extends string, T> = T & { [RuntypeName]: B };
export function Brand<B extends string, T>(brand: B, entity: Codec<T>): Codec<BrandedType<B, T>> {
  assertRuntype(entity);
  return create<BrandedType<B, T>>(
    {
      _parse: (value, _innerValidate, innerValidateToPlaceholder) =>
        innerValidateToPlaceholder(entity, value) as any,
      _underlyingType: () => entity,
      _showType(needsParens) {
        return showType(entity, needsParens);
      },
    },
    {
      tag: 'brand',
      brand,
      entity,
    },
  );
}
