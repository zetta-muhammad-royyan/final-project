// *************** IMPORT LIBRARY ***************
const DataLoader = require('dataloader');

// *************** IMPORT MODULE ***************
const TerminationOfPayment = require('./termination_of_payment.model');

const Loader = new DataLoader(async (ids) => {
  //*************** batch termination of payment
  const terminationOfPayments = await TerminationOfPayment.find({ _id: { $in: ids } });

  //*************** mapping termination of payment using its own id as a key
  const terminationOfPaymentMap = {};
  terminationOfPayments.forEach((t) => {
    terminationOfPaymentMap[t._id] = t;
  });

  return ids.map((id) => terminationOfPaymentMap[id]);
});

// *************** EXPORT MODULE ***************
module.exports = Loader;
