const express  = require("express");
const mysql = require("mysql");

const app = express();

const db= mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "nodejs_login"
})
db.connect((e)=>{
    console.log(e)
    if(e){
         console.log(e)
    }else{
        console.log("mysql connected")
    }
})

