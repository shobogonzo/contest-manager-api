import { User } from '../../../src/generated/graphql';
import given from '../../steps/given';
import teardown from '../../steps/teardown';
import then from '../../steps/then';
import when from '../../steps/when';
import retry from 'async-retry';
import { Chance } from 'chance';
const chance = new Chance();

describe('New tenant signs up for Contest Manager', () => {
  let user: User & { password: string };
  let tenant: { id?: string; name: string };

  beforeAll(async () => {
    user = given.a_random_user();
    tenant = given.a_random_tenant();
    tenant.id = undefined;

    await when.a_user_signs_up(user, tenant.name);
  });

  afterAll(async () => {
    await teardown.a_user(user.username, tenant.id, true);
    await teardown.a_tenant(tenant.id);
  });

  describe('When the user account is created', () => {
    it('Creates a new tenant in DynamoDB', async () => {
      await retry(
        async () => {
          const ddbTenant = await then.tenant_exists_in_DynamoDB(tenant.name);
          tenant = {
            id: ddbTenant.PK.split('#')[1],
            name: ddbTenant.name
          };
        },
        {
          retries: 3,
          minTimeout: 1000
        }
      );
    });
  });

  describe('When the user confirms their account', () => {
    beforeAll(async () => {
      await when.a_user_confirms_cognito_account(user);
    });

    it('Stores tenantId as a custom claim', async () => {
      await retry(
        async () => {
          const cognitoUser = await then.user_exists_in_Cognito(user.email);
          const tenantIdAttr = cognitoUser.UserAttributes.find(
            (attr) => attr.Name === 'custom:tenantId'
          );
          expect(tenantIdAttr).toBeDefined();
          expect(tenantIdAttr.Value).toEqual(tenant.id);
        },
        {
          retries: 3,
          minTimeout: 1000
        }
      );
    });
  });
});
