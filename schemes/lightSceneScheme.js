import mongoose from 'mongoose';
const Schema = mongoose.Schema;

// create instance of Schema
var LightScheme = new Schema({
    uniqueId: {
        required: true,
        type: String,
        unique: true,
    },
    displayName: {
        type: String,
    },
    alias: {
        type: String,
    },
    identifier: {
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

export default mongoose.model('LightScene', LightScheme);
