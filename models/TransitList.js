const mongoose = require('mongoose');

const TransitListSchema = new mongoose.Schema({
    records: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Record' }], // Array of Record references
});

const TransitList = mongoose.model('TransitList', TransitListSchema);

module.exports = TransitList;
