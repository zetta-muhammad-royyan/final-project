// *************** Import Module ***************
const terminationOfPaymentsResolver = require('./resolvers/terminationOfPaymentsResolver');
const registrationProfilesResolver = require('./resolvers/registrationProfilesResolver');

const resolvers = {
  Query: {
    ...terminationOfPaymentsResolver.Query,
    ...registrationProfilesResolver.Query,
  },
  Mutation: {
    ...terminationOfPaymentsResolver.Mutation,
    ...registrationProfilesResolver.Mutation,
  },
};

module.exports = resolvers;
