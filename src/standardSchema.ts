import { StandardJSONSchemaV1, StandardSchemaV1 } from '@standard-schema/spec';
import { assertRuntype, Codec, getInternal, Runtype } from './runtype';
import { JsonSchema } from './json-schema';
import { RuntypeIntrospection } from './introspection';
import { showError } from './result';

export type JsonSchemaMode = 'serialized' | 'parsed';
export interface StandardSchemaProps<Input = unknown, Output = Input>
  extends StandardSchemaV1.Props<Input, Output>, StandardJSONSchemaV1.Props<Input, Output> {}

/**
 * An interface that combines StandardJSONSchema and StandardSchema.
 * */
export interface StandardSchema<Input = unknown, Output = Input> {
  '~standard': StandardSchemaProps<Input, Output>;
}

let cache: undefined | WeakMap<Runtype, Map<string, StandardSchema>>;
export interface StandardJsonSchemaOptions {
  validateMode?: 'parse' | 'serialize' | 'assert';
  jsonSchemaMode?: { input?: JsonSchemaMode; output?: JsonSchemaMode };
}

export function toStandardJsonSchema<T>(
  runtype: Codec<T>,
  options?: StandardJsonSchemaOptions,
): StandardSchema<T> {
  const validateMode = options?.validateMode ?? 'parse';
  const inputMode = options?.jsonSchemaMode?.input ?? 'serialized';
  const outputMode = options?.jsonSchemaMode?.output ?? 'parsed';
  const cacheKey = `${validateMode}:${inputMode}:${outputMode}`;
  if (!cache) cache = new WeakMap();
  let cacheForRuntype = cache.get(runtype);
  const cached = cacheForRuntype?.get(cacheKey);
  if (cached) return cached as StandardSchema<T>;

  if (!cacheForRuntype) {
    cache.set(runtype, (cacheForRuntype = new Map()));
  }

  const fresh: StandardSchema<T> = {
    '~standard': {
      vendor: 'funtypes',
      version: 1,
      validate: value => {
        if (validateMode === 'assert') {
          try {
            runtype.assert(value);
            return { value };
          } catch (ex: any) {
            return { issues: [{ message: ex.message }] };
          }
        }
        const validated = runtype[validateMode === 'serialize' ? 'safeSerialize' : 'safeParse'](
          value as T,
        );
        if (!validated.success) {
          return { issues: [{ message: showError(validated) }] };
        }
        return { value: validated.value as T };
      },
      jsonSchema: {
        input: cachedToJsonSchema(runtype, inputMode),
        output: cachedToJsonSchema(runtype, outputMode),
      },
    },
  };
  cacheForRuntype.set(cacheKey, fresh);
  return fresh;
}

function cachedToJsonSchema(runtype: Runtype, mode: JsonSchemaMode) {
  // The standard-schema spec passes a `target`, but we produce the same output for every
  // target, so one cached schema can be reused regardless of which target is requested.
  let cache: JsonSchema | undefined;
  return (): JsonSchema => cache ?? (cache = toJsonSchema(runtype, { mode }));
}

export type JsonSchemaResult = JsonSchema | { type: 'optional'; underlying?: JsonSchema };

export interface JsonSchemaOptions {
  /**
   * Defaults to 'parsed'.
   */
  mode?: JsonSchemaMode;
}
export interface JsonSchemaContext {
  mode: JsonSchemaMode;
  toJsonSchema: (runtype: Runtype, name?: string) => JsonSchemaResult;
}

export function toJsonSchema(runtype: Runtype, options?: JsonSchemaOptions): JsonSchema {
  const definitionNames = new Map<string, Runtype>();
  const $defs: Record<string, JsonSchema> = {};
  const innerContext: JsonSchemaContext = { mode: options?.mode ?? 'parsed', toJsonSchema };

  const result = assertNotOptional(toJsonSchema(runtype));
  if (definitionNames.size) {
    result.$defs = $defs;
  }
  return result;
  function toJsonSchema(underlying: Runtype, name?: string): JsonSchemaResult {
    assertRuntype(underlying);
    const result =
      getInternal(underlying)._toJsonSchema?.(innerContext) ??
      HANDLERS[underlying.introspection.tag](underlying.introspection as any, innerContext);
    if (result.type === 'optional') return result;

    if (!name) return result;

    result.title = name;
    if (!/^[a-z](?:[_a-z0-9]*[a-z0-9])?$/i.test(name)) return result;

    let candidate = name;
    let suffix = 1;
    while (true) {
      const existing = definitionNames.get(candidate);
      if (existing === underlying) {
        return { $ref: `#/$defs/${candidate}` };
      }
      if (existing === undefined) {
        definitionNames.set(candidate, underlying);
        $defs[candidate] = result;
        return { $ref: `#/$defs/${candidate}` };
      }
      candidate = `${name}_${suffix++}`;
    }
  }
}

export function assertNotOptional(result: JsonSchemaResult): JsonSchema {
  if (result.type === 'optional') {
    throw new Error('Cannot represent undefined in JSON Schema');
  }
  return result;
}

function notSupported(i: RuntypeIntrospection): never {
  throw new Error(`${i.tag} funtypes cannot be represented in JSON schema`);
}

const HANDLERS: {
  [T in RuntypeIntrospection as T['tag']]: (
    introspection: T,
    ctx: JsonSchemaContext,
  ) => JsonSchemaResult;
} = {
  bigint: notSupported,
  function: notSupported,
  instanceof: notSupported,
  lazy: notSupported,
  symbol: notSupported,
  literal: ({ value }) => {
    if (value === undefined) return { type: 'optional' };
    return { type: value === null ? ('null' as const) : (typeof value as any), const: value };
  },
  array: (i, ctx) => ({ type: 'array', items: assertNotOptional(ctx.toJsonSchema(i.element)) }),
  boolean: () => ({ type: 'boolean' }),
  brand: (i, ctx) => ctx.toJsonSchema(i.entity, i.brand),
  constraint: (i, ctx) => ctx.toJsonSchema(i.underlying, i.name),
  default: (i, ctx) => {
    const t = ctx.toJsonSchema(i.underlying);
    const underlying = t.type === 'optional' ? t.underlying : t;
    if (!underlying) return t;
    underlying.default = i.defaultValue;
    if (ctx.mode !== 'parsed') {
      underlying.nullable = true;
      if (t.type !== 'optional') {
        return { type: 'optional', underlying: t };
      }
    }
    return t;
  },
  comment: (i, ctx) => {
    const result = ctx.toJsonSchema(i.underlying);
    const t = result.type === 'optional' ? result.underlying : result;
    if (t) {
      t.title = i.title ?? t.title;
      t.description = i.description ?? t.description;
    }
    return result;
  },
  enum: i => {
    const values = Object.values(i.enumObject);
    const isNumber = values.some(v => typeof v === 'number');
    return {
      type: isNumber ? 'number' : 'string',
      enum: isNumber ? values.filter(v => typeof v === 'number') : values,
    };
  },
  intersect: (i, ctx) => {
    let objectType: undefined | JsonSchema;
    const constraints: JsonSchema[] = [];
    for (const t of i.intersectees) {
      const s = assertNotOptional(ctx.toJsonSchema(t));
      if (s.type === 'object') {
        if (!objectType) {
          objectType = s;
        } else {
          if (s.required) {
            objectType.required = [...(objectType.required ?? []), ...s.required];
          }
          if (s.properties) {
            objectType.properties = { ...(objectType.properties ?? {}), ...s.properties };
          }
          if (s.additionalProperties !== undefined) {
            objectType.additionalProperties =
              objectType.additionalProperties === false || s.additionalProperties === false
                ? false
                : s.additionalProperties;
          }
        }
      } else {
        constraints.push(s);
      }
    }
    if (objectType) constraints.push(objectType);

    return constraints.length === 1 ? constraints[0] : { allOf: constraints };
  },
  keyOf: i => ({ type: 'string', ...(i.keys.size ? { enum: [...i.keys] } : {}) }),
  named: (i, ctx) => ctx.toJsonSchema(i.underlying, i.name),
  never: () => ({ not: {} }),
  number: () => ({ type: 'number' }),
  object: (i, ctx) => {
    const required: string[] = [];
    const properties = Object.fromEntries(
      Object.entries(i.fields)
        .map(([name, t]) => {
          const fieldType = ctx.toJsonSchema(t);
          if (!i.isPartial && fieldType.type !== 'optional') {
            required.push(name);
          }
          const underlying = fieldType.type === 'optional' ? fieldType.underlying : fieldType;
          if (underlying === undefined) return null;
          return [name, underlying] as const;
        })
        .filter(v => v !== null),
    );
    return { type: 'object', properties, ...(required.length ? { required } : {}) };
  },
  parsed: (i, ctx) => ctx.toJsonSchema(ctx.mode === 'parsed' && i.test ? i.test : i.underlying),
  record: (i, ctx) => {
    const valueType = ctx.toJsonSchema(i.value);
    const underlying = valueType.type === 'optional' ? valueType.underlying : valueType;
    return { type: 'object', additionalProperties: underlying };
  },
  sealed: (i, ctx) => {
    const result = ctx.toJsonSchema(i.underlying);
    const t = result.type === 'optional' ? result.underlying : result;
    if (t && t.type === 'object' && t.additionalProperties === undefined) {
      t.additionalProperties = false;
    }
    return result;
  },
  string: () => ({ type: 'string' }),
  tuple: (i, ctx) => ({
    type: 'array',
    prefixItems: i.components.map(c => assertNotOptional(ctx.toJsonSchema(c))),
    items: false,
  }),
  union: (i, ctx) => {
    let isOptional = false;
    const alternatives: JsonSchema[] = [];
    for (const t of i.alternatives) {
      const s = ctx.toJsonSchema(t);
      if (s.type === 'optional') {
        isOptional = true;
        if (s.underlying) {
          alternatives.push(s.underlying);
        }
      } else {
        alternatives.push(s);
      }
    }

    const result: JsonSchema | undefined =
      alternatives.length === 0
        ? undefined
        : alternatives.length === 1
          ? alternatives[0]
          : { anyOf: alternatives };
    if (isOptional) return { type: 'optional', underlying: result };
    if (result === undefined) return { not: {} };
    return result;
  },
  unknown: () => ({}),
};
