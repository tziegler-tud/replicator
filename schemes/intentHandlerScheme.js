import mongoose from 'mongoose';
const Schema = mongoose.Schema;
import mongooseAutoPopulate from "mongoose-autopopulate";
import {VariableExpectation} from '../helpers/enums.js';

// create instance of Schema
var IntentHandlerScheme = new Schema({
    identifier: {
        type: String,
        required: true,
        unique: true,
    },
    clients: [{
        type: Schema.Types.ObjectId,
        ref: 'Client',
    }],
    allowAllClients: {
        type: Boolean,
        default: false,
    },
    intent: {
        type: String,
        required: true,
    },
    variables: {
        required: {},
        optional: {},
        forbidden: {},
    },
    actions: [
        {
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
                        //one of "constant", "variable", "dynamic variable"
                    },
                    variable: {

                    },
                    value: {

                    },
                    fallback: {

                    }
                },
            }],
            config: {
                arguments: {
                    type: Object,
                    default: {},
                }
            }
        }
    ],
    finisher: {
        active: {
            type: Boolean,
            default: false,
        },
        skill: {
            identifier: {
                type: String,
            }
        },
        config: {
            arguments: {
                type: Object,
                default: {},
            }
        }
    }
},
{
    methods: {
        addVariable(identifier, type, expectation=VariableExpectation.OPTIONAL) {
            let self = this;
            switch(expectation){
                case VariableExpectation.REQUIRED:
                    self.variables.required[identifier] = type;
                    break;
                case VariableExpectation.OPTIONAL:
                    self.variables.optional[identifier] = type;
                    break;
                case VariableExpectation.FORBIDDEN:
                    self.variables.forbidden[identifier] = type;
                    break;
            }
        },
        checkHandler(variables){
            //we receive the list of variables containend in the voice command. The handler qualifies if both:
            //1) all required are present
            //2) no forbidden are present
            let self = this;
            let match = false;
            let requiredMatch = true;
            let forbiddenMatch = true;
            if(self.variables.required) {
                Object.keys(self.variables.required).forEach(function(variable, index, array){
                    //key must be contained in variables
                    if(variables[variable] === undefined) {
                        //one missing, handler disqualified
                        requiredMatch = false;
                    }
                })
            }
            if(self.variables.forbidden) {
                Object.keys(self.variables.forbidden).forEach(function(variable, index, array){
                    //if a forbidden variable is set, the handler disqualifies
                    if(variables[variable] !== undefined ) {
                        //it's a match!
                        forbiddenMatch = false;
                    }
                })
            }
            return (requiredMatch && forbiddenMatch);
        },
        addAction(action){
            this.actions.push(action);
        },
    }
});



IntentHandlerScheme.set('toJSON', { virtuals: true, getters: true });

export default mongoose.model('IntentHandler', IntentHandlerScheme);
