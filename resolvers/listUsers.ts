import { Context, DynamoDBScanRequest } from '@aws-appsync/utils';
import { IUser, QueryListUsersArgs, UsersPage } from '../src/generated/graphql';

export const request = (
  ctx: Context<QueryListUsersArgs>
): DynamoDBScanRequest => {
  const request: DynamoDBScanRequest = {
    operation: 'Scan',
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
