// *************** IMPORT LIBRARY ***************
const resolver = require('./termination_of_payment.resolver');
const typeDef = require('./termination_of_payment.typeDef');
const model = require('./termination_of_payment.model');
const loader = require('./termination_of_payment.loader');

// *************** EXPORT MODULE ***************
module.exports = {
  resolver,
  typeDef,
  model,
  loader,
};
