// *************** IMPORT LIBRARY ***************
const { gql } = require('apollo-server-express');

const deposit = gql`
  # schemas
  type Deposit {
    _id: ID!
    billing: Billing!
    date: String!
    amount: Float!
    payment_status: DepositPaymentStatus!
    amount_paid: Float!
    remaining_amount: Float!
  }

  enum DepositPaymentStatus {
    billed
    partial_paid
    paid
  }
`;

// *************** EXPORT MODULE ***************
module.exports = deposit;
