import mongoose from 'mongoose';
const Schema = mongoose.Schema;

// create instance of Schema
var LightGroupScheme = new Schema({
    id: {

    },
    uniqueId: {
        type: String,
        required: true,
        unique: true,
    },
    identifier: {
        type: String,
    },
    lights: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Light',
            autopopulate: true,
        }
    ],
    scenes: [
        {
            type: Schema.Types.ObjectId,
            ref: 'LightScene',
            autopopulate: true,
        }
    ],
    integration: {
        type: {
            type: String
        },
        data: {

        }
    },
    state: {

    }
});

LightGroupScheme.virtual('getLightsByAlias').get(function(alias) {
    let lights = [];
    this.lights.forEach(light => {
        if (light.alias === alias) lights.push(light);
    })
    return lights;
});

LightGroupScheme.set('toJSON', { virtuals: true, getters: true });

export default mongoose.model('LightGroup', LightGroupScheme);
