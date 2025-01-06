const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const recordSchema = new mongoose.Schema({
    ID: {
        type: Number,
        unique: true,
    },
    track: {
        type: String,
    },
    drivername: {
        type: String,
    },
    date: {
        type: Date,
    },
    salesman: {
        type: String,
    },
    receiptNumber: {
        type: Number,
    },
    amount: {
        type: Number,
    },
    city: {
        type: String,
    },
    remark: {
        type: String,
    },
    name: {
        type: String,
    },
    partyCode: {
        type: String,
    },
});

// Apply the auto-increment plugin to the `ID` field
recordSchema.plugin(AutoIncrement, { inc_field: 'ID' });

const Record = mongoose.model('Record', recordSchema);

module.exports = Record;
