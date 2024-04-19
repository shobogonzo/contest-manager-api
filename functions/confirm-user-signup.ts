import middy from '@middy/core';
import { Logger } from '@aws-lambda-powertools/logger';
import { injectLambdaContext } from '@aws-lambda-powertools/logger/middleware';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { PutCommand, DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { UserStatus } from '../src/generated/graphql';
import { PostConfirmationTriggerEvent } from 'aws-lambda';

const { SERVICE_NAME, TABLE_NAME } = process.env;
const logger = new Logger({ serviceName: SERVICE_NAME });
const client = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(client);

const lambdaHandler = async (event: PostConfirmationTriggerEvent) => {
  if (event.triggerSource !== 'PostConfirmation_ConfirmSignUp') {
    return event;
  }

  const tenantId = event.request.userAttributes['custom:tenantId'];
  const username = event.userName;
  logger.info(`[${username}] - adding user to tenant [${tenantId}]`);

  try {
    const result = await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: `TENANT#${tenantId}`,
          SK: `USER#${username}`,
          username: username,
          firstName: event.request.userAttributes['given_name'],
          lastName: event.request.userAttributes['family_name'],
          email: event.request.userAttributes['email'],
          phone: event.request.userAttributes['phone_number'],
          status: UserStatus.Enabled,
          roles: event.request.clientMetadata?.roles,
          createdAt: new Date().toISOString()
        },
        ConditionExpression: 'attribute_not_exists(username)'
      })
    );
    logger.info(`[${username}] - added user to tenant [${tenantId}]`, result);
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
