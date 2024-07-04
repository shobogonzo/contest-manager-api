const config = {
  overwrite: true,
  schema: ['schema.appsync.graphql', 'schema.api.graphql'],
  generates: {
    'src/generated/graphql.ts': {
      plugins: ['typescript']
    }
  }
};

export default config;
