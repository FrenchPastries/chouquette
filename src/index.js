const { response, internalError, contentType } = require('@frenchpastries/millefeuille/response')
const { jsonBody, jsonContentType } = require('@frenchpastries/arrange')
const Assemble = require('@frenchpastries/assemble')

const { graphql, buildSchema } = require('graphql')
const path = require('path')
const fs = require('fs')

const renderGraphiQL = require('./renderGraphiQL')

const renderGraphQLOriQL = (schema, rootValue, graphiql) => async request => {
  if (request.method === 'GET') {
    const query = request.url.query.query
    const variables = JSON.parse(request.url.query.variables || null)
    const value = query
      ? await graphql(schema, query, rootValue, { request }, variables)
      : ''
    return contentType(response(renderGraphiQL.renderGraphiQL({
      query: query,
      variables: variables,
      result: value,
      operationName: null,
      darkTheme: graphiql.dark,
    })), 'text/html')
  } else if (request.method === 'POST') {
    const body = JSON.parse(request.body)
    const query = body.query
    const variables = body.variables
    const value = await graphql(schema, query, rootValue, { request }, variables)
    return response(value)
  } else {
    return null
  }
}

const getSolver = (schema, rootValue) => request => {
  return graphQLSolver(schema, rootValue)({
    ...request,
    body: {
      query: request.url.query,
      variables: request.url.variables,
      operationName: request.url.operationName
    }
  })
}

const selectBodyQuery = body => {
  if (typeof body === 'string') {
    return JSON.parse(body)
  } else {
    return body
  }
}

const graphQLSolver = (schema, rootValue) => request => {
  const { body } = request
  const { query, variables, operationName } = selectBodyQuery(body)
  const res = graphql(schema, query, rootValue, { request }, variables, operationName)
  return res
    .then(response)
    .catch(internalError)
}

const generateGraphQLRoutes = (urlPath, schema, rootValue) => [
  Assemble.get (urlPath, jsonContentType(jsonBody(getSolver(schema, rootValue)))),
  Assemble.post(urlPath, jsonContentType(jsonBody(graphQLSolver(schema, rootValue))))
]

const generateGraphiQLRoutes = (schema, rootValue, graphiql) => [
  Assemble.get ('/graphiql', renderGraphQLOriQL(schema, rootValue, graphiql)),
  Assemble.post('/graphiql', jsonContentType(jsonBody(renderGraphQLOriQL(schema, rootValue, graphiql))))
]

const getCorrectSchema = (schema, schemaPath) => {
  if (schemaPath) {
    const absoluteSchemaPath = path.resolve(process.cwd(), schemaPath)
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
    const graphiQLRoutes = generateGraphiQLRoutes(correctSchema, rootValue, graphiql)
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
