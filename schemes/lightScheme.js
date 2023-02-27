import mongoose from 'mongoose';
const Schema = mongoose.Schema;

// create instance of Schema
var LightScheme = new Schema({
    uniqueId: {
        required: true,
        type: String,
        unique: true,
    },
    identifier: {
        type: String,
    },
    alias: {
        type: String,
    },
    integration: {
        type: {
            type: String
        },
        data: {

        }
    },
});

LightScheme.set('toJSON', { virtuals: true, getters: true });

export default mongoose.model('Light', LightScheme);
