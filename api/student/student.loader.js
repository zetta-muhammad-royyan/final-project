// *************** IMPORT LIBRARY ***************
const DataLoader = require('dataloader');

// *************** IMPORT MODULE ***************
const Student = require('./student.model');

const Loader = new DataLoader(async (ids) => {
  //*************** batch student
  const student = await Student.find({ _id: { $in: ids } });

  //*************** mapping student using it own id as key
  const studentMap = {};
  student.forEach((t) => {
    studentMap[t._id] = t;
  });

  return ids.map((id) => studentMap[id]);
});

// *************** EXPORT MODULE ***************
module.exports = Loader;
