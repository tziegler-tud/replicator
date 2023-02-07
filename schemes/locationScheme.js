import mongoose from 'mongoose';
const Schema = mongoose.Schema;

// create instance of Schema
var LocationScheme = new Schema({
    identifier: {
        type: String,
        required: true,
    },
    voiceCommandAlias: {
        type: String,

    },
    lightGroups: [{
        groupId: {

        },
        identifier: {

        },
        lights: {

        }
    }],
    createdDate: {
        type: Date,
        default: Date.now
    },
});

LocationScheme.virtual('getLightsByAlias').get(function(alias) {
    let lights = [];
    this.lightGroups.forEach(group => {
        group.lights.forEach(light => {
            if (light.alias === alias) lights.push(light);
        })
    })
    return lights;
});

LocationScheme.set('toJSON', { virtuals: true, getters: true });

export default mongoose.model('Location', LocationScheme);
