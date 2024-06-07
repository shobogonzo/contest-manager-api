import { User } from '../../../src/generated/graphql';
import given from '../../steps/given';
import teardown from '../../steps/teardown';
import then from '../../steps/then';
import when from '../../steps/when';

describe('New tenant signs up for Contest Manager', () => {
  let user: User & { password: string; tenantName: string };
  let tenant: any;

  beforeAll(async () => {
    user = given.a_random_user();
    await when.a_user_signs_up(user);
  });

  afterAll(async () => {
    await teardown.a_user(user.username, tenant.id, true);
    await teardown.a_tenant(tenant);
  });

  describe('When the user account is created', () => {
    it('Creates a new tenant in DynamoDB', async () => {
      const ddbTenant = await then.tenant_exists_in_DynamoDB(user.tenantName);
      tenant = {
        id: ddbTenant.PK.split('#')[1],
        name: ddbTenant.name
      };
    });
  });

  describe('When the user confirms their account', () => {
    beforeAll(async () => {
      await when.a_user_confirms_cognito_account(user);
    });

    it('Stores tenantId as a custom claim', async () => {
      const cognitoUser = await then.user_exists_in_Cognito(user.email);
      const tenantIdAttr = cognitoUser.UserAttributes.find(
        (attr) => attr.Name === 'custom:tenantId'
      );
      expect(tenantIdAttr).toBeDefined();
      expect(tenantIdAttr.Value).toEqual(tenant.id);
    });
  });
});
