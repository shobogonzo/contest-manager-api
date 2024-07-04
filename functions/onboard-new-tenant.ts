import middy from '@middy/core';
import { Logger } from '@aws-lambda-powertools/logger';
import { injectLambdaContext } from '@aws-lambda-powertools/logger/middleware';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { PutCommand, DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { PreSignUpTriggerEvent } from 'aws-lambda';
import { v4 as uuid } from 'uuid';

const { SERVICE_NAME, TABLE_NAME } = process.env;
const logger = new Logger({ serviceName: SERVICE_NAME });
const ddbClient = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(ddbClient);

const lambdaHandler = async (event: PreSignUpTriggerEvent) => {
  if (event.triggerSource !== 'PreSignUp_SignUp') {
    return event;
  }

  const username = event.userName;
  const tenantId = uuid();
  const tenantName = event.request.userAttributes['custom:tenantName'];

  try {
    logger.info(`[${username}] - creating tenant [${tenantId}]`);

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: `TENANT#${tenantId}`,
          SK: `DETAILS`,
          name: tenantName,
          GSI1PK: `TENANTNAME#${tenantName}`,
          GSI1SK: `TENANT#${tenantId}`,
          createdAt: new Date().toISOString()
        },
        ConditionExpression: 'attribute_not_exists(PK)'
      })
    );

    logger.info(`[${username}] - tenant created [${tenantId}]`);
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
