import { expected, success } from '../result';
import { create, Codec } from '../runtype';

export function Enum<TEnum extends { [key: string]: number | string }>(
  name: string,
  e: TEnum,
): Codec<TEnum[keyof TEnum]> {
  const values = Object.values(e);
  const enumValues = new Set(
    values.some(v => typeof v === 'number') ? values.filter(v => typeof v === 'number') : values,
  );
  return create<TEnum[keyof TEnum]>(
    {
      _parse: value =>
        enumValues.has(value as any) ? success(value as any) : expected(name, value),
      _showType: () => name,
    },
    {
      tag: 'enum',
      enumObject: e,
    },
  );
}
