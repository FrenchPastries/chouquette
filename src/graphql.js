const { graphql, buildSchema } = require('graphql')
const Assemble = require('@frenchpastries/assemble')
const { response, internalError, contentType } = require('@frenchpastries/millefeuille/response')
const Arrange = require('@frenchpastries/arrange')
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
    .then(content => {
      console.log(content)
      return response(content)
    })
    .catch(error => {
      console.log(error)
      return internalError(error)
    })
}

const accessGraphQL = (schemaPath, root) => {
  try {
    const absoluteSchemaPath = path.resolve(__dirname, schemaPath)
    const schemaFile = fs.readFileSync(absoluteSchemaPath, 'utf8')
    const schema = buildSchema(schemaFile)
    return Assemble.routes([
      Assemble.get ('/graphiql', request => renderGraphQLOriQL(schema, root)(request)),
      Assemble.post('/graphiql', Arrange.jsonContentType(Arrange.jsonBody(renderGraphQLOriQL(schema, root)))),
      Assemble.get ('/graphql',  Arrange.jsonContentType(Arrange.jsonBody(getSolver(schema, root)))),
      Assemble.post('/graphql',  Arrange.jsonContentType(Arrange.jsonBody(graphQLSolver(schema, root))))
    ])
  } catch(error) {
    console.error(error)
    return () => internalError(error)
  }
}

module.exports = {
  accessGraphQL
}
