import { failure, success } from '../result';
import { Codec, create, showValue } from '../runtype';

/**
 * The super type of all literal types.
 */
export type LiteralValue = undefined | null | boolean | number | string;

/**
 * Construct a runtype for a type literal.
 */
export function Literal<A extends LiteralValue>(valueBase: A): Codec<A> {
  return create<A>(
    {
      _parse: value =>
        value === valueBase
          ? success(value)
          : failure(
              `Expected literal ${showValue(valueBase)}, but was ${showValue(value)}${
                typeof value !== typeof valueBase && value != null
                  ? Array.isArray(value)
                    ? ` (i.e. an array)`
                    : typeof value === 'object'
                      ? ` (i.e. an object)`
                      : ` (i.e. a ${typeof value})`
                  : ``
              }`,
            ),
      _showType() {
        return showValue(valueBase);
      },
    },
    {
      tag: 'literal',
      value: valueBase,
    },
  );
}

/**
 * An alias for Literal(undefined).
 */
export const Undefined = Literal(undefined);

/**
 * An alias for Literal(null).
 */
export const Null = Literal(null);
