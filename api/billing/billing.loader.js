// *************** IMPORT LIBRARY ***************
const DataLoader = require('dataloader');

// *************** IMPORT MODULE ***************
const Billing = require('./billing.model');

const Loader = new DataLoader(async (ids) => {
  //*************** batch billing
  const billing = await Billing.find({ _id: { $in: ids } });

  //*************** mapping billing use it own id as a key
  const billingMap = {};
  billing.forEach((t) => {
    billingMap[t._id] = t;
  });

  return ids.map((id) => billingMap[id]);
});

// *************** EXPORT MODULE ***************
module.exports = Loader;
