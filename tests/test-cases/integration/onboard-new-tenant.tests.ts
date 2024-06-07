import given from '../../steps/given';
import when from '../../steps/when';
import then from '../../steps/then';
import teardown from '../../steps/teardown';
import { User } from '../../../src/generated/graphql';

describe('When onboardNewTenant runs', () => {
  let user: User & { tenantName: string };
  let tenant: { id?: string; name: string };

  beforeAll(async () => {
    user = given.a_random_user();
    user.username = user.email;

    await when.we_invoke_onboardNewTenant(user);
  });

  afterAll(async () => {
    await teardown.a_user(user.username, tenant.id);
    await teardown.a_tenant(tenant);
  });

  it('A new tenant should be created in DynamoDB', async () => {
    const ddbTenant = await then.tenant_exists_in_DynamoDB(user.tenantName);
    tenant = {
      id: ddbTenant.PK.split('#')[1],
      name: ddbTenant.name
    };

    expect(ddbTenant).toMatchObject({
      PK: `TENANT#${tenant.id}`,
      SK: `DETAILS`,
      name: tenant.name,
      GSI1PK: `TENANTNAME#${tenant.name}`,
      GSI1SK: `TENANT#${tenant.id}`,
      createdAt: expect.stringMatching(
        /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d(?:\.\d+)?Z?/g
      )
    });
  });
});
