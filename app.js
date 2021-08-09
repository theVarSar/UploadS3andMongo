const express = require('express');
const app = express();
var bodyParser = require('body-parser');
const dotenv = require('dotenv').config();
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";

var urlencodedParser = bodyParser.urlencoded({ extended: false })

const AWS = require('aws-sdk');
const s3 = new AWS.S3({
  accessKeyId: process.env.AWSAccessKeyId,
  secretAccessKey: process.env.AWSSecretKey
});

app.get('/', function(req, res){
    res.sendFile(__dirname + "/index.html")
});

app.post('/upload', urlencodedParser, function(req, res){
    let imgArr = req.body.files;
    if (Array.isArray(imgArr)){
        for(let i=0;i<imgArr.length;i++) {
            uploadFile(imgArr[i], res);
        }
    } else {
        uploadFile(imgArr, res);
    }
});

app.listen(8080, function(){
    console.log("Listening at 8080");
})

const uploadFile = (img, res) => {
    const params = {
        Bucket: process.env.BUCKET_NAME,
        Key: 'images/' + '-' + Date.now() + img.replace(/ /g,"_"),
        Body: JSON.stringify(img, null, 2)
    };

    var s3upload = s3.upload(params).promise();

    s3upload.then(function(data) {     
        console.log(`File uploaded successfully at ${data.Location}`)
        res.status(200).send(`<p>Upload Another <a href="http://localhost:8080/"'>GO back</a><p>`)
   
        MongoClient.connect(url, function(err, db) {
            if (err) throw err;
            var dbo = db.db("s3app");
            data.DateTime = new Date();
            dbo.collection("s3insertions").insertOne(data, function(err, res) {
                if (err) throw err;
                db.close();
            });
        });
    }).catch(function(err) {
        return err;
    });
};