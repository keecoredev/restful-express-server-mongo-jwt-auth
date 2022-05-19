if(process.env.NODE_ENV !== "production"){
    require("dotenv").config();
}
// server
const express = require("express");
const app = express();
app.use(express.json());
app.use(express.urlencoded({extended:true}));

// cloud db configs
const mongoose = require("mongoose");
mongoose.connect(process.env.CLOUD_DATABASE,{useNewUrlParser:true,useUnifiedTopology:true});
const db = mongoose.connection;
db.on("error",console.error.bind(console,"Auth Server couldn't connect to cloud"));
db.once("open",() => {
    console.log("Auth Server connected to cloud db succesfully");
})

// models
const User = require("./models/User");
const bcrypt = require("bcrypt");
const Token = require("./models/Token");

//auth
const jwt = require("jsonwebtoken");

app.post("/token", async (req,res) => {
    try{
        const refreshToken = req.body.token;
        if(refreshToken == null){
            return res.status(404).json({message:"token not found"});
        }
        const dbToken = await Token.findOne({token:refreshToken});
        if(dbToken == null){
            return res.status(404).json({message:"token not found (maybe logged out)"});
        }
        jwt.verify(refreshToken,process.env.REFRESH_TOKEN_SECRET,(err,user) => {
            if (err){
                return res.status(400).json({message:err.message});
            } 
            const parsedUser = user.user;
            const accessToken = generateAccessToken(parsedUser);
            res.status(200).json({accessToken:accessToken});
        })
    }catch(err){
        res.status(404).json({mongoose:err.message});
    }

})

app.delete("/logout",async(req,res) => {
    try{
        const refreshToken = req.body.token;
        console.log(req.body);
        const deletedToken = await Token.deleteOne({token:refreshToken});
        console.log(deletedToken);
        res.sendStatus(204);
    }catch(err){
        return res.status(403).json({message:"Wrong input"})
    }

})

app.post("/login",async (req,res) => {
    try{
        const user = await User.findOne({email:req.body.email});
        if(!user){
            return res.status(404).json({message:"User couldn't be found"});
        }
        if(!await bcrypt.compare(req.body.password,user.password)){
            return res.status(401).json({message:"Password is incorrect"});
        }
        console.log(user);
        const refreshToken = jwt.sign({user:user},process.env.REFRESH_TOKEN_SECRET);
        const savedToken = await Token.create({
            token:refreshToken
        })
        console.log(savedToken);


        const accessToken = generateAccessToken(user);
        res.json({accessToken:accessToken,refreshToken:refreshToken});
    }catch(err){
        res.status(404).json({message:err.message});
    }
})

function generateAccessToken(user){
    return jwt.sign({user:user},process.env.ACCESS_TOKEN_SECRET,{expiresIn:'59s'})
}

app.post("/register",async (req,res) => {
    try{
        const hashedPassword = await bcrypt.hash(req.body.password,10);
        const isUserExists = await User.findOne({email:req.body.email});
        if (isUserExists !== null){
            res.status(400).json({message:"This email ahs been taken already"})
        }
        if(req.body.username === null || req.body.email === null || req.body.password === null){
            res.status(400).json({message:"Empty fields has been detected"})
        }
        const newUser = await User.create({
            username:req.body.username,
            email:req.body.email,
            password:hashedPassword
        })
        console.log(newUser);
        res.status(201).json(newUser);
    }catch(err){
        res.status(404).json({message:"Input failure"});
    }
})

app.listen(process.env.AUTH_SERVER_PORT);