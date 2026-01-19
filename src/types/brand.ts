import { create, Codec, assertRuntype, showType } from '../runtype';

export type BrandedType<B extends string, T> = T & { readonly __type__: B };
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
      _asMutable: mapper => Brand(brand, mapper(entity)),
      _asReadonly: mapper => Brand(brand, mapper(entity)),
    },
    {
      tag: 'brand',
      brand,
      entity,
    },
  );
}
