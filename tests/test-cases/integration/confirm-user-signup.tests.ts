import given from '../../steps/given';
import when from '../../steps/when';
import then from '../../steps/then';
import teardown from '../../steps/teardown';
import { UserRole, UserStatus } from '../../../src/generated/graphql';
const chance = require('chance').Chance();

describe('When confirmUserSignup runs', () => {
  let tenant;
  let user;

  beforeAll(async () => {
    tenant = await given.an_existing_tenant(chance.company(), 'ACTIVE');
    user = given.a_random_user();
    user.username = 'test-user-42';
    user.roles = [UserRole.Administrator, UserRole.Scheduler];
    await when.we_invoke_confirmUserSignup(user, tenant.id);
  });

  afterAll(async () => {
    await teardown.a_tenant(tenant);
    await teardown.a_user(user.username, tenant.id);
  });

  it("The user should be saved in 'Enabled' status", async () => {
    const ddbUser = await then.user_exists_in_DynamoDB(
      user.username,
      tenant.id
    );

    expect(ddbUser).toMatchObject({
      PK: `TENANT#${tenant.id}`,
      SK: `USER#${user.username}`,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      roles: user.roles,
      status: UserStatus.Enabled,
      createdAt: expect.stringMatching(
        /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d(?:\.\d+)?Z?/g
      )
    });
  });
});
