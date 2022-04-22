const { Schema, model, Types } = require('mongoose');
const date = require('date-and-time');

const ReactionSchema = new Schema(
    {
        reactionId: {
            type: Schema.Types.ObjectId,
            default: () => new Types.ObjectId
        },
        reactionBody: {
            type: String,
            required: 'Please enter your reaction!',
            minlength: 1,
            maxlength: 280
        },
        createdAt: {
            type: Date,
            default: Date.now,
            get: createdAtVal => date.format(createdAtVal, 'YYYY/MM/DD HH:mm:ss')
        },
        username: {
            type: String,
            required: "Please enter your username!"
        }
    },
    {
      toJSON: {
        getters: true
      }
    }
    
)

const ThoughtSchema = new Schema(
    {
        thoughtText: {
            type: String,
            required: "Please enter your thought text!",
            minlength: 1,
            maxlength: 280
        },
        createdAt: {
            type: Date,
            default: Date.now,
            get: createdAtVal => date.format(createdAtVal, 'YYYY/MM/DD HH:mm:ss')
        },
        username: {
            type: String,
            required: "Please enter your username!"
        },
        reactions: [ReactionSchema]
    },
    {
      toJSON: {
        virtuals: true,
        getters: true
      },
      id: false
    }
);

ThoughtSchema.virtual('reactionCount').get(function() {
    return this.reactions.length;
});

const Thought = model('Thought', ThoughtSchema);

module.exports = Thought;