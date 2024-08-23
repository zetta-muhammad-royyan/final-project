// *************** Import Module ***************
const terminationOfPaymentsResolver = require('./resolvers/terminationOfPaymentsResolver');

const resolvers = {
  Query: {
    ...terminationOfPaymentsResolver.Query,
  },
  Mutation: {
    ...terminationOfPaymentsResolver.Mutation,
  },
};

module.exports = resolvers;
