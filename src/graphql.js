const { response, internalError, contentType } = require('@frenchpastries/millefeuille/response')
const { jsonBody, jsonContentType } = require('@frenchpastries/arrange')
const Assemble = require('@frenchpastries/assemble')

const { graphql, buildSchema } = require('graphql')
const path = require('path')
const fs = require('fs')

const renderGraphiQL = require('./renderGraphiQL')

const renderGraphQLOriQL = (schema, root) => async request => {
  if (request.method === 'GET') {
    const query = request.url.query.query
    const variables = request.url.query.variables || null
    const value = query
      ? await graphql(schema, query, root, null, variables)
      : ''
    return contentType(response(renderGraphiQL.renderGraphiQL({
      query: query,
      variables: variables,
      result: value,
      operationName: null
    })), 'text/html')
  } else if (request.method === 'POST') {
    const body = JSON.parse(request.body)
    const query = body.query
    const variables = body.variables
    const value = await graphql(schema, query, root, null, variables)
    return response(value)
  } else {
    return null
  }
}

const getSolver = (schema, root) => request => {
  return graphQLSolver(schema, root)({ ...request, body: request.url.query.q })
}

const graphQLSolver = (schema, root) => request => {
  return graphql(schema, request.body, root)
    .then(response)
    .catch(internalError)
}

const generateGraphQLRoutes = (schema, root) => [
  Assemble.get ('/graphql', jsonContentType(jsonBody(getSolver(schema, root)))),
  Assemble.post('/graphql', jsonContentType(jsonBody(graphQLSolver(schema, root))))
]

const generateGraphiQLRoutes = (schema, root) => [
  Assemble.get ('/graphiql', renderGraphQLOriQL(schema, root)),
  Assemble.post('/graphiql', jsonContentType(jsonBody(renderGraphQLOriQL(schema, root))))
]

const accessGraphQL = (schemaPath, root, options = {}) => {
  try {
    const absoluteSchemaPath = path.resolve(__dirname, schemaPath)
    const schemaFile = fs.readFileSync(absoluteSchemaPath, 'utf8')
    const schema = buildSchema(schemaFile)
    const graphQLRoutes = generateGraphQLRoutes(schema, root)
    const graphiQLRoutes = generateGraphiQLRoutes(schema, root)
    if (options.graphiql) {
      return Assemble.routes(graphQLRoutes.concat(graphiQLRoutes))
    } else {
      return Assemble.routes(graphQLRoutes)
    }
  } catch(error) {
    console.error(error)
    return () => internalError(error)
  }
}

module.exports = {
  accessGraphQL
}
