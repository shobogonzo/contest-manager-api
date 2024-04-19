require('dotenv').config();
import {
  CognitoIdentityProviderClient,
  AdminAddUserToGroupCommand,
  InitiateAuthCommand,
  AdminCreateUserCommand,
  RespondToAuthChallengeCommand
} from '@aws-sdk/client-cognito-identity-provider';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { UserRole, UserStatus } from '../../src/generated/graphql';
import { forIn } from 'lodash';

const client = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(client);
const chance = require('chance').Chance();

const a_random_user = () => {
  const firstName = chance.first({ nationality: 'en' });
  const lastName = chance.last({ nationality: 'en' });
  const email = `${firstName}-${lastName}@test.com`;
  const username = email;
  const phone = chance.phone({ formatted: false });
  const password = chance.string({ length: 10, password: true });

  return {
    username,
    firstName,
    lastName,
    email,
    phone,
    password
  };
};

const an_existing_tenant = async (name: string, status: string) => {
  const tenantId = chance.guid();

  console.log(`creating tenant [${name}] - [${tenantId}]`);
  const createdAt = new Date().toJSON();
  await docClient.send(
    new PutCommand({
      TableName: process.env.TABLE_NAME,
      Item: {
        PK: `TENANT#${tenantId}`,
        SK: `DETAILS`,
        name,
        status,
        createdAt
      }
    })
  );

  return {
    id: tenantId,
    name,
    status,
    createdAt
  };
};

const an_existing_user = async (
  roles: UserRole[],
  status: UserStatus,
  tenantId: string
) => {
  const firstName = chance.first({ nationality: 'en' });
  const lastName = chance.last({ nationality: 'en' });
  const suffix = chance.string({
    length: 6,
    pool: 'abcdefghijklmnopqrstuvwxyz'
  });
  const username = `${firstName.charAt(0)}${lastName}-${suffix}`.toLowerCase();
  const email = `${firstName}-${lastName}-${suffix}@test.com`;

  console.log(
    `adding user [${username}] to tenant [${tenantId}] in table [${process.env.TABLE_NAME}]`
  );
  await docClient.send(
    new PutCommand({
      TableName: process.env.TABLE_NAME,
      Item: {
        PK: `TENANT#${tenantId}`,
        SK: `USER#${username}`,
        username,
        firstName,
        lastName,
        email,
        roles,
        status,
        createdAt: new Date().toJSON()
      }
    })
  );

  return {
    username,
    firstName,
    lastName,
    email
  };
};

const an_authenticated_user = async (roles: UserRole[]) => {
  const { SERVICE_NAME, UserPoolId, UserPoolClientId } = process.env;
  const tenantId = roles.some((x) => x === UserRole.SuperUser)
    ? SERVICE_NAME
    : chance.guid();

  const { username, firstName, lastName, email } = await an_existing_user(
    roles,
    UserStatus.Enabled,
    tenantId
  );
  const tmpPassword = chance.string({ length: 10, password: true });
  console.log(
    `[${username}] - creating Cognito user under tenant [${tenantId}]`
  );

  const cognito = new CognitoIdentityProviderClient();
  await cognito.send(
    new AdminCreateUserCommand({
      UserPoolId: UserPoolId,
      Username: username,
      MessageAction: 'SUPPRESS',
      TemporaryPassword: tmpPassword,
      UserAttributes: [
        { Name: 'email', Value: email },
        { Name: 'given_name', Value: firstName },
        { Name: 'family_name', Value: lastName },
        { Name: 'custom:tenantId', Value: tenantId },
        { Name: 'email_verified', Value: 'true' }
      ],
      ClientMetadata: { roles: JSON.stringify(roles) }
    })
  );
  console.log(`[${username}] - user has signed up [${email}]`);

  forIn(roles, async (role: UserRole) => {
    await cognito.send(
      new AdminAddUserToGroupCommand({
        UserPoolId: UserPoolId,
        Username: username,
        GroupName: role
      })
    );
    console.log(`[${username}] - added to ${role} group`);
  });

  const initAuth = await cognito.send(
    new InitiateAuthCommand({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: UserPoolClientId,
      AuthParameters: {
        USERNAME: username,
        PASSWORD: tmpPassword
      }
    })
  );

  const newPassword = chance.string({ length: 10, password: true });
  await cognito.send(
    new RespondToAuthChallengeCommand({
      ClientId: UserPoolClientId,
      ChallengeName: 'NEW_PASSWORD_REQUIRED',
      Session: initAuth.Session,
      ChallengeResponses: {
        USERNAME: username,
        NEW_PASSWORD: newPassword
      }
    })
  );

  const auth = await cognito.send(
    new InitiateAuthCommand({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: UserPoolClientId,
      AuthParameters: {
        USERNAME: username,
        PASSWORD: newPassword
      }
    })
  );
  console.log(`$[${username}] - signed in`);

  return {
    username,
    firstName,
    lastName,
    email,
    idToken: auth.AuthenticationResult.IdToken,
    accessToken: auth.AuthenticationResult.AccessToken
  };
};

export default {
  a_random_user,
  an_existing_tenant,
  an_existing_user,
  an_authenticated_user
};
