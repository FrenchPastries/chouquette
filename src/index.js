const { response, internalError, contentType } = require('@frenchpastries/millefeuille/response')
const { jsonBody, jsonContentType } = require('@frenchpastries/arrange')
const Assemble = require('@frenchpastries/assemble')

const { graphql, buildSchema } = require('graphql')
const path = require('path')
const fs = require('fs')

const renderGraphiQL = require('./renderGraphiQL')

const renderGraphQLOriQL = (schema, rootValue) => async request => {
  if (request.method === 'GET') {
    const query = request.url.query.query
    const variables = request.url.query.variables || null
    const value = query
      ? await graphql(schema, query, rootValue, null, variables)
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
    const value = await graphql(schema, query, rootValue, null, variables)
    return response(value)
  } else {
    return null
  }
}

const getSolver = (schema, rootValue) => request => {
  return graphQLSolver(schema, rootValue)({ ...request, body: request.url.query.query })
}

const graphQLSolver = (schema, rootValue) => request => {
  const res = rootValue
    ? graphql(schema, request.body)
    : graphql(schema, request.body, rootValue)
  return res
    .then(response)
    .catch(internalError)
}

const generateGraphQLRoutes = (urlPath, schema, rootValue) => [
  Assemble.get (urlPath, jsonContentType(jsonBody(getSolver(schema, rootValue)))),
  Assemble.post(urlPath, jsonContentType(jsonBody(graphQLSolver(schema, rootValue))))
]

const generateGraphiQLRoutes = (schema, rootValue) => [
  Assemble.get ('/graphiql', renderGraphQLOriQL(schema, rootValue)),
  Assemble.post('/graphiql', jsonContentType(jsonBody(renderGraphQLOriQL(schema, rootValue))))
]

const getCorrectSchema = (schema, schemaPath) => {
  if (schemaPath) {
    const absoluteSchemaPath = path.resolve(__dirname, schemaPath)
    const schemaFile = fs.readFileSync(absoluteSchemaPath, 'utf8')
    return buildSchema(schemaFile)
  } else if (schema) {
    return schema
  } else {
    throw 'No schema'
  }
}

const handler = (urlPath, options = {}) => {
  const { schemaPath, schema, rootValue, graphiql } = options
  try {
    const correctSchema = getCorrectSchema(schema, schemaPath)
    const graphQLRoutes = generateGraphQLRoutes(urlPath, correctSchema, rootValue)
    const graphiQLRoutes = generateGraphiQLRoutes(correctSchema, rootValue)
    if (graphiql) {
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
  handler
}
