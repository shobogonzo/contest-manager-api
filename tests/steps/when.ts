require('dotenv').config();
import { Context } from 'aws-lambda';
import { User, UserRole } from '../../src/generated/graphql';

const we_invoke_confirmUserSignup = async (user: User, tenantId: string) => {
  const { handler } = await import('../../functions/confirm-user-signup');
  const context = {};
  const event = {
    version: '1',
    region: process.env.AWS_REGION,
    userPoolId: process.env.UserPoolId,
    userName: user.username,
    triggerSource: 'PostConfirmation_ConfirmSignUp',
    request: {
      userAttributes: {
        sub: user.username,
        'cognito:email_alias': user.email,
        'cognito:user_status': 'CONFIRMED',
        email_verified: 'true',
        given_name: user.firstName,
        family_name: user.lastName,
        email: user.email,
        'custom:tenantId': tenantId
      },
      clientMetadata: {
        roles: [UserRole.Administrator, UserRole.Scheduler]
      }
    },
    response: {}
  };

  return await handler(event, context as Context);
};

export default {
  we_invoke_confirmUserSignup
};
