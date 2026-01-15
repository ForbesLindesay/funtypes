import { Object as ObjectType, ReadonlyPartial, showType, String } from '..';

test('Object', () => {
  const CrewMember = ObjectType({
    name: String,
    rank: String,
    home: String,
  });

  expect(showType(CrewMember)).toMatchInlineSnapshot(
    `"{ name: string; rank: string; home: string }"`,
  );
  expect(CrewMember.safeParse({ name: 'my name', rank: 'my rank', home: 'my home' }))
    .toMatchInlineSnapshot(`
    {
      "success": true,
      "value": {
        "home": "my home",
        "name": "my name",
        "rank": "my rank",
      },
    }
  `);
});

test('ReadonlyPartial', () => {
  const CrewMember = ReadonlyPartial({
    name: String,
    rank: String,
    home: String,
  });

  expect(showType(CrewMember)).toMatchInlineSnapshot(
    `"{ readonly name?: string; readonly rank?: string; readonly home?: string }"`,
  );
  expect(CrewMember.safeParse({ name: 'my name', home: 'my home' })).toMatchInlineSnapshot(`
    {
      "success": true,
      "value": {
        "home": "my home",
        "name": "my name",
      },
    }
  `);
});
