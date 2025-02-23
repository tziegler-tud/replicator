import mongoose from 'mongoose';
const Schema = mongoose.Schema;

// create instance of Schema
var TtsFilesScheme = new Schema({
    filename: {
        required: true,
        type: String,
    },
    content: {
        required: true,
        type: String,
    },
    createdDate:{
        type: Date,
        default: Date.now
    }
});

TtsFilesScheme.set('toJSON', { virtuals: true, getters: true });

export default mongoose.model('TtsFiles', TtsFilesScheme);
