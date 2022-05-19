const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
    author:{
        type:String,
        required:true,
        maxlength:100
    },
    content:{
        type:String,
        required:true,
        maxlength:100
    }
})

module.exports = mongoose.model("Post",postSchema);