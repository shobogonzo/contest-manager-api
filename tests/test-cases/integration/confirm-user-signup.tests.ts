import given from '../../steps/given';
import when from '../../steps/when';
import then from '../../steps/then';
import teardown from '../../steps/teardown';
import { User } from '../../../src/generated/graphql';
const chance = require('chance').Chance();

describe('When confirmUserSignup runs', () => {
  let tenant: { id: any; name: string; createdAt: string };
  let user: User;

  beforeAll(async () => {
    tenant = await given.an_existing_tenant(chance.company());
    user = await given.an_unconfirmed_user(tenant);

    await when.we_invoke_confirmUserSignup(user, tenant.name);
  });

  afterAll(async () => {
    await teardown.a_user(user.username, tenant.id, true);
    await teardown.a_tenant(tenant.id);
  });

  it('A new user should be created in DynamoDB', async () => {
    const ddbUser = await then.user_exists_in_DynamoDB(
      user.username,
      tenant.id
    );

    expect(ddbUser).toMatchObject({
      PK: `TENANT#${tenant.id}#USER#${user.username}`,
      SK: 'DETAILS',
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      GSI1PK: `TENANT#${tenant.id}#USERS`,
      GSI1SK: `USER#${user.username}`,
      createdAt: expect.stringMatching(
        /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d(?:\.\d+)?Z?/g
      )
    });
  });
});
