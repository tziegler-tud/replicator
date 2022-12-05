import mongoose from 'mongoose';

/** @typedef {{ username: string, firstName: string, lastName: string, email?: string, hash: string, generalData?: { memberId?: string, phone?: string, customData?: any, qualifications: QualificationObject[], hasPhoto: boolean, isDisplayedOnPublic: boolean, loginEnabled: boolean, createdDate: Date } }} UserScheme */
/** @typedef {{ title: {title: string, value: string}, description: {shortDesc: string, longDesc: string}, date: {startDate: Date, endDate: Date}, participants: User[], createdDate: Date}} ProtocolScheme */

const Schema = mongoose.Schema;

// create instance of Schema
var ClientScheme = new Schema({
    identifier: {
        type: String,
        required: true,
    },
    url: {

    },
    versionData: {

    },
    settings: {

    },
    skills: {

    },
    lastConnection: {
        type: Date,
    },
    createdDate: {
        type: Date,
        default: Date.now
    },
});

ClientScheme.set('toJSON', { virtuals: true, getters: true });

export default mongoose.model('Client', ClientScheme);
