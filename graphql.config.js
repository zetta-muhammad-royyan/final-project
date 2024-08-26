// *************** Import library ***************
const { mergeTypeDefs } = require('@graphql-tools/merge');

// *************** Import Module ***************
const terminationOfPayment = require('./api/termination_of_payment');
const registrationProfile = require('./api/registration_profile');

module.exports = {
  resolvers: [terminationOfPayment.resolver, registrationProfile.resolver],
  typeDefs: mergeTypeDefs([terminationOfPayment.typeDef, registrationProfile.typeDef]),
  context: {
    models: {
      terminationOfPayment: terminationOfPayment.model,
      registrationProfile: registrationProfile.model,
    },
  },
};
