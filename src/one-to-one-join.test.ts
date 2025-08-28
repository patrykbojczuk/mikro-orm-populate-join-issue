import {
  Entity,
  ManyToOne,
  MikroORM,
  OneToOne,
  PrimaryKey,
  PrimaryKeyProp,
  Property,
  Ref,
} from '@mikro-orm/sqlite';

@Entity()
class Color {
  [PrimaryKeyProp]?: 'colorId';

  @PrimaryKey()
  colorId!: number;

  @Property()
  name!: string;
}

@Entity()
class Badge {
  [PrimaryKeyProp]?: 'badgeId';

  @PrimaryKey()
  badgeId!: number;

  @Property()
  name!: string;

  @ManyToOne({
    entity: () => Color,
  })
  color!: Color;
}

@Entity()
class Profile {
  [PrimaryKeyProp]?: 'user';

  @OneToOne({ entity: () => User, primary: true, ref: true })
  user!: Ref<User>;

  @ManyToOne({
    entity: () => Badge,
  })
  badge!: Badge;
}

@Entity()
class User {
  [PrimaryKeyProp]?: 'userId';

  @PrimaryKey()
  userId!: number;

  @Property()
  name!: string;

  @OneToOne({ entity: () => Profile, mappedBy: (u) => u.user })
  profile?: Profile;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [User, Profile, Badge],
    debug: ['query', 'query-params'],
    allowGlobalContext: true, // only for testing
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('returns user without profile', async () => {
  orm.em.create(User, {
    name: 'John',
  });
  await orm.em.flush();
  orm.em.clear();

  const user = await orm.em.findOneOrFail(
    User,
    { name: 'John' },
    {
      populate: ['profile.badge.color'],
    },
  );

  expect(user).toMatchInlineSnapshot(`
    {
      "name": "John",
      "profile": null,
      "userId": 1,
    }
  `);
});
