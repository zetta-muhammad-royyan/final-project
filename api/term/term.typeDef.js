// *************** IMPORT LIBRARY ***************
const { gql } = require('apollo-server-express');

const term = gql`
  # schemas
  type Term {
    _id: ID!
    billing: Billing!
    date: String!
    amount: Float!
    payment_status: String!
    amount_paid: Float!
    remaining_amount: Float!
  }
`;

// *************** EXPORT MODULE ***************
module.exports = term;
