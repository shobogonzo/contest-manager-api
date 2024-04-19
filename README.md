# Contest Manager API

[![dev](https://github.com/shobogonzo/contest-manager-api/actions/workflows/dev.yml/badge.svg)](https://github.com/shobogonzo/contest-manager-api/actions/workflows/dev.yml)
[![prod](https://github.com/shobogonzo/contest-manager-api/actions/workflows/prod.yml/badge.svg)](https://github.com/shobogonzo/contest-manager-api/actions/workflows/prod.yml)

## Getting Started

### Prerequisites

- An AWS account with an admin user (AWSAdministratorAccess)
- [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
- [nvm](https://github.com/nvm-sh/nvm?tab=readme-ov-file#installing-and-updating) and Node 20 LTS
- [yarn](https://classic.yarnpkg.com/lang/en/docs/install) package manager

### Local Dev Setup

- Copy admin credentials from the AWS access portal into your `.aws/credentials` file
- Run `yarn bootstrap` to deploy to your AWS account and set local environment variables
- Verify deployment in the AWS console or by running `yarn test:e2e`
- Run `yarn sls deploy` to push changes to your dev environment

## Making Changes

### GraphQL and Codegen

This project uses the [GraphQL-Codegen](https://the-guild.dev/graphql/codegen/docs/getting-started) library to translate GraphQL object types into TypeScript types for functions, resolvers, and automated tests. When modifying the API, start by adding or updating the relevant types in the `schema.api.graphql` file.

Run `yarn codegen` to automatically generate TypeScript types in the `src/generated/graphql.ts` file. Import types from `graphql.ts` as needed.
