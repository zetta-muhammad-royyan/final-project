// *************** IMPORT MODULE ***************
const typeDef = require('./deposit.typeDef');
const model = require('./deposit.model');
const loader = require('./deposit.loader');

// *************** EXPORT MODULE ***************
module.exports = {
  typeDef,
  model,
  loader,
};
