export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  AWSDate: { input: any; output: any; }
  AWSDateTime: { input: any; output: any; }
  AWSEmail: { input: any; output: any; }
  AWSIPAddress: { input: any; output: any; }
  AWSJSON: { input: any; output: any; }
  AWSPhone: { input: any; output: any; }
  AWSTime: { input: any; output: any; }
  AWSTimestamp: { input: any; output: any; }
  AWSURL: { input: any; output: any; }
};

export type Mutation = {
  __typename?: 'Mutation';
  addUser?: Maybe<Scalars['ID']['output']>;
};


export type MutationAddUserArgs = {
  user: UserInput;
};

export type Query = {
  __typename?: 'Query';
  listUsers: Array<Maybe<User>>;
};


export type QueryListUsersArgs = {
  limit: Scalars['Int']['input'];
  nextToken: Scalars['String']['input'];
};

export type User = {
  __typename?: 'User';
  email: Scalars['AWSEmail']['output'];
  firstName: Scalars['String']['output'];
  lastName: Scalars['String']['output'];
  phone: Scalars['String']['output'];
  roles: Array<UserRole>;
  username: Scalars['String']['output'];
};

export type UserInput = {
  email: Scalars['AWSEmail']['input'];
  firstName: Scalars['String']['input'];
  lastName: Scalars['String']['input'];
  phone: Scalars['String']['input'];
  roles: Array<UserRole>;
};

export enum UserRole {
  Administrator = 'ADMINISTRATOR',
  Contestant = 'CONTESTANT',
  Director = 'DIRECTOR',
  Judge = 'JUDGE',
  Scheduler = 'SCHEDULER',
  SuperUser = 'SUPER_USER'
}

export enum UserStatus {
  Disabled = 'DISABLED',
  Enabled = 'ENABLED'
}
