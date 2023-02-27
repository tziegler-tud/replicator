import mongoose from 'mongoose';
const Schema = mongoose.Schema;

// create instance of Schema
var IntentScheme = new Schema({
    identifier: {
        type: String,
        unique: true,
        required: true,
    },
    variables: {

    },
    lines: [],
    handlers: [],
    groups: {
        macros: [],
        macrosOptional: [],
        slots: [],
        slotsOptional: [],
    },
});

IntentScheme.set('toJSON', { virtuals: true, getters: true });

export default mongoose.model('Intent', IntentScheme);
