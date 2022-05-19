if(process.env.NODE_ENV !== "production"){
    require("dotenv").config();
}
// server
const express = require("express");
const app = express();
app.use(express.json());
app.use(express.urlencoded({extended:true}));

// cloud db
const mongoose = require("mongoose");
mongoose.connect(process.env.CLOUD_DATABASE,{useNewUrlParser:true,useUnifiedTopology:true});
const db = mongoose.connection;
db.on("error",console.error.bind(console,"Server couldn't connected successfully to cloud"));
db.once("open",() => {
    console.log("Server connected to cloud successfully");
})

// models
const Post = require("./models/Post");

// auth
const jwt = require("jsonwebtoken");

app.get("/posts", async (req,res) => {
    try{
        const posts = await Post.find();
        res.status(200).json(posts);
    }catch(err){
        res.status(403).json({message:"Forbidden"})
    }
})
app.get("/posts/own",authenticateToken, async (req,res) => {
    try{
       //  console.log(req.headers["authorization"]); getting the access token from header
        const posts = await Post.find({author:req.user.user.username});
        res.status(200).json(posts);

    }catch(err){
        res.status(403).json({message:err.message})
    }
})

app.post("/posts",async (req,res) => {
    try{
        const newPost = await Post.create({
            author:req.body.author,
            content:req.body.content
        })
        console.log(newPost);
        res.json(newPost);
    }catch(err){
        res.status(403).json({message:err.message})
    }
})


function authenticateToken(req,res,next){
    const bearerHeader = req.headers["authorization"];
    if(bearerHeader == null){
        return res.status(404).json({message:"Bearer not found"})
    }
    const token = bearerHeader.split(" ")[1];
    if(token == null){
        return res.status(404).json({message:"token undefined"});
    }
    jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,user) => {
        if(err){
            return res.status(403).json({message:err.message})
        }
        req.user = user;
        next();
    })
    
}

app.listen(process.env.SERVER_PORT);