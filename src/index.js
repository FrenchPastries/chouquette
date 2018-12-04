const MilleFeuille = require('@frenchpastries/millefeuille')
const GraphQL = require('./graphql')

const root = {
  hello: () => 'Hello World!'
}

MilleFeuille.create(
  GraphQL.accessGraphQL('../database/schema.graphql', root)
)

console.log('-----> GraphQL server started.')
