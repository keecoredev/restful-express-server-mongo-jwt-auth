const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username:{
        type:String,
        required:true,
        maxlength:100
    },
    email:{
        type:String,
        required:true,
        maxlength:100,
        lowercase:true,
    },
    password:{
        type:String,
        required:true,
        maxlength:100,
    },
    posts:[String]
})

module.exports = mongoose.model("User",userSchema);