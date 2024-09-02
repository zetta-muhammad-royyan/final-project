// *************** IMPORT LIBRARY ***************
const model = require('./financial_support.model');
const loader = require('./financial_support.loader');
const typeDef = require('./financial_support.typeDef');

// *************** EXPORT MODULE ***************
module.exports = {
  model,
  loader,
  typeDef,
};
