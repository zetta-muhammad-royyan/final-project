// *************** IMPORT LIBRARY ***************
const { gql } = require('apollo-server-express');

const term = gql`
  # schemas
  type Term {
    _id: ID!
    billing: Billing!
    date: String!
    amount: Float!
    payment_status: TermPaymentStatus!
    amount_paid: Float!
    remaining_amount: Float!
  }

  # enums
  enum TermPaymentStatus {
    billed
    partial_paid
    paid
  }
`;

// *************** EXPORT MODULE ***************
module.exports = term;
