import { Failure, failure, Result, unableToAssign } from '../result';
import { create, Codec, assertRuntype, showType, showValue } from '../runtype';

export function Constraint<TUnderlying, TConstrained extends TUnderlying = TUnderlying>(
  underlying: Codec<TUnderlying>,
  constraint: (x: TUnderlying) => boolean | string | Failure,
  options?: { name?: string; options?: unknown },
): Codec<TConstrained> {
  assertRuntype(underlying);
  const runtype: Codec<TConstrained> = create<TConstrained>(
    {
      _parse(value, innerValidate, _, mode) {
        const validated = innerValidate(underlying, value);

        if (validated.success) {
          const result = constraint(mode === 'p' ? validated.value : value);
          if (result !== true) {
            if (typeof result === 'object') {
              return result;
            }
            const message =
              typeof result === 'string'
                ? result
                : `${showValue(value)} failed ${options?.name || 'constraint'} check`;
            return failure(message, {
              fullError: unableToAssign(value, runtype, message),
            });
          }
        }
        return validated as Result<TConstrained>;
      },
      _underlyingType: () => underlying,
      _showType: needsParens =>
        options?.name || `WithConstraint<${showType(underlying, needsParens)}>`,
    },
    Object.assign(
      {
        tag: 'constraint' as const,
        underlying,
      },
      options,
    ),
  );
  return runtype;
}
