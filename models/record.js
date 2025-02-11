const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const recordSchema = new mongoose.Schema({
    ID: {
        type: Number,
        unique: true,
    },
    invoiceNumber: { type: String, unique: true }, // Unique invoice number
    generatedDate: { type: Date }, // Date when the record was generated
    partyCode: { type: String }, // Code representing the party
    imageLinks: { type: [String] }, // Array of image URLs
    isOtc: { type: Boolean }, // Indicates if it is OTC
    invoiceTimestamp: { type: Date }, // Timestamp for the invoice
    invoiceUsername: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Reference to User for invoice
    medicalName: { type: String }, // Name of the medical organization
    medicalCity: { type: String }, // City of the medical organization
    checkTimestamp: { type: Date }, // Timestamp for check status
    checkUsername: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Reference to User for check
    checkStatus: { type: String, enum: ['checked', 'not checked'] }, // Status of the check
    packageTimestamp: { type: Date }, // Timestamp for package status
    packageUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Reference to User for package handling
    packageStatus: { type: String, enum: ['packed', 'not packed'] }, // Status of the package
    deliveryStatus: {
        type: String,
        enum: ['delivered', 'not delivered', 'waiting'] // Updated enum for delivery status
    },
    pickupUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Reference to User for pickup
    pickupTimestamp: { type: Date }, // Timestamp for when the pickup occurred
    deliveredUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Reference to User for delivery
    deliveredTimestamp: { type: Date }, // Timestamp for when the delivery occurred,
    locationLink: { type: String }
});

// Apply the auto-increment plugin to the `ID` field
recordSchema.plugin(AutoIncrement, { inc_field: 'ID' });

const Record = mongoose.model('Record', recordSchema);

module.exports = Record;
