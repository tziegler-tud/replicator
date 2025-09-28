import mongoose from 'mongoose';
const Schema = mongoose.Schema;

// create instance of Schema
var WebhookScheme = new Schema({
    identifier: {
        type: String,
        required: true,
        unique: true,
    },
    name: {
        type: String,
    },
    slug: {
        type: String,
        required: true,
        unique: true,
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
    variables: {
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
                        //one of "constant", "variable", "dynamic variable", "property", "dynamic property"
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
                    _id: false,
                    identifier: {
                        type: String
                    },
                    title: {
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
        addProperty({key, values}){
            if(!this.properties) this.properties = [];
            this.properties.push({key: key, values: values});
        },

        setProperty({key, values}){
            if(!this.properties) this.properties = [];
            //find property
            let index = this.properties.findIndex((property) => property.key === key);
            if(index > -1) {this.properties[index] = {key: key, values: values}}
            else this.addProperty({key: key, values: values});
            return this.properties;
        },
        addAction(action){
            this.actions.push(action);
        },
    }
});



WebhookScheme.set('toJSON', { virtuals: true, getters: true });

export default mongoose.model('Webhook', WebhookScheme);
