import middy from '@middy/core';
import { Logger } from '@aws-lambda-powertools/logger';
import { injectLambdaContext } from '@aws-lambda-powertools/logger/middleware';
import {
  AdminAddUserToGroupCommand,
  AdminUpdateUserAttributesCommand,
  CognitoIdentityProviderClient
} from '@aws-sdk/client-cognito-identity-provider';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand
} from '@aws-sdk/lib-dynamodb';
import { UserRole, UserStatus } from '../src/generated/graphql';
import { PostConfirmationTriggerEvent } from 'aws-lambda';

const { SERVICE_NAME, TABLE_NAME } = process.env;
const logger = new Logger({ serviceName: SERVICE_NAME });
const ddbClient = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(ddbClient);
const cognitoClient = new CognitoIdentityProviderClient();

const lambdaHandler = async (event: PostConfirmationTriggerEvent) => {
  if (
    event.triggerSource !== 'PostConfirmation_ConfirmSignUp' &&
    event.triggerSource !== 'PostConfirmation_ConfirmForgotPassword'
  ) {
    return event;
  }

  try {
    const username = event.userName;

    logger.info(`[${username}] - setting tenantId custom claim`);
    const tenantName = event.request.userAttributes['custom:tenantName'];
    const tenantQuery = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :pk',
        ExpressionAttributeValues: {
          ':pk': `TENANTNAME#${tenantName}`
        }
      })
    );

    const tenantId = tenantQuery.Items[0].PK.split('#')[1];
    await cognitoClient.send(
      new AdminUpdateUserAttributesCommand({
        UserPoolId: event.userPoolId,
        Username: username,
        UserAttributes: [
          {
            Name: 'custom:tenantId',
            Value: tenantId
          }
        ]
      })
    );

    logger.info(`[${username}] - saving user to DynamoDB`);

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: `TENANT#${tenantId}#USER#${username}`,
          SK: 'DETAILS',
          username: username,
          firstName: event.request.userAttributes['given_name'],
          lastName: event.request.userAttributes['family_name'],
          email: event.request.userAttributes['email'],
          // status: UserStatus.Enabled,
          // roles,
          createdAt: new Date().toISOString()
        },
        ConditionExpression: 'attribute_not_exists(PK)'
      })
    );

    // for (const role of roles) {
    //   logger.info(`[${username}] - adding user to role [${role}]`);

    //   await cognitoClient.send(
    //     new AdminAddUserToGroupCommand({
    //       UserPoolId: event.userPoolId,
    //       Username: username,
    //       GroupName: role
    //     })
    //   );
    // }

    logger.info(`[${username}] - user saved`);
  } catch (error) {
    logger.critical(error);
    throw error;
  } finally {
    return event;
  }
};

export const handler = middy()
  .use(injectLambdaContext(logger))
  .handler(lambdaHandler);
