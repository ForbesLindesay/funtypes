import * as ta from 'type-assertions';
import { Array, ReadonlyArray, Literal, Object } from '..';

const recordType = Object({ value: Literal(42) });
const record = { value: 42 };

test('Array', () => {
  const dictionary = Array(recordType);
  ta.assert<ta.Equal<ReturnType<typeof dictionary['check']>, { value: 42 }[]>>();
  expect(dictionary.safeParse([record, record, record])).toMatchInlineSnapshot(`
    Object {
      "success": true,
      "value": Array [
        Object {
          "value": 42,
        },
        Object {
          "value": 42,
        },
        Object {
          "value": 42,
        },
      ],
    }
  `);
  expect(dictionary.safeParse([record, 10, record])).toMatchInlineSnapshot(`
    Object {
      "fullError": Array [
        "Unable to assign [{value: 42}, 10, {value: 42}] to { value: 42; }[]:",
        Array [
          "The types of [1] are not compatible:",
          Array [
            "Expected { value: 42; }, but was number",
          ],
        ],
      ],
      "key": "[1]",
      "message": "Expected { value: 42; }, but was number",
      "success": false,
    }
  `);
});

test('Array.asReadonly', () => {
  const dictionary = Array(recordType).asReadonly();
  ta.assert<ta.Equal<ReturnType<typeof dictionary['check']>, readonly { value: 42 }[]>>();
  expect(dictionary.safeParse([record, record, record])).toMatchInlineSnapshot(`
    Object {
      "success": true,
      "value": Array [
        Object {
          "value": 42,
        },
        Object {
          "value": 42,
        },
        Object {
          "value": 42,
        },
      ],
    }
  `);
  expect(dictionary.safeParse([record, 10, record])).toMatchInlineSnapshot(`
    Object {
      "fullError": Array [
        "Unable to assign [{value: 42}, 10, {value: 42}] to readonly { value: 42; }[]:",
        Array [
          "The types of [1] are not compatible:",
          Array [
            "Expected { value: 42; }, but was number",
          ],
        ],
      ],
      "key": "[1]",
      "message": "Expected { value: 42; }, but was number",
      "success": false,
    }
  `);
});

test('ReadonlyArray', () => {
  const dictionary = ReadonlyArray(recordType);
  ta.assert<ta.Equal<ReturnType<typeof dictionary['check']>, readonly { value: 42 }[]>>();
  expect(dictionary.safeParse([record, record, record])).toMatchInlineSnapshot(`
    Object {
      "success": true,
      "value": Array [
        Object {
          "value": 42,
        },
        Object {
          "value": 42,
        },
        Object {
          "value": 42,
        },
      ],
    }
  `);
  expect(dictionary.safeParse([record, 10, record])).toMatchInlineSnapshot(`
    Object {
      "fullError": Array [
        "Unable to assign [{value: 42}, 10, {value: 42}] to readonly { value: 42; }[]:",
        Array [
          "The types of [1] are not compatible:",
          Array [
            "Expected { value: 42; }, but was number",
          ],
        ],
      ],
      "key": "[1]",
      "message": "Expected { value: 42; }, but was number",
      "success": false,
    }
  `);
});
