// *************** Import Library ***************
const { gql } = require('apollo-server-express');

// *************** TerminationOfPayments typedef ***************
const terminationOfpayments = gql`
  type Query {
    QueryHello: String
  }

  type Mutation {
    MuatationHello: String
  }
`;

module.exports = terminationOfpayments;
