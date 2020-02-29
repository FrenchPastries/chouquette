# Chouquette

Chouquette is a package to easily use GraphQL inside your MilleFeuille server. It depends on GraphQL and GraphiQL to give both GraphQL and a nice and beautiful interface to your database!  
It is inspired by `express-graphql`, but for MilleFeuille and the FrenchPastries stack.

## Need some help for GraphQL?

Head over to [the official GraphQL website](https://graphql.org/) to get an overview of how it works! We don't aim to offer support for GraphQL: we're only providing support for GraphQL integration into MilleFeuille.

# Getting Started

Getting started with GraphQL is simple and easy.

```bash
# For Yarn users
yarn add @frenchpastries/chouquette
```

```bash
# For NPM users
npm install --save @frenchpastries/chouquette
```

You need [MilleFeuille of course](https://github.com/FrenchPastries/millefeuille) to be able to run the code. Take a look at the MilleFeuille page to get an overview of how to do it!

Once you got everything, open your text editor, create your `main.js`, and start coding!

```javascript
const MilleFeuille = require('@frenchpastries/millefeuille')
const Chouquette = require('@frenchpastries/chouquette')

const schema = `
  type Query {
    hello: String
  }
`

const rootValue = {
  hello: () => 'Hello World!'
}

const graphQLHandler = Chouquette.handler('/your-graphql-path', {
  schema,
  rootValue,
  graphiql: true
})

MilleFeuille.create(graphQLHandler)
```

And you're good to go! Tweak it and you'll get a quick overview!

# Combining with more routes

Imagine you need GraphQL, but also other routes. You can easily combine the GraphQL handler with a routing system. The handler generates a function compatible with MilleFeuille, which always match your GraphQL route, and `/graphiql` if you asked for.  
Let's illustrate it with Assemble.

```javascript
const Assemble = require('@frenchpastries/assemble')

// ... Here the rest of the code above

const routes = Assemble.routes([
  Assemble.get('/', () => response('OK')),
  Assemble.notFound(() => ({ statusCode: 404, body: 'Not Found' }))
])

MilleFeuille.create(
  Assemble.compose([
    graphQLHandler,
    routes
  ])
)
```

# How does it work?

Chouquette is built around GraphQL. What it does is building your schema and taking an URL, and instanciating the GraphQL database at the desired URL. It automatically routes the request to GraphQL, and returns a Promise, containing the GraphQL response. There's no magic: you could easily do it yourself!

It also package GraphiQL to give you a good and interactive way to query the database and GraphQL, as part of the core value of Chouquette!

# Options

Chouquette only exposes one and only function, called `handler`. This handler accepts two arguments: an URL, beginning by a `/`, and an options object. This object accept four fields: `schema`, `schemaPath`, `rootValue` and `graphiql`. The two first options are mutually exclusive. You should use one, or the other. Otherwise, only `schemaPath` will be taken in consideration. As they're names indicates, `schema` should contain the GraphQL schema as string, and `schemaPath` should contain the absolute or relative path to the schema in a `.graphql` file. `rootValue` is the schema resolver, and `graphiql` is a boolean, indicating whether or not GraphiQL should be instanciated.

## Dark GraphiQL

Do you love dark mode? We too! Just change the `graphiql` field from `true` to `{ dark: true }` and you’ll get a dark GraphiQL by default! But maybe you already have your OS in dark setting? Then don’t worry, your GraphiQL will be black, thanks to `prefers-color-scheme`!

# Open Design Discussion

As with all our projects, we want to maintain as much as possible discussions in PR and issues open to anyone. We think it's important to share why we're doing things and to discuss about how you use the framework and how you would like to use it!

# Contributing

You love Chouquette? Feel free to contribute: open issues or propose pull requests! At French Pastries, we love hearing from you!
