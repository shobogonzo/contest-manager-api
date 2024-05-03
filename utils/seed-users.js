const dotenv = require('dotenv');
dotenv.config();
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  BatchWriteCommand
} = require('@aws-sdk/lib-dynamodb');
const { Chance } = require('chance');
const chance = new Chance();
const _ = require('lodash');
const dbClient = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(dbClient);

const userSeedData = Array.from({ length: 50 }, () => {
  const tenantId = chance.guid();
  const username = chance.word({ length: 8, nationality: 'en' });

  return {
    PK: `TENANT#${tenantId}`,
    SK: `USER#${username}`,
    username,
    firstName: chance.first({ nationality: 'en' }),
    lastName: chance.last({ nationality: 'en' }),
    email: chance.email(),
    phone: chance.phone(),
    status: 'ENABLED',
    roles: [
      chance.pickone([
        'SUPER_USER',
        'ADMINISTRATOR',
        'SCHEDULER',
        'DIRECTOR',
        'CONTESTANT',
        'JUDGE'
      ])
    ],
    createdAt: chance.date().toISOString()
  };
});

const batchWriteUsers = async (userSeedData) => {
  console.log('Seeding user data...');
  const chunks = _.chunk(userSeedData, 25);

  for (const chunk of chunks) {
    const cmd = {
      RequestItems: {
        [process.env.TABLE_NAME]: chunk.map((item) => ({
          PutRequest: {
            Item: item
          }
        }))
      }
    };

    await docClient.send(new BatchWriteCommand(cmd));
  }
  console.log('Finished seeding');
};

try {
  batchWriteUsers(userSeedData);
} catch (error) {
  console.error('Error seeding user data', error);
}
