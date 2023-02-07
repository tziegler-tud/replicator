import mongoose from 'mongoose';
import mongooseAutoPopulate from "mongoose-autopopulate";
const Schema = mongoose.Schema;

// create instance of Schema
var ClientScheme = new Schema({
    identifier: {
        type: String,
    },
    clientId: {
        unique: true,
        type: String,
        required: true,
    },
    url: {

    },
    versionData: {

    },
    settings: {

    },
    skills: [

    ],
    locations: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Location',
            autopopulate: true,
        }
    ],
    lastConnection: {
        type: Date,
    },
    createdDate: {
        type: Date,
        default: Date.now
    },
});

ClientScheme.set('toJSON', { virtuals: true, getters: true });
ClientScheme.plugin(mongooseAutoPopulate);
export default mongoose.model('Client', ClientScheme);
