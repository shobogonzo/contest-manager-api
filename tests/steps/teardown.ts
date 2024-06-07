import dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: '.env.test.local' });

import {
  AdminDeleteUserCommand,
  CognitoIdentityProviderClient
} from '@aws-sdk/client-cognito-identity-provider';

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DeleteCommand, DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const { TABLE_NAME, UserPoolId } = process.env;
const cognito = new CognitoIdentityProviderClient();
const ddbClient = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(ddbClient);

const a_tenant = async (tenant) => {
  await docClient.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `TENANT#${tenant.id}`,
        SK: 'DETAILS'
      }
    })
  );
  console.log(`[${tenant.id}] - tenant deleted`);
};

const a_user = async (
  username: string,
  tenantId: string,
  deleteFromCognito: boolean = false
) => {
  if (!username || !tenantId) {
    throw new Error('username and tenantId required');
  }
  console.log(`[${username}] - deleting user from tenant [${tenantId}]`);
  await docClient.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `TENANT#${tenantId}#USER#${username}`,
        SK: 'DETAILS'
      }
    })
  );

  if (deleteFromCognito) {
    console.log(`[${username}] - deleting user from user pool [${UserPoolId}]`);
    await cognito.send(
      new AdminDeleteUserCommand({
        UserPoolId: UserPoolId,
        Username: username
      })
    );
    console.log(`[${username}] - user deleted from user pool [${UserPoolId}]`);
  }
};

export default {
  a_tenant,
  a_user
};
