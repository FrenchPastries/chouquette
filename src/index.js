const fs = require('fs')
const path = require('path')
const MilleFeuille = require('@frenchpastries/millefeuille')
const { internalError, response, contentType } = require('@frenchpastries/millefeuille/response')
const Assemble = require('@frenchpastries/assemble')
const Arrange = require('@frenchpastries/arrange')
const { graphql, buildSchema } = require('graphql')

const schemaPath = path.resolve(__dirname, '..', 'database', 'schema.graphql')
const schemaFile = fs.readFileSync(schemaPath, 'utf8')
const schema = buildSchema(schemaFile)

const renderGraphiQL = require('./renderGraphiQL')

const root = {
  hello: () => 'Hello World!'
}

const getSolver = request => {
  return graphQLSolver({ ...request, body: request.url.query.q })
}

const graphQLSolver = request => {
  return graphql(schema, request.body, root)
    .then(response)
    .catch(internalError)
}

const returnRequestURL = request => {
  return response(request.url)
}

const renderGraphQLOriQL = async request => {
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

const routes = Assemble.routes([
  Assemble.get ('/graphiql', request => renderGraphQLOriQL(request)),
  Assemble.post('/graphiql', Arrange.jsonContentType(Arrange.jsonBody(renderGraphQLOriQL))),
  Assemble.get ('/graphql',  Arrange.jsonContentType(Arrange.jsonBody(getSolver))),
  Assemble.post('/graphql',  Arrange.jsonContentType(Arrange.jsonBody(graphQLSolver))),
  Assemble.notFound(Arrange.jsonContentType(Arrange.jsonBody(returnRequestURL)))
])

MilleFeuille.create(routes)

console.log('-----> GraphQL server started.')
