import { failure, success } from '../result';
import {
  create,
  Runtype,
  createValidationPlaceholder,
  assertRuntype,
  SealedState,
  getFields,
  parenthesize,
  showType,
  Codec,
} from '../runtype';
import { lazyValue } from './lazy';

/**
 * Construct an intersection runtype from runtypes for its alternatives.
 */
export function Intersect<const TIntersectees extends readonly Codec<any>[]>(
  ...intersectees: TIntersectees
): Codec<
  // We use the fact that a union of functions is effectively an intersection of parameters
  // e.g. to safely call (({x: 1}) => void | ({y: 2}) => void) you must pass {x: 1, y: 2}
  {
    [key in keyof TIntersectees]: TIntersectees[key] extends Runtype<infer T>
      ? (parameter: T) => any
      : unknown;
  }[number] extends (k: infer I) => void
    ? I
    : never
> {
  assertRuntype(...intersectees);
  const allFieldInfoForMode = (mode: 'p' | 't' | 's') => {
    const intresecteesWithOwnFields = intersectees.map(intersectee => ({
      i: intersectee,
      f: getFields(intersectee, mode),
    }));
    const intersecteesWithOtherFields = new Map(
      intersectees.map(intersectee => {
        const allFields = new Set<string>();
        for (const { i, f: fields } of intresecteesWithOwnFields) {
          if (i !== intersectee) {
            if (fields === undefined) return [intersectee, undefined] as const;
            for (const field of fields) {
              allFields.add(field);
            }
          }
        }
        return [intersectee, allFields] as const;
      }),
    );

    const allFields = new Set<string>();
    for (const { f: fields } of intresecteesWithOwnFields) {
      if (fields === undefined) return { intersecteesWithOtherFields, allFields: undefined };
      for (const field of fields) {
        allFields.add(field);
      }
    }
    return { intersecteesWithOtherFields, allFields };
  };
  // use lazy value here so that:
  // 1. If this is never used in a `Sealed` context, we can skip evaluating it
  // 2. Circular references using `Lazy` don't break.
  const allFieldInfo = {
    p: lazyValue(() => allFieldInfoForMode(`p`)),
    t: lazyValue(() => allFieldInfoForMode(`t`)),
    s: lazyValue(() => allFieldInfoForMode(`s`)),
  };
  return create<
    // We use the fact that a union of functions is effectively an intersection of parameters
    // e.g. to safely call (({x: 1}) => void | ({y: 2}) => void) you must pass {x: 1, y: 2}
    {
      [key in keyof TIntersectees]: TIntersectees[key] extends Runtype<infer T>
        ? (parameter: T) => any
        : unknown;
    }[number] extends (k: infer I) => void
      ? I
      : never
  >(
    {
      _parse: (value, innerValidate, _innerValidateToPlaceholder, mode, sealed) => {
        const getSealed = sealed
          ? (targetType: Codec<any>): SealedState => {
              const i = allFieldInfo[mode]().intersecteesWithOtherFields.get(targetType);
              if (i === undefined) return false;
              else return { keysFromIntersect: i, deep: sealed.deep };
            }
          : (_i: Codec<any>): SealedState => false;
        if (Array.isArray(value)) {
          return createValidationPlaceholder<any>([...value], placeholder => {
            for (const targetType of intersectees) {
              let validated = innerValidate(targetType, placeholder, getSealed(targetType));
              if (!validated.success) {
                return validated;
              }
              if (!Array.isArray(validated.value)) {
                return failure(
                  `The validator ${showType(
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
                  `The validator ${showType(
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
      _fields: mode => allFieldInfo[mode]().allFields,
      _showType: needsParens => {
        if (intersectees.length && intersectees.every(v => v.introspection.tag === 'object')) {
          let result = '';
          for (const intersectee of intersectees) {
            const asString = showType(intersectee, needsParens);
            if (!asString.endsWith(' }')) {
              result = '';
              break;
            }
            if (!result) {
              result = asString;
            } else {
              result = result.slice(0, -2) + '; ' + asString.slice(2);
            }
          }
          if (result) return result;
        }
        return parenthesize(`${intersectees.map(v => showType(v, true)).join(' & ')}`, needsParens);
      },
      _asMutable: asMutable => Intersect(...intersectees.map(asMutable)),
      _asReadonly: asReadonly => Intersect(...intersectees.map(asReadonly)),
      _pick: (keys, pick) => Intersect(...intersectees.map(t => pick(t, keys))),
      _omit: (keys, omit) => Intersect(...intersectees.map(t => omit(t, keys))),
    },
    {
      tag: 'intersect',
      intersectees,
    },
  );
}
