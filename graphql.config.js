// *************** IMPORT LIBRARY ***************
const { mergeTypeDefs } = require('@graphql-tools/merge');

// *************** IMPORT MODULE ***************
const terminationOfPayment = require('./api/termination_of_payment');
const registrationProfile = require('./api/registration_profile');
const financialSupport = require('./api/financial_support');
const student = require('./api/student');
const billing = require('./api/billing');
const term = require('./api/term');
const deposit = require('./api/deposit');

// *************** EXPORT MODULE ***************
module.exports = {
  resolvers: [terminationOfPayment.resolver, registrationProfile.resolver, student.resolver, billing.resolver],
  typeDefs: mergeTypeDefs([
    terminationOfPayment.typeDef,
    registrationProfile.typeDef,
    student.typeDef,
    billing.typeDef,
    term.typeDef,
    deposit.typeDef,
    financialSupport.typeDef,
  ]),
};
