import dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: '.env.test.local' });

import {
  AdminConfirmSignUpCommand,
  CognitoIdentityProviderClient,
  SignUpCommand
} from '@aws-sdk/client-cognito-identity-provider';
import { Context } from 'aws-lambda';
import { User } from '../../src/generated/graphql';

const cognito = new CognitoIdentityProviderClient();

const we_invoke_confirmUserSignup = async (user: User, tenantName: string) => {
  const { handler } = await import('../../functions/confirm-user-signup');
  const context = {};
  const event = {
    version: '1',
    region: 'us-east-1',
    userPoolId: 'us-east-1_0v8QWXNZ7',
    userName: user.username,
    callerContext: {
      awsSdkVersion: 'aws-sdk-unknown-unknown',
      clientId: '7hee44qioktt3tuf1ohhgfg001'
    },
    triggerSource: 'PostConfirmation_ConfirmSignUp',
    request: {
      userAttributes: {
        sub: 'c4d8b4a8-b091-702c-435d-276d025fdea3',
        email_verified: 'true',
        'cognito:user_status': 'CONFIRMED',
        given_name: user.firstName,
        family_name: user.lastName,
        email: user.email,
        'custom:tenantName': tenantName
      }
    },
    response: {}
  };

  return await handler(event, context as Context);
};

const we_invoke_onboardNewTenant = async (
  user: User & { tenantName: string }
) => {
  const { handler } = await import('../../functions/onboard-new-tenant');
  const context = {};
  const event = {
    version: '1',
    region: 'us-east-1',
    userPoolId: 'us-east-1_0v8QWXNZ7',
    userName: user.username,
    callerContext: {
      awsSdkVersion: 'aws-sdk-unknown-unknown',
      clientId: '7hee44qioktt3tuf1ohhgfg001'
    },
    triggerSource: 'PreSignUp_SignUp',
    request: {
      userAttributes: {
        given_name: user.firstName,
        family_name: user.lastName,
        email: user.email,
        'custom:tenantName': user.tenantName
      },
      validationData: null
    },
    response: {
      autoConfirmUser: false,
      autoVerifyEmail: false,
      autoVerifyPhone: false
    }
  };

  await handler(event, context as Context);
};

// Simulates a user signing up with the Amplify Authenticator component. This
// will trigger the PreSignUp_SignUp Lambda
const a_user_signs_up = async (user: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  tenantName: string;
}) => {
  await cognito.send(
    new SignUpCommand({
      ClientId: process.env.UserPoolClientId,
      Username: user.email,
      Password: user.password,
      UserAttributes: [
        { Name: 'given_name', Value: user.firstName },
        { Name: 'family_name', Value: user.lastName },
        { Name: 'email', Value: user.email },
        { Name: 'custom:tenantName', Value: user.tenantName }
      ]
    })
  );
};

// Simulate a user confirming their Cognito account using the PIN that was
// emailed to them. This will trigger the PostConfirmation_ConfirmSignUp Lambda
const a_user_confirms_cognito_account = async (user: { username }) => {
  await cognito.send(
    new AdminConfirmSignUpCommand({
      UserPoolId: process.env.UserPoolId,
      Username: user.username
    })
  );
};

export default {
  we_invoke_confirmUserSignup,
  we_invoke_onboardNewTenant,
  a_user_signs_up,
  a_user_confirms_cognito_account
};
