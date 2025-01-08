const packedListSchema = new mongoose.Schema({
    records: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Record' }], // Array of Record references
});

const PackedList = mongoose.model('PackedList', packedListSchema);

module.exports = PackedList;
