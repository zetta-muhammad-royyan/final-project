// *************** IMPORT LIBRARY ***************
const { gql } = require('apollo-server-express');

const deposit = gql`
  # schemas
  type Deposit {
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
module.exports = deposit;
