const MilleFeuille = require('@frenchpastries/millefeuille')
const { response } = require('@frenchpastries/millefeuille/response')
const Assemble = require('@frenchpastries/assemble')
const GraphQL = require('./index')

const schemaPath = '../database/schema.graphql'

const rootValue = {
  hello: () => 'Hello World!'
}

const routes = Assemble.routes([
  Assemble.get('/', () => response('OK')),
  Assemble.notFound(() => response('Not Found'))
])

const graphQLHandler = GraphQL.handler('/graphql', {
  schemaPath,
  rootValue,
  graphiql: true
})

MilleFeuille.create(
  Assemble.compose([
    graphQLHandler,
    routes
  ])
)

console.log('-----> GraphQL server started.')
