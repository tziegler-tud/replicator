import mongoose from 'mongoose';
const Schema = mongoose.Schema;

// create instance of Schema
var SettingsScheme = new Schema({
    identifier: {
        type: String,
        required: true,
    },
    system: {
        debugLevel: {
            type: Number,
            default: 0,
        }
    },
    intentConfig: {
        active: {
            type: Boolean,
            default: false,
        },
        path: {

        },
        hash: {

        },
    },
});

SettingsScheme.set('toJSON', { virtuals: true, getters: true });

export default mongoose.model('Settings', SettingsScheme);
