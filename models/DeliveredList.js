const mongoose = require('mongoose');

const deliveredListSchema = new mongoose.Schema({
    records: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Record' }], // Array of Record references
});

const DeliveredList = mongoose.model('DeliveredList', deliveredListSchema);

module.exports = DeliveredList;
