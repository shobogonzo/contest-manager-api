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
  return ctx.result.items.map((user: any) => ({
    username: user.username,
    status: user.status,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone
  }));
};
