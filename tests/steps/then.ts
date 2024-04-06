import {
  AdminGetUserCommand,
  CognitoIdentityProviderClient,
  AdminListGroupsForUserCommand
} from '@aws-sdk/client-cognito-identity-provider';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  ScanCommand
} from '@aws-sdk/lib-dynamodb';

const { TABLE_NAME, UserPoolId } = process.env;
const cognito = new CognitoIdentityProviderClient();
const ddbClient = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(ddbClient);

const tenant_exists_in_DynamoDB = async (tenant) => {
  console.log(`looking for tenant [${tenant.id}] in table [${TABLE_NAME}]`);
  const resp = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `TENANT#${tenant.id}`,
        SK: 'DETAILS'
      }
    })
  );

  expect(resp.Item).toBeTruthy();

  return resp.Item;
};

const user_exists_in_DynamoDB = async (username: string, tenantId: string) => {
  console.log(`looking for user [${username}] in tenant [${tenantId}]`);
  const resp = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `TENANT#${tenantId}`,
        SK: `USER#${username}`
      }
    })
  );

  expect(resp.Item).toBeTruthy();

  return resp.Item;
};

const user_exists_in_Cognito = async (username) => {
  console.log(`looking for user [${username}] in user pool [${UserPoolId}]`);
  const resp = await cognito.send(
    new AdminGetUserCommand({
      UserPoolId: UserPoolId,
      Username: username
    })
  );

  expect(resp.Username).toBeTruthy();

  return resp;
};

const user_belongs_to_CognitoGroup = async (username, group) => {
  console.log(`looking for user [${username}] in group [${group}]`);
  const resp = await cognito.send(
    new AdminListGroupsForUserCommand({
      UserPoolId: UserPoolId,
      Username: username
    })
  );

  expect(resp.Groups).toBeTruthy();
  expect(resp.Groups.some((g) => g.GroupName === group)).toBeTruthy();

  return resp;
};

const user_confirmation_exists_in_DynamoDB = async (username, tenantId) => {
  console.log(
    `looking for confirmation for user [${username}] under tenant [${tenantId}]`
  );
  const resp = await docClient.send(
    new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: 'SK = :sk',
      ExpressionAttributeValues: {
        ':sk': `TENANT#${tenantId}#USER#${username}`
      }
    })
  );

  expect(resp.Items[0]).toBeTruthy();

  return resp.Items[0];
};

export default {
  tenant_exists_in_DynamoDB,
  user_exists_in_DynamoDB,
  user_exists_in_Cognito,
  user_belongs_to_CognitoGroup,
  user_confirmation_exists_in_DynamoDB
};
