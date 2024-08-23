// *************** Import Library ***************
require('dotenv').config();
const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const { makeExecutableSchema } = require('graphql-tools');

// *************** Import Module ***************
const typeDefs = require('./typeDefs');
const resolvers = require('./resolvers');

const app = express();

const schema = makeExecutableSchema({ typeDefs, resolvers });

const server = new ApolloServer({
  schema,
});

server.applyMiddleware({ app });

// *************** Start server ***************
const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`GraphQL server running at http://localhost:${port}/graphql`);
});
