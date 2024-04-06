import http from 'axios';
import _ from 'lodash';

const fragments: any = {};
const registerFragment = (name: string, fragment: string) =>
  (fragments[name] = fragment);

const throwOnErrors = ({ query, variables, errors }) => {
  if (errors) {
    const errorMessage = `
query: ${query.substr(0, 100)}
  
variables: ${JSON.stringify(variables, null, 2)}
  
error: ${JSON.stringify(errors, null, 2)}
`;
    throw new Error(errorMessage);
  }
};

function* findUsedFragments(query, usedFragments = new Set()) {
  for (const name of Object.keys(fragments)) {
    if (query.includes(name) && !usedFragments.has(name)) {
      usedFragments.add(name);
      yield name;

      const fragment = fragments[name];
      const nestedFragments = findUsedFragments(fragment, usedFragments);

      for (const nestedName of Array.from(nestedFragments)) {
        yield nestedName;
      }
    }
  }
}

const GraphQL = async (
  url: string,
  query: any,
  variables = {},
  auth?: string
) => {
  const headers: any = {};
  if (auth) {
    // headers.Authorization = auth;
    headers['X-Api-Key'] = auth;
  }

  const usedFragments = Array.from(findUsedFragments(query)).map(
    (name: any) => fragments[name]
  );

  console.log(query);

  try {
    const resp = await http({
      method: 'post',
      url,
      headers,
      data: {
        query: [query, ...usedFragments].join('\n'),
        variables: JSON.stringify(variables)
      }
    });

    const { data, errors } = resp.data;
    throwOnErrors({ query, variables, errors });
    return data;
  } catch (err) {
    const errors = _.get(err, 'response.data.errors');
    throwOnErrors({ query, variables, errors });
    throw err;
  }
};

export { registerFragment, GraphQL };
