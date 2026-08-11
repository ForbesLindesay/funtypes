import * as ft from './index';

// Our implementation always validates synchronously, so this cast is safe in tests,
// even though the standard-schema spec allows validate() to return a Promise.
function validateSync<T>(schema: ft.StandardSchema<T>, value: unknown) {
  return schema['~standard'].validate(value) as { value: T } | { issues: { message: string }[] };
}

describe('toJsonSchema primitives', () => {
  test('the options parameter is optional, and defaults to parsed mode', () => {
    expect(ft.toJsonSchema(ft.String)).toEqual({ type: 'string' });
    expect(ft.toJsonSchema(ft.Object({ a: ft.WithDefault(ft.String, 'x') }))).toEqual(
      ft.toJsonSchema(ft.Object({ a: ft.WithDefault(ft.String, 'x') }), { mode: 'parsed' }),
    );
  });

  test('string', () => {
    expect(ft.toJsonSchema(ft.String)).toEqual({ type: 'string' });
  });
  test('number', () => {
    expect(ft.toJsonSchema(ft.Number)).toEqual({ type: 'number' });
  });
  test('boolean', () => {
    expect(ft.toJsonSchema(ft.Boolean)).toEqual({ type: 'boolean' });
  });
  test('unknown', () => {
    expect(ft.toJsonSchema(ft.Unknown)).toEqual({});
  });
  test('never', () => {
    expect(ft.toJsonSchema(ft.Never)).toEqual({ not: {} });
  });
  test('literal string/number/boolean', () => {
    expect(ft.toJsonSchema(ft.Literal('foo'))).toEqual({ type: 'string', const: 'foo' });
    expect(ft.toJsonSchema(ft.Literal(42))).toEqual({ type: 'number', const: 42 });
    expect(ft.toJsonSchema(ft.Literal(true))).toEqual({ type: 'boolean', const: true });
  });
  test('literal null', () => {
    expect(ft.toJsonSchema(ft.Null)).toEqual({ type: 'null', const: null });
  });
  test('literal undefined cannot be represented at the top level', () => {
    expect(() => ft.toJsonSchema(ft.Undefined)).toThrow(
      'Cannot represent undefined in JSON Schema',
    );
  });
});

describe('unsupported types', () => {
  test.each([
    ['bigint', ft.BigInt],
    ['function', ft.Function],
    ['instanceof', ft.InstanceOf(Date)],
    ['symbol', ft.Symbol],
  ])('%s throws a clear error', (tag, runtype) => {
    expect(() => ft.toJsonSchema(runtype as any)).toThrow(
      `${tag} funtypes cannot be represented in JSON schema`,
    );
  });

  test('lazy (recursive types) throws a clear error', () => {
    const T: ft.Codec<unknown> = ft.Lazy(() => ft.Object({ child: ft.Optional(T) }) as any);
    expect(() => ft.toJsonSchema(T)).toThrow('lazy funtypes cannot be represented in JSON schema');
  });
});

describe('array/tuple', () => {
  test('array', () => {
    expect(ft.toJsonSchema(ft.Array(ft.Number))).toEqual({
      type: 'array',
      items: { type: 'number' },
    });
  });
  test('array of optional throws, since array elements cannot be absent', () => {
    expect(() => ft.toJsonSchema(ft.Array(ft.Optional(ft.String)))).toThrow(
      'Cannot represent undefined in JSON Schema',
    );
  });
  test('tuple', () => {
    expect(ft.toJsonSchema(ft.Tuple(ft.String, ft.Number))).toEqual({
      type: 'array',
      prefixItems: [{ type: 'string' }, { type: 'number' }],
      items: false,
    });
  });
});

describe('object', () => {
  test('required fields are listed in `required`', () => {
    expect(ft.toJsonSchema(ft.Object({ a: ft.String, b: ft.Number }))).toEqual({
      type: 'object',
      properties: { a: { type: 'string' }, b: { type: 'number' } },
      required: ['a', 'b'],
    });
  });

  test('optional fields are not required, and `required` is omitted entirely when empty', () => {
    const schema = ft.toJsonSchema(ft.Object({ a: ft.Optional(ft.String) }));
    expect(schema).toEqual({
      type: 'object',
      properties: { a: { type: 'string' } },
    });
    expect(schema.required).toBeUndefined();
    expect('required' in schema).toBe(false);
  });

  test('mixed required and optional fields', () => {
    expect(ft.toJsonSchema(ft.Object({ a: ft.String, b: ft.Optional(ft.Number) }))).toEqual({
      type: 'object',
      properties: { a: { type: 'string' }, b: { type: 'number' } },
      required: ['a'],
    });
  });

  test('a field that can only ever be undefined is dropped from properties, and not required', () => {
    const schema = ft.toJsonSchema(ft.Object({ a: ft.Undefined, b: ft.String }));
    expect(schema).toEqual({
      type: 'object',
      properties: { b: { type: 'string' } },
      required: ['b'],
    });
  });
});

describe('record', () => {
  test('record uses additionalProperties for the value type', () => {
    expect(ft.toJsonSchema(ft.Record(ft.String, ft.Number))).toEqual({
      type: 'object',
      additionalProperties: { type: 'number' },
    });
  });

  test('a value type that is itself optional-with-content (e.g. a default) is unwrapped', () => {
    expect(
      ft.toJsonSchema(ft.Record(ft.String, ft.WithDefault(ft.Number, 0)), { mode: 'serialized' }),
    ).toEqual({
      type: 'object',
      additionalProperties: { type: 'number', default: 0, nullable: true },
    });
  });
});

describe('union', () => {
  test('multiple alternatives become anyOf', () => {
    expect(ft.toJsonSchema(ft.Union(ft.String, ft.Number))).toEqual({
      anyOf: [{ type: 'string' }, { type: 'number' }],
    });
  });
  test('Nullable is represented as a union with null', () => {
    expect(ft.toJsonSchema(ft.Nullable(ft.String))).toEqual({
      anyOf: [{ type: 'string' }, { type: 'null', const: null }],
    });
  });
  test('Optional at the top level cannot be represented, since it is meaningless outside an object', () => {
    expect(() => ft.toJsonSchema(ft.Optional(ft.String))).toThrow(
      'Cannot represent undefined in JSON Schema',
    );
  });
  test('Optional used as an object field produces an optional property (regression test)', () => {
    const schema = ft.toJsonSchema(ft.Object({ a: ft.Optional(ft.String) }));
    expect(schema.properties).toEqual({ a: { type: 'string' } });
    expect(schema.required).toBeUndefined();
  });

  test('a union alternative that is itself optional-with-content (e.g. a nested default) contributes its underlying schema', () => {
    const schema = ft.toJsonSchema(
      ft.Object({ a: ft.Union(ft.WithDefault(ft.String, 'fallback'), ft.Number) }),
      { mode: 'serialized' },
    );
    expect(schema.properties).toEqual({
      a: { anyOf: [{ type: 'string', default: 'fallback', nullable: true }, { type: 'number' }] },
    });
    expect(schema.required).toBeUndefined();
  });

  test('a union where every alternative is optional-with-no-content is itself optional with no content', () => {
    expect(() => ft.toJsonSchema(ft.Optional(ft.Undefined))).toThrow(
      'Cannot represent undefined in JSON Schema',
    );
  });

  test('a union with zero alternatives is treated as `never`', () => {
    expect(ft.toJsonSchema(ft.Union())).toEqual({ not: {} });
  });
});

describe('intersect', () => {
  test('object intersectees are merged into a single object schema', () => {
    expect(
      ft.toJsonSchema(ft.Intersect(ft.Object({ a: ft.Number }), ft.Object({ b: ft.String }))),
    ).toEqual({
      type: 'object',
      properties: { a: { type: 'number' }, b: { type: 'string' } },
      required: ['a', 'b'],
    });
  });

  test('a field required by one side stays required even if optional on the other', () => {
    expect(
      ft.toJsonSchema(
        ft.Intersect(
          ft.Object({ a: ft.Number }),
          ft.Object({ a: ft.Optional(ft.Number), b: ft.String }),
        ),
      ),
    ).toEqual({
      type: 'object',
      properties: { a: { type: 'number' }, b: { type: 'string' } },
      required: ['a', 'b'],
    });
  });

  test('sealed (additionalProperties: false) wins when merging with a non-sealed object', () => {
    expect(
      ft.toJsonSchema(
        ft.Intersect(ft.Sealed(ft.Object({ a: ft.Number })) as any, ft.Object({ b: ft.String })),
      ),
    ).toEqual({
      type: 'object',
      properties: { a: { type: 'number' }, b: { type: 'string' } },
      required: ['a', 'b'],
      additionalProperties: false,
    });
  });

  test('sealed wins even when it is the non-first intersectee merged into an already-sealed object', () => {
    expect(
      ft.toJsonSchema(
        ft.Intersect(
          ft.Sealed(ft.Object({ a: ft.Number })) as any,
          ft.Sealed(ft.Object({ b: ft.String })) as any,
        ),
      ),
    ).toEqual({
      type: 'object',
      properties: { a: { type: 'number' }, b: { type: 'string' } },
      required: ['a', 'b'],
      additionalProperties: false,
    });
  });

  test('a non-false additionalProperties (e.g. from a Record) is propagated when merging', () => {
    expect(
      ft.toJsonSchema(
        ft.Intersect(ft.Object({ a: ft.Number }), ft.Record(ft.String, ft.Number) as any),
      ),
    ).toEqual({
      type: 'object',
      properties: { a: { type: 'number' } },
      required: ['a'],
      additionalProperties: { type: 'number' },
    });
  });

  test('non-object intersectees are combined with allOf', () => {
    expect(
      ft.toJsonSchema(
        ft.Intersect(
          ft.Constraint(ft.Number, n => n > 0, { name: 'Positive' }) as any,
          ft.Constraint(ft.Number, n => n < 10, { name: 'SmallerThan10' }) as any,
        ),
      ),
    ).toEqual({
      allOf: [{ $ref: '#/$defs/Positive' }, { $ref: '#/$defs/SmallerThan10' }],
      $defs: {
        Positive: { type: 'number', title: 'Positive' },
        SmallerThan10: { type: 'number', title: 'SmallerThan10' },
      },
    });
  });

  test('merging into an object schema that has no `required`/`properties` of its own (e.g. a Record) still picks up the other side', () => {
    expect(
      ft.toJsonSchema(
        ft.Intersect(ft.Record(ft.String, ft.Number) as any, ft.Object({ a: ft.Number })),
      ),
    ).toEqual({
      type: 'object',
      additionalProperties: { type: 'number' },
      properties: { a: { type: 'number' } },
      required: ['a'],
    });
  });
});

describe('sealed', () => {
  test('sets additionalProperties: false (regression test)', () => {
    expect(ft.toJsonSchema(ft.Sealed(ft.Object({ a: ft.String })))).toEqual({
      type: 'object',
      properties: { a: { type: 'string' } },
      required: ['a'],
      additionalProperties: false,
    });
  });

  test('does not override an already-present additionalProperties', () => {
    expect(ft.toJsonSchema(ft.Sealed(ft.Record(ft.String, ft.Number) as any))).toEqual({
      type: 'object',
      additionalProperties: { type: 'number' },
    });
  });

  test('unwraps an optional-with-content result (e.g. sealing a defaulted object) before checking for an object type', () => {
    const schema = ft.toJsonSchema(
      ft.Object({ x: ft.Sealed(ft.WithDefault(ft.Object({ a: ft.Number }), { a: 1 }) as any) }),
      { mode: 'serialized' },
    );
    expect(schema.properties!.x).toEqual({
      type: 'object',
      properties: { a: { type: 'number' } },
      required: ['a'],
      default: { a: 1 },
      nullable: true,
      additionalProperties: false,
    });
  });
});

describe('enum', () => {
  test('string enum', () => {
    enum Color {
      Red = 'red',
      Blue = 'blue',
    }
    expect(ft.toJsonSchema(ft.Enum('Color', Color))).toEqual({
      type: 'string',
      enum: ['red', 'blue'],
    });
  });

  test('numeric enum ignores the reverse-mapping entries', () => {
    enum Color {
      Red,
      Blue,
    }
    expect(ft.toJsonSchema(ft.Enum('Color', Color))).toEqual({
      type: 'number',
      enum: [0, 1],
    });
  });
});

describe('keyOf', () => {
  test('produces a string enum of the keys', () => {
    expect(ft.toJsonSchema(ft.KeyOf({ a: 1, b: 2 }))).toEqual({
      type: 'string',
      enum: ['a', 'b'],
    });
  });
});

describe('brand/constraint/named ($defs and $ref)', () => {
  test('brand wraps the entity in a named $def', () => {
    expect(ft.toJsonSchema(ft.Brand('Foo', ft.String))).toEqual({
      $ref: '#/$defs/Foo',
      $defs: { Foo: { type: 'string', title: 'Foo' } },
    });
  });

  test('constraint with a name wraps the underlying in a named $def', () => {
    expect(ft.toJsonSchema(ft.Constraint(ft.Number, n => n > 0, { name: 'Positive' }))).toEqual({
      $ref: '#/$defs/Positive',
      $defs: { Positive: { type: 'number', title: 'Positive' } },
    });
  });

  test('constraint without a name is inlined', () => {
    expect(ft.toJsonSchema(ft.Constraint(ft.Number, n => n > 0))).toEqual({
      type: 'number',
    });
  });

  test('the same named type used twice is de-duplicated via $ref', () => {
    const Point = ft.Named('Point', ft.Object({ x: ft.Number, y: ft.Number }));
    const Line = ft.Object({ from: Point, to: Point });
    expect(ft.toJsonSchema(Line)).toEqual({
      type: 'object',
      properties: { from: { $ref: '#/$defs/Point' }, to: { $ref: '#/$defs/Point' } },
      required: ['from', 'to'],
      $defs: {
        Point: {
          type: 'object',
          properties: { x: { type: 'number' }, y: { type: 'number' } },
          required: ['x', 'y'],
          title: 'Point',
        },
      },
    });
  });

  test('two distinct named types that share a name get suffixed ($ref names never collide)', () => {
    const A = ft.Named('Dup', ft.Object({ a: ft.Number }));
    const B = ft.Named('Dup', ft.Object({ b: ft.String }));
    const schema = ft.toJsonSchema(ft.Object({ x: A, y: B }));
    expect(schema.properties).toEqual({
      x: { $ref: '#/$defs/Dup' },
      y: { $ref: '#/$defs/Dup_1' },
    });
    expect(Object.keys(schema.$defs!)).toEqual(['Dup', 'Dup_1']);
  });

  test('a name that is not a valid identifier is inlined instead of creating a $ref', () => {
    const T = ft.Named('123 not an identifier!', ft.Object({ a: ft.Number }));
    const schema = ft.toJsonSchema(T);
    expect(schema.$ref).toBeUndefined();
    expect(schema.title).toBe('123 not an identifier!');
    expect(schema.type).toBe('object');
  });
});

describe('comment', () => {
  test('sets title/description on the underlying schema', () => {
    expect(
      ft.toJsonSchema(
        ft.WithComment({ title: 'A title', description: 'A description' }, ft.String),
      ),
    ).toEqual({ type: 'string', title: 'A title', description: 'A description' });
  });

  test('documenting an optional field preserves its optionality', () => {
    const schema = ft.toJsonSchema(
      ft.Object({ a: ft.WithComment({ title: 'A title' }, ft.Optional(ft.String)) }),
    );
    expect(schema.properties).toEqual({ a: { type: 'string', title: 'A title' } });
    expect(schema.required).toBeUndefined();
  });

  test('documenting a field with no content (e.g. Undefined) drops the field entirely, and does not throw', () => {
    const schema = ft.toJsonSchema(
      ft.Object({ a: ft.WithComment({ title: 'A title' }, ft.Undefined), b: ft.String }),
    );
    expect(schema.properties).toEqual({ b: { type: 'string' } });
  });
});

describe('default', () => {
  test('parsed mode: the field is always present and annotated with a default', () => {
    expect(
      ft.toJsonSchema(ft.Object({ a: ft.WithDefault(ft.String, 'x') }), { mode: 'parsed' }),
    ).toEqual({
      type: 'object',
      properties: { a: { type: 'string', default: 'x' } },
      required: ['a'],
    });
  });

  test('serialized mode: the field also accepts null/missing, since those are replaced by the default', () => {
    const schema = ft.toJsonSchema(ft.Object({ a: ft.WithDefault(ft.String, 'x') }), {
      mode: 'serialized',
    });
    expect(schema).toEqual({
      type: 'object',
      properties: { a: { type: 'string', default: 'x', nullable: true } },
    });
    expect(schema.required).toBeUndefined();
  });

  test('a default whose underlying type has no content is left untouched', () => {
    const schema = ft.toJsonSchema(
      ft.Object({ a: ft.WithDefault(ft.Undefined as any, undefined as any), b: ft.String }),
    );
    expect(schema.properties).toEqual({ b: { type: 'string' } });
  });

  test('a default wrapping another optional-with-content value (nested default) still ends up optional', () => {
    const schema = ft.toJsonSchema(
      ft.Object({ a: ft.WithDefault(ft.WithDefault(ft.String, 'inner') as any, 'outer') }),
      { mode: 'serialized' },
    );
    expect(schema.properties).toEqual({
      a: { type: 'string', default: 'outer', nullable: true },
    });
    expect(schema.required).toBeUndefined();
  });
});

describe('withParser (ParsedValue)', () => {
  test('a custom toJsonSchema callback takes priority over the default handling', () => {
    const T = ft.String.withParser({
      parse: v => ({ success: true, value: v.length }),
      toJsonSchema: () => ({ type: 'number', description: 'string length' }),
    });
    expect(ft.toJsonSchema(T)).toEqual({
      type: 'number',
      description: 'string length',
    });
  });

  test('parsed mode uses `test` (the post-parse shape) when provided', () => {
    const T = ft.String.withParser({
      parse: v => ({ success: true, value: v.length }),
      test: ft.Number,
    });
    expect(ft.toJsonSchema(T, { mode: 'parsed' })).toEqual({ type: 'number' });
  });

  test('serialized mode always describes the pre-parse (wire) shape', () => {
    const T = ft.String.withParser({
      parse: v => ({ success: true, value: v.length }),
      test: ft.Number,
    });
    expect(ft.toJsonSchema(T, { mode: 'serialized' })).toEqual({ type: 'string' });
  });

  test('parsed mode without a `test` falls back to describing the underlying shape', () => {
    const T = ft.String.withParser({ parse: v => ({ success: true, value: v.length }) });
    expect(ft.toJsonSchema(T, { mode: 'parsed' })).toEqual({ type: 'string' });
  });
});

describe('assertNotOptional', () => {
  test('passes through a normal schema unchanged', () => {
    expect(ft.assertNotOptional({ type: 'string' })).toEqual({ type: 'string' });
  });
  test('throws for an optional result', () => {
    expect(() => ft.assertNotOptional({ type: 'optional' })).toThrow(
      'Cannot represent undefined in JSON Schema',
    );
  });
});

describe('toStandardJsonSchema', () => {
  test('conforms to the standard-schema vendor/version contract', () => {
    const schema = ft.toStandardJsonSchema(ft.Object({ a: ft.String }));
    expect(schema['~standard'].vendor).toBe('funtypes');
    expect(schema['~standard'].version).toBe(1);
  });

  test('validate defaults to parse semantics', () => {
    const schema = ft.toStandardJsonSchema(ft.Object({ a: ft.WithDefault(ft.String, 'default') }));
    expect(validateSync(schema, { a: undefined })).toEqual({ value: { a: 'default' } });
    expect(validateSync(schema, { a: 42 })).toEqual({
      issues: [{ message: expect.stringContaining('Unable to assign') }],
    });
  });

  test('validateMode: "serialize" runs safeSerialize instead of safeParse', () => {
    const schema = ft.toStandardJsonSchema(ft.Object({ a: ft.String }), {
      validateMode: 'serialize',
    });
    expect(validateSync(schema, { a: 'hi' })).toEqual({ value: { a: 'hi' } });
    const result = validateSync(schema, { a: 42 });
    expect('issues' in result && result.issues).toHaveLength(1);
    expect('issues' in result && typeof result.issues[0].message).toBe('string');
  });

  test('validateMode: "assert" catches thrown ValidationErrors and reports them as issues', () => {
    const schema = ft.toStandardJsonSchema(ft.Object({ a: ft.String }), {
      validateMode: 'assert',
    });
    expect(validateSync(schema, { a: 'hi' })).toEqual({ value: { a: 'hi' } });
    const result = validateSync(schema, { a: 42 });
    expect('issues' in result).toBe(true);
  });

  test('jsonSchema.input/output reflect the configured jsonSchemaMode (default: input=serialized, output=parsed)', () => {
    const schema = ft.toStandardJsonSchema(ft.Object({ a: ft.WithDefault(ft.String, 'x') }));
    const input = schema['~standard'].jsonSchema.input({ target: 'draft-2020-12' });
    const output = schema['~standard'].jsonSchema.output({ target: 'draft-2020-12' });
    expect(input.properties).toEqual({
      a: { type: 'string', default: 'x', nullable: true },
    });
    expect(output.properties).toEqual({ a: { type: 'string', default: 'x' } });
    expect(output.required).toEqual(['a']);
  });

  test('jsonSchema.input/output can be overridden independently', () => {
    const schema = ft.toStandardJsonSchema(ft.Object({ a: ft.WithDefault(ft.String, 'x') }), {
      jsonSchemaMode: { input: 'parsed', output: 'parsed' },
    });
    const input = schema['~standard'].jsonSchema.input({ target: 'draft-2020-12' });
    expect(input).toEqual(schema['~standard'].jsonSchema.output({ target: 'draft-2020-12' }));
  });

  test('repeated calls with the same target are cached (same object reference)', () => {
    const schema = ft.toStandardJsonSchema(ft.Object({ a: ft.String }));
    const first = schema['~standard'].jsonSchema.output({ target: 'draft-2020-12' });
    const second = schema['~standard'].jsonSchema.output({ target: 'draft-2020-12' });
    expect(first).toBe(second);
  });

  test('the cached schema is reused regardless of which target is requested, since target has no effect on the output', () => {
    const schema = ft.toStandardJsonSchema(ft.Object({ a: ft.String }));
    const draft2020 = schema['~standard'].jsonSchema.output({ target: 'draft-2020-12' });
    const draft07 = schema['~standard'].jsonSchema.output({ target: 'draft-07' });
    expect(draft2020).toBe(draft07);
  });

  test('calling toStandardJsonSchema again with the same runtype and options returns the cached schema', () => {
    const runtype = ft.Object({ a: ft.String });
    expect(ft.toStandardJsonSchema(runtype)).toBe(ft.toStandardJsonSchema(runtype));
  });

  test('different options produce distinct (uncached) schemas', () => {
    const runtype = ft.Object({ a: ft.String });
    expect(ft.toStandardJsonSchema(runtype)).not.toBe(
      ft.toStandardJsonSchema(runtype, { validateMode: 'assert' }),
    );
  });

  test('toJsonSchema throws propagate out of jsonSchema.input/output for unrepresentable types', () => {
    const schema = ft.toStandardJsonSchema(ft.Optional(ft.String) as any);
    expect(() => schema['~standard'].jsonSchema.output({ target: 'draft-2020-12' })).toThrow(
      'Cannot represent undefined in JSON Schema',
    );
  });
});

describe('some JSON Schema drafts (e.g. draft-07/draft-04/openapi-3.0) require non-empty `required`/`enum` arrays', () => {
  test('a fully-optional object never emits an empty `required` array', () => {
    const schema = ft.toJsonSchema(ft.Object({ a: ft.Optional(ft.String) }));
    expect('required' in schema).toBe(false);
  });

  test('KeyOf never emits an empty `enum` array', () => {
    const schema = ft.toJsonSchema(ft.KeyOf({}));
    expect('enum' in schema).toBe(false);
  });
});
