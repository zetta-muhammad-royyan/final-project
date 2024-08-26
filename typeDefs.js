const { mergeTypeDefs } = require('@graphql-tools/merge');

const terminationOfpaymentsSchema = require('./schemas/terminationOfPaymentsSchema');
const registrationProfilesSchema = require('./schemas/registrationProfilesSchema');

const typeDefs = mergeTypeDefs([terminationOfpaymentsSchema, registrationProfilesSchema]);

module.exports = typeDefs;
