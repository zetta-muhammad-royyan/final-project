// *************** IMPORT LIBRARY ***************
const DataLoader = require('dataloader');

// *************** IMPORT MODULE ***************
const Deposit = require('./deposit.model');

const Loader = new DataLoader(async (ids) => {
  const deposit = await Deposit.find({ _id: { $in: ids } });
  const depositMap = {};
  deposit.forEach((t) => {
    depositMap[t._id] = t;
  });

  return ids.map((id) => depositMap[id]);
});

// *************** EXPORT MODULE ***************
module.exports = Loader;
