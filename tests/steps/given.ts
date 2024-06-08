import dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: '.env.test.local' });

import {
  CognitoIdentityProviderClient,
  AdminAddUserToGroupCommand,
  InitiateAuthCommand,
  AdminCreateUserCommand,
  RespondToAuthChallengeCommand
} from '@aws-sdk/client-cognito-identity-provider';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { UserRole } from '../../src/generated/graphql';
import { forIn } from 'lodash';

const { SERVICE_NAME, UserPoolId, UserPoolClientId } = process.env;
const chance = require('chance').Chance();
const client = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(client);
const cognito = new CognitoIdentityProviderClient();

const a_random_user = () => {
  const firstName = chance.first({ nationality: 'en' });
  const lastName = chance.last({ nationality: 'en' });
  const email = `${firstName}-${lastName}@test.com`;
  const password = chance.string({ length: 10, password: true });
  const tenantName = chance.company();
  const username = email;
  const status = chance.pickone(['active', 'inactive']);
  const roles = chance.pickset(
    [
      UserRole.Admin,
      UserRole.Director,
      UserRole.Scheduler,
      UserRole.Contestant,
      UserRole.Judge
    ],
    chance.natural({ min: 1, max: 5 })
  );

  return {
    firstName,
    lastName,
    email,
    password,
    tenantName,
    username,
    status,
    roles
  };
};

const a_random_tenant = () => {
  const id = chance.guid();
  const name = chance.company();
  const createdAt = new Date().toJSON();

  return {
    id,
    name,
    createdAt
  };
};

const an_existing_tenant = async (name: string) => {
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
        GSI1PK: `TENANTNAME#${name}`,
        GSI1SK: `TENANT#${tenantId}`,
        createdAt: new Date().toISOString()
      }
    })
  );

  return {
    id: tenantId,
    name,
    createdAt
  };
};

const an_unconfirmed_user = async (tenant: { id: string; name: string }) => {
  const firstName = chance.first({ nationality: 'en' });
  const lastName = chance.last({ nationality: 'en' });
  const suffix = chance.string({
    length: 6,
    pool: 'abcdefghijklmnopqrstuvwxyz'
  });
  const username = `${firstName.charAt(0)}${lastName}-${suffix}`.toLowerCase();
  const email = `${firstName}-${lastName}-${suffix}@test.com`;
  const password = chance.string({ length: 10, password: true });

  console.log(`adding user [${username}] to tenant [${tenant.id}]`);
  await cognito.send(
    new AdminCreateUserCommand({
      UserPoolId: UserPoolId,
      Username: username,
      MessageAction: 'SUPPRESS',
      TemporaryPassword: password,
      UserAttributes: [
        { Name: 'given_name', Value: firstName },
        { Name: 'family_name', Value: lastName },
        { Name: 'email', Value: email },
        { Name: 'custom:tenantName', Value: tenant.name }
      ]
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
  const tenantId = roles.some((x) => x === UserRole.SuperUser)
    ? SERVICE_NAME
    : chance.guid();

  const { username, firstName, lastName, email } =
    await an_unconfirmed_user(tenantId);
  const tmpPassword = chance.string({ length: 10, password: true });
  console.log(
    `[${username}] - creating Cognito user under tenant [${tenantId}]`
  );

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
  a_random_tenant,
  an_existing_tenant,
  an_unconfirmed_user,
  an_authenticated_user
};
