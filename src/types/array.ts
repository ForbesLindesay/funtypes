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
 * Construct an array runtype from a runtype for its elements.
 */
function InternalArr<TElement>(element: Runtype<TElement>, isReadonly: boolean): Codec<TElement[]> {
  assertRuntype(element);
  const result: Codec<TElement[]> = create<TElement[]>(
    {
      _parse: (xs, innerValidate, _innerValidateToPlaceholder, _getFields, sealed) => {
        if (!Array.isArray(xs)) {
          return expected('an Array', xs);
        }

        return createValidationPlaceholder([...xs], placeholder => {
          let fullError: FullError | undefined = undefined;
          let firstError: Failure | undefined;
          for (let i = 0; i < xs.length; i++) {
            const validated = innerValidate(
              element,
              xs[i],
              sealed && sealed.deep ? { deep: true } : false,
            );
            if (!validated.success) {
              if (!fullError) {
                fullError = unableToAssign(xs, result);
              }
              fullError.push(typesAreNotCompatible(`[${i}]`, validated));
              firstError =
                firstError ||
                failure(validated.message, {
                  key: validated.key ? `[${i}].${validated.key}` : `[${i}]`,
                  fullError: fullError,
                });
            } else {
              placeholder[i] = validated.value;
            }
          }
          return firstError;
        });
      },
      _showType() {
        return `${isReadonly ? 'readonly ' : ''}${showType(element, true)}[]`;
      },
      _asMutable: () => InternalArr(element, false),
      _asReadonly: () => InternalArr(element, true),
    },
    {
      tag: 'array',
      isReadonly,
      element,
    },
  );
  return result;
}

export { Arr as Array };
function Arr<TElement>(element: Runtype<TElement>): Codec<TElement[]> {
  return InternalArr(element, false);
}
export function ReadonlyArray<TElement>(element: Runtype<TElement>): Codec<readonly TElement[]> {
  const result: Codec<TElement[]> = InternalArr(element, true);
  // @ts-expect-error
  return result;
}
