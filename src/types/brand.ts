import { create, Codec, assertRuntype, showType, ObjectCodec } from '../runtype';

export type BrandedType<B extends string, T> = T & { readonly __type__: B };
export function Brand<const B extends string, T>(
  brand: B,
  entity: ObjectCodec<T>,
): ObjectCodec<BrandedType<B, T>>;
export function Brand<const B extends string, T>(brand: B, entity: Codec<T>): Codec<BrandedType<B, T>>;
export function Brand<const B extends string, T>(brand: B, entity: Codec<T>): Codec<BrandedType<B, T>> {
  assertRuntype(entity);
  return create<BrandedType<B, T>>(
    {
      _parse: (value, _innerValidate, innerValidateToPlaceholder) =>
        innerValidateToPlaceholder(entity, value) as any,
      _underlyingType: () => entity,
      _showType(needsParens) {
        return showType(entity, needsParens);
      },
      _mapInternal: mapper => Brand(brand, mapper(entity)),
    },
    {
      tag: 'brand',
      brand,
      entity,
    },
  );
}
