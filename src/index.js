const MilleFeuille = require('@frenchpastries/millefeuille')
const { response } = require('@frenchpastries/millefeuille/response')
const Assemble = require('@frenchpastries/assemble')
const GraphQL = require('./graphql')

const root = {
  hello: () => 'Hello World!'
}

const routes = Assemble.routes([
  Assemble.get('/', () => {
    console.log('get')
    return response('OK')
  }),
  Assemble.notFound(() => {
    console.log('Not Found')
    return response('Not Found')
  })
])

const graphQLRouter = GraphQL.accessGraphQL('../database/schema.graphql', root, {
  graphiql: true
})

MilleFeuille.create(
  Assemble.compose([
    graphQLRouter,
    routes
  ])
)

console.log('-----> GraphQL server started.')
