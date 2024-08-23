const { mergeTypeDefs } = require('@graphql-tools/merge');

const terminationOfpaymentsSchema = require('./schemas/terminationOfPaymentsSchema');

const typeDefs = mergeTypeDefs([terminationOfpaymentsSchema]);

module.exports = typeDefs;
