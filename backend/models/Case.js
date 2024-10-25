const mongoose = require('mongoose');

const caseSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    caseNumber: { type: String, required: true },
    description: { type: String, required: true },
    jsonFile: { type: Object },
    threatScore: { type: Number },
    summary: { type: String },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Case', caseSchema);
