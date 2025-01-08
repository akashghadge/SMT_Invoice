const mongoose = require('mongoose');

const dailyRecordSchema = new mongoose.Schema({
    date: { type: Date, required: true, unique: true }, // Date representing the day
    records: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Record' }], // Array of references to Record documents
});

const dailyRecord = mongoose.model('DailyRecord', dailyRecordSchema);

module.exports = dailyRecord;
