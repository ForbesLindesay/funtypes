import { failure, success } from '../result';
import {
  Static,
  create,
  RuntypeBase,
  Codec,
  createValidationPlaceholder,
  assertRuntype,
  SealedState,
} from '../runtype';
import show, { parenthesize } from '../show';

// We use the fact that a union of functions is effectively an intersection of parameters
// e.g. to safely call (({x: 1}) => void | ({y: 2}) => void) you must pass {x: 1, y: 2}
export type StaticIntersect<TIntersectees extends readonly RuntypeBase<unknown>[]> = {
  [key in keyof TIntersectees]: TIntersectees[key] extends RuntypeBase
    ? (parameter: Static<TIntersectees[key]>) => any
    : unknown;
}[number] extends (k: infer I) => void
  ? I
  : never;

export interface Intersect<
  TIntersectees extends readonly [RuntypeBase<unknown>, ...RuntypeBase<unknown>[]]
> extends Codec<StaticIntersect<TIntersectees>> {
  readonly tag: 'intersect';
  readonly intersectees: TIntersectees;
}

export function isIntersectRuntype(
  runtype: RuntypeBase,
): runtype is Intersect<[RuntypeBase, ...RuntypeBase[]]> {
  return (
    'tag' in runtype && (runtype as Intersect<[RuntypeBase, ...RuntypeBase[]]>).tag === 'intersect'
  );
}

/**
 * Construct an intersection runtype from runtypes for its alternatives.
 */
export function Intersect<
  TIntersectees extends readonly [RuntypeBase<unknown>, ...RuntypeBase<unknown>[]]
>(...intersectees: TIntersectees): Intersect<TIntersectees> {
  assertRuntype(...intersectees);
  return create<Intersect<TIntersectees>>(
    'intersect',
    {
      p: (value, innerValidate, _innerValidateToPlaceholder, getFields, sealed) => {
        const getSealed = sealed
          ? (targetType: RuntypeBase): SealedState => {
              const fields = new Set<string>();
              for (const intersectee of intersectees) {
                if (targetType !== intersectee) {
                  const intersecteeFields = getFields(intersectee);
                  if (intersecteeFields === undefined) return false;
                  for (const f of intersecteeFields) {
                    fields.add(f);
                  }
                }
              }
              return { keysFromIntersect: fields, deep: sealed.deep };
            }
          : (_i: RuntypeBase): SealedState => false;
        if (Array.isArray(value)) {
          return createValidationPlaceholder<any>([...value], placeholder => {
            for (const targetType of intersectees) {
              let validated = innerValidate(targetType, placeholder, getSealed(targetType));
              if (!validated.success) {
                return validated;
              }
              if (!Array.isArray(validated.value)) {
                return failure(
                  `The validator ${show(
                    targetType,
                  )} attempted to convert the type of this value from an array to something else. That conversion is not valid as the child of an intersect`,
                );
              }
              placeholder.splice(0, placeholder.length, ...validated.value);
            }
          });
        } else if (value && typeof value === 'object') {
          return createValidationPlaceholder<any>(Object.create(null), placeholder => {
            for (const targetType of intersectees) {
              let validated = innerValidate(targetType, value, getSealed(targetType));
              if (!validated.success) {
                return validated;
              }
              if (!(validated.value && typeof validated.value === 'object')) {
                return failure(
                  `The validator ${show(
                    targetType,
                  )} attempted to convert the type of this value from an object to something else. That conversion is not valid as the child of an intersect`,
                );
              }
              Object.assign(placeholder, validated.value);
            }
          });
        }
        let result = value;
        for (const targetType of intersectees) {
          let validated = innerValidate(targetType, result, getSealed(targetType));
          if (!validated.success) {
            return validated;
          }
          result = validated.value;
        }
        return success(result);
      },
      f: getFields => {
        const fields = new Set<string>();
        for (const i of intersectees) {
          const iFields = getFields(i);
          if (iFields === undefined) return undefined;
          for (const f of iFields) {
            fields.add(f);
          }
        }
        return fields;
      },
    },
    {
      intersectees,
      show(needsParens) {
        return parenthesize(`${intersectees.map(v => show(v, true)).join(' & ')}`, needsParens);
      },
    },
  );
}
