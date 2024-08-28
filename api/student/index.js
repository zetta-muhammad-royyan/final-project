// *************** IMPORT MODULE ***************
const resolver = require('./student.resolver');
const typeDef = require('./student.typeDef');
const model = require('./student.model');
const loader = require('./student.loader');

// *************** EXPORT MODULE ***************
module.exports = {
  resolver,
  typeDef,
  model,
  loader,
};
