import mongoose from 'mongoose';
const Schema = mongoose.Schema;

// create instance of Schema
var SensorScheme = new Schema({
    uniqueId: {
        required: true,
        type: String,
        unique: true,
    },
    displayName: {
        type: String,
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

SensorScheme.set('toJSON', { virtuals: true, getters: true });

export default mongoose.model('Sensor', SensorScheme);
