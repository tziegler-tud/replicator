import mongoose from 'mongoose';
const Schema = mongoose.Schema;
import mongooseAutoPopulate from "mongoose-autopopulate";
import {VariableExpectation} from '../helpers/enums.js';

// create instance of Schema
var AlertScheme = new Schema({
    identifier: {
        type: String,
        required: true,
        unique: true,
    },
    priority: {
      type: Number,
      default: 0,
    },
    maxDuration: {
        type: Number,
        default: 0,
    },
    restoreLightState: {
        type: Boolean,
        default: true
    },
    properties: [
        {
            key: {
                type: String
            },
            values: [
                {
                    name: {
                        type: String
                    },
                    value: {

                    }
                }
            ]
        }
    ],
    phases: [
        {
            index: {
                type: Number,
            },
            initial: {
                type: Boolean,
                default: false,
            },
            duration: {
                type: Number,
                default: 2000,
            },
            actions: [
                {
                    phaseIndex: {
                        type: Number
                    },
                    skill: {
                        identifier: {
                            type: String,
                            required: true,
                        }
                    },
                    variables: [{
                        name: {
                            type: String,
                        },
                        type: {
                            type: String,
                        },
                        mapping: {
                            mappingType: {

                            },
                            variable: {

                            },
                            value: {

                            },
                            fallback: {

                            }
                        },
                    }],
                    configuration: {
                        parameters: [{
                            title: {
                                type: String,
                            },
                            identifier: {
                                type: String
                            },
                            type: {
                                type: String
                            },
                            value: {

                            },
                            options: [],
                            default: {},
                        }]
                    }
                }
            ],
        }
    ],
});



AlertScheme.set('toJSON', { virtuals: true, getters: true });

export default mongoose.model('Alert', AlertScheme);
