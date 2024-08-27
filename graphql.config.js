// *************** IMPORT LIBRARY ***************
const { mergeTypeDefs } = require('@graphql-tools/merge');

// *************** IMPORT MODULE ***************
const terminationOfPayment = require('./api/termination_of_payment');
const registrationProfile = require('./api/registration_profile');
const financialSupport = require('./api/financial_support');
const student = require('./api/student');
const billing = require('./api/billing');
const term = require('./api/term');

// *************** EXPORT MODULE ***************
module.exports = {
  resolvers: [terminationOfPayment.resolver, registrationProfile.resolver, student.resolver],
  typeDefs: mergeTypeDefs([terminationOfPayment.typeDef, registrationProfile.typeDef, student.typeDef, billing.typeDef, term.typeDef]),
  context: {
    models: {
      terminationOfPayment: terminationOfPayment.model,
      registrationProfile: registrationProfile.model,
      financialSupport: financialSupport.model,
      student: student.model,
      billing: billing.model,
      term: term.model,
    },
    loaders: {
      terminationOfPaymentLoader: terminationOfPayment.loader,
      registrationProfileLoader: registrationProfile.loader,
      financialSupportLoader: financialSupport.loader,
    },
  },
};
