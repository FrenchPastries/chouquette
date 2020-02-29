const fs = require('fs')
const path = require('path')

module.exports = `
  <style>
    ${fs.readFileSync(path.resolve(__dirname, 'dark-graphiql.css'), "utf8")}
  </style>
`
