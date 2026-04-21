import { Codec, showType } from '../runtype';
import { ParsedValue } from './ParsedValue';

/**
 * Chain a series of ParsedValue/Constraint codecs together
 * so that the value is parsed by each in sequence.
 */
export function ChainCodecs<const T>(...codecs: [...Codec<any>[], Codec<T>]): Codec<T> {
  return ChainCodecsInternal(
    codecs.slice(),
    codecs.map(c => showType(c)),
  );
}

function ChainCodecsInternal(codecs: Codec<any>[], names: string[]): Codec<any> {
  const end = codecs.pop()!;
  if (!codecs.length) return end;

  const name = `Chain<${names.join(`, `)}>`;
  names.pop();

  const start = ChainCodecsInternal(codecs, names);
  return ParsedValue(start, {
    name,
    test: end,
    parse(value) {
      return end.safeParse(value);
    },
    serialize(value) {
      return end.safeSerialize(value);
    },
  });
}
