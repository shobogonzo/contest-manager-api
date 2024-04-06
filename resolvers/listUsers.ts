import { Context, DynamoDBScanRequest } from '@aws-appsync/utils';
import { QueryListUsersArgs, User } from '../src/generated/graphql';

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

export const response = (ctx: Context): User[] => {
  return ctx.result.items.map((ddbItem: any) => ({
    username: ddbItem.PK.split('#')[1],
    firstName: ddbItem.firstName,
    lastName: ddbItem.lastName,
    email: ddbItem.email
  }));
};
