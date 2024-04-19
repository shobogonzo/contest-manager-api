require('dotenv').config({ path: './.env.test.local' });
const fs = require('fs');
const { exec } = require('child_process');

const {
  UserPoolId,
  UserPoolClientId,
  IdentityPoolId,
  GraphQlApiUrl,
  AmplifyConfigBucket
} = process.env;

const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: UserPoolId,
      userPoolClientId: UserPoolClientId,
      identityPoolId: IdentityPoolId,
      region: 'us-east-1'
    }
  },
  API: {
    GraphQL: {
      endpoint: GraphQlApiUrl,
      defaultAuthMode: 'userPool',
      region: 'us-east-1'
    }
  }
};

const configJson = JSON.stringify(amplifyConfig, null, 2);
const filePath = './amplifyconfiguration.json';
fs.writeFile(filePath, configJson, (err) => {
  if (err) {
    console.error(`Error writing file: ${err}`);
    return;
  }
  console.log(`Configuration file created successfully at ${filePath}`);

  const s3Path = `s3://${AmplifyConfigBucket}/default/amplifyconfiguration.json`;
  const command = `aws s3 cp ${filePath} ${s3Path}`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
    console.error(`stderr: ${stderr}`);
  });
});
