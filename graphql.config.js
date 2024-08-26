// *************** Import library ***************
const { mergeTypeDefs } = require('@graphql-tools/merge');

// *************** Import Module ***************
const terminationOfPayment = require('./api/termination_of_payment');
const registrationProfile = require('./api/registration_profile');
const financialSupport = require('./api/financial_support');
const student = require('./api/student');

module.exports = {
  resolvers: [terminationOfPayment.resolver, registrationProfile.resolver, student.resolver],
  typeDefs: mergeTypeDefs([terminationOfPayment.typeDef, registrationProfile.typeDef, student.typeDef]),
  context: {
    models: {
      terminationOfPayment: terminationOfPayment.model,
      registrationProfile: registrationProfile.model,
      financialSupport: financialSupport.model,
      student: student.model,
    },
  },
};
