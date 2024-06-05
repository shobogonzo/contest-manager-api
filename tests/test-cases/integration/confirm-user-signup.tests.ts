import given from '../../steps/given';
import when from '../../steps/when';
import then from '../../steps/then';
import teardown from '../../steps/teardown';
import { User, UserRole, UserStatus } from '../../../src/generated/graphql';
const chance = require('chance').Chance();

describe('When confirmUserSignup runs', () => {
  let tenant: { id: any; name?: string; status?: string; createdAt?: string };
  let user: User;

  beforeAll(async () => {
    tenant = await given.an_existing_tenant(chance.company(), 'ACTIVE');
    user = given.a_random_user();
    user.roles = [UserRole.Administrator, UserRole.Scheduler];
    await when.we_invoke_confirmUserSignup(user, tenant.id);
  });

  afterAll(async () => {
    await teardown.a_user(user.username, user.lastName, tenant.id);
    await teardown.a_tenant(tenant);
  });

  it("The user should be saved in 'Enabled' status", async () => {
    const ddbUser = await then.user_exists_in_DynamoDB(
      user.username,
      user.lastName,
      tenant.id
    );

    expect(ddbUser).toMatchObject({
      PK: `TENANT#${tenant.id}#USER#${user.username}`,
      SK: `DETAILS#${user.lastName}`,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      roles: user.roles,
      status: UserStatus.Enabled,
      createdAt: expect.stringMatching(
        /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d(?:\.\d+)?Z?/g
      )
    });
  });
});
