import { BigInt as BigIntCodec, Boolean } from '..';

test('BigInt', () => {
  expect(BigIntCodec.safeParse(BigInt('123'))).toMatchInlineSnapshot(`
    Object {
      "success": true,
      "value": 123n,
    }
  `);
});
test('BigInt with string literal', () => {
  expect(BigIntCodec.safeParse('123')).toMatchInlineSnapshot(`
    Object {
      "message": "Expected bigint, but was \\"123\\" (i.e. a string literal)",
      "success": false,
    }
  `);
});
test('BigInt with number literal', () => {
  expect(BigIntCodec.safeParse(123)).toMatchInlineSnapshot(`
    Object {
      "message": "Expected bigint, but was 123",
      "success": false,
    }
  `);
});

test('Boolean with string literal', () => {
  expect(Boolean.safeParse('true')).toMatchInlineSnapshot(`
    Object {
      "message": "Expected boolean, but was \\"true\\" (i.e. a string literal)",
      "success": false,
    }
  `);
});
