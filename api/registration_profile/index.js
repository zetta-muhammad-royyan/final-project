// *************** IMPORT MODULE ***************
const resolver = require('./registration_profile.resolver');
const typeDef = require('./registration_profile.typeDef');
const model = require('./registration_profile.model');
const loader = require('./registration_profile.loader');

// *************** EXPORT MODULE ***************
module.exports = {
  resolver,
  typeDef,
  model,
  loader,
};
