// *************** IMPORT MODULE ***************
const typeDef = require('./billing.typeDef');
const model = require('./billing.model');
const resolver = require('./billing.resolver');
const loader = require('./billing.loader');

// *************** EXPORT MODULE ***************
module.exports = {
  typeDef,
  model,
  resolver,
  loader,
};
