// *************** IMPORT LIBRARY ***************
require('dotenv').config();
const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const { makeExecutableSchema } = require('graphql-tools');
const mongoose = require('mongoose');

// *************** IMPORT MODULE ***************
const graphqlConfig = require('./graphql.config');

// *************** Connect to mongodb ***************
mongoose
  .connect(`mongodb://localhost:27017/${process.env.DB_NAME}`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('Failed to connect to MongoDB', err));

// *************** Display mongodb log query based on env ***************
mongoose.set('debug', process.env.DB_DEBUG || false);

const app = express();

const schema = makeExecutableSchema({
  typeDefs: graphqlConfig.typeDefs,
  resolvers: graphqlConfig.resolvers,
});

const server = new ApolloServer({
  schema,
});

server.applyMiddleware({ app });

// *************** Start server ***************
const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`GraphQL server running at http://localhost:${port}/graphql`);
});
