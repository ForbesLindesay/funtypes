import { failure, success, unableToAssign } from '../result';
import { create, Codec, assertRuntype, showType, showValue } from '../runtype';
import { Unknown } from './unknown';

export function Constraint<TUnderlying, TConstrained extends TUnderlying = TUnderlying>(
  underlying: Codec<TUnderlying>,
  constraint: (x: TUnderlying) => boolean | string,
  options?: { name?: string },
): Codec<TConstrained> {
  assertRuntype(underlying);
  const runtype: Codec<TConstrained> = create<TConstrained>(
    {
      _parse(value, innerValidate, _, mode) {
        const name = options && options.name;
        const validated = innerValidate(underlying, value);

        if (!validated.success) {
          return validated;
        }

        const result = constraint(mode === 'p' ? validated.value : value);
        if (!result || typeof result === 'string') {
          const message =
            typeof result === 'string'
              ? result
              : `${showValue(value)} failed ${name || 'constraint'} check`;
          return failure(message, {
            fullError: unableToAssign(value, runtype, message),
          });
        }
        return success(validated.value as TConstrained);
      },
      _underlyingType: () => underlying,
      _showType(needsParens) {
        return options?.name || `WithConstraint<${showType(underlying, needsParens)}>`;
      },
    },
    {
      tag: 'constraint',
      underlying,
      name: options && options.name,
    },
  );
  return runtype;
}

export const Guard = <T>(test: (x: unknown) => x is T, options?: { name?: string }): Codec<T> =>
  Constraint(Unknown, test, options);
