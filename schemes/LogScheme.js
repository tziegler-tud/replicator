import mongoose from 'mongoose';
const Schema = mongoose.Schema;

// create instance of Schema
var LogScheme = new Schema({
    type: {
        required: true,
        type: String,
    },
    message: {
        required: true,
        type: String,
    },
    details: {
        required: false,
        type: String,
    },
    additionalData: {},
    date:{
        type: Date,
        default: Date.now
    }
});

LogScheme.set('toJSON', { virtuals: true, getters: true });

export default mongoose.model('Logs', LogScheme);
