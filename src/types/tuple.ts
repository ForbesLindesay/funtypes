import {
  expected,
  failure,
  Failure,
  FullError,
  typesAreNotCompatible,
  unableToAssign,
} from '../result';
import {
  create,
  Runtype,
  Codec,
  createValidationPlaceholder,
  assertRuntype,
  showType,
} from '../runtype';

/**
 * Construct a tuple runtype from runtypes for each of its elements.
 */
export function Tuple<const T extends readonly Runtype<unknown>[]>(
  ...components: T
): Codec<{
  -readonly [key in keyof T]: T[key] extends Runtype<infer E> ? E : unknown;
}> {
  return TupleCore(components, false);
}

export function ReadonlyTuple<const T extends readonly Runtype<unknown>[]>(
  ...components: T
): Codec<{
  readonly [key in keyof T]: T[key] extends Runtype<infer E> ? E : unknown;
}> {
  return TupleCore(components, true);
}

function TupleCore<const T extends readonly Runtype<unknown>[]>(
  components: T,
  isReadonly: boolean,
): Codec<{
  -readonly [key in keyof T]: T[key] extends Runtype<infer E> ? E : unknown;
}> {
  assertRuntype(...components);
  const result = create<{
    -readonly [key in keyof T]: T[key] extends Runtype<infer E> ? E : unknown;
  }>(
    {
      _parse: (x, innerValidate, _innerValidateToPlaceholder, _getFields, sealed) => {
        if (!Array.isArray(x)) {
          return expected(`tuple to be an array`, x);
        }

        if (x.length !== components.length) {
          return expected(`an array of length ${components.length}`, x.length);
        }

        return createValidationPlaceholder([...x] as any, placeholder => {
          let fullError: FullError | undefined = undefined;
          let firstError: Failure | undefined;
          for (let i = 0; i < components.length; i++) {
            let validatedComponent = innerValidate(
              components[i],
              x[i],
              sealed && sealed.deep ? { deep: true } : false,
            );

            if (!validatedComponent.success) {
              if (!fullError) {
                fullError = unableToAssign(x, result);
              }
              fullError.push(typesAreNotCompatible(`[${i}]`, validatedComponent));
              firstError =
                firstError ||
                failure(validatedComponent.message, {
                  key: validatedComponent.key ? `[${i}].${validatedComponent.key}` : `[${i}]`,
                  fullError: fullError,
                });
            } else {
              placeholder[i] = validatedComponent.value;
            }
          }
          return firstError;
        });
      },
      _showType: () =>
        `${isReadonly ? `readonly ` : ``}[${(components as readonly Runtype<unknown>[])
          .map(e => showType(e, false))
          .join(', ')}]`,
      _asMutable: () => TupleCore(components, false),
      _asReadonly: () => TupleCore(components, true),
    },
    {
      tag: 'tuple',
      components,
      isReadonly,
    },
  );
  return result;
}
