import {
  AppSyncIdentityCognito,
  Context,
  DynamoDBQueryRequest
} from '@aws-appsync/utils';
import { QueryListUsersArgs, UsersPage } from '../src/generated/graphql';

export const request = (
  ctx: Context<QueryListUsersArgs>
): DynamoDBQueryRequest => {
  const cognitoUser = ctx.identity as AppSyncIdentityCognito;
  const tenantId = cognitoUser.claims['custom:tenantId'];

  const request: DynamoDBQueryRequest = {
    operation: 'Query',
    index: 'GSI1',
    query: {
      expression: 'GSI1PK = :pk',
      expressionValues: {
        ':pk': util.dynamodb.toDynamoDB(`TENANT#${tenantId}#USERS`)
      }
    },
    limit: ctx.args.limit,
    nextToken: ctx.args.nextToken,
    consistentRead: false
  };

  return request;
};

export const response = (ctx: Context): UsersPage => {
  return {
    users: ctx.result?.items || [],
    nextToken: ctx.result?.nextToken
  };
};
