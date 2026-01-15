import { expected, success } from '../result';
import { create, Codec, parenthesize, showValue } from '../runtype';

export function KeyOf<TObject extends Object>(
  object: TObject,
): Codec<
  {
    [K in keyof TObject]: K extends number ? K | `${K}` : K;
  }[keyof TObject]
> {
  const keys = new Set(Object.keys(object));
  const name = [...keys]
    .sort()
    .map(k => showValue(k))
    .join(` | `);
  return create<
    {
      [K in keyof TObject]: K extends number ? K | `${K}` : K;
    }[keyof TObject]
  >(
    {
      _parse: value =>
        keys.has(typeof value === 'number' ? value.toString() : (value as any))
          ? success(value as any)
          : expected(name, value),
      _showType: needsParens => parenthesize(name, needsParens),
    },
    {
      tag: 'keyOf',
      keys,
    },
  );
}
