const mongoose = require('mongoose');

const checkedListSchema = new mongoose.Schema({
    records: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Record' }], // Array of Record references
});

const CheckedList = mongoose.model('CheckedList', checkedListSchema);

module.exports = CheckedList;
