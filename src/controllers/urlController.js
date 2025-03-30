const urlModel = require("../models/urlModel")
const Validator = require("../Validator/validation")
const shortid = require('shortid');
const { promisify } = require("util");
const redis = require("redis");
 const { url } = require("inspector");
const { log } = require("console");

//Connect to redis
const redisClient = redis.createClient(
  14910,                                                                                   //port
  "redis-14910.crce179.ap-south-1-1.ec2.redns.redis-cloud.com",                                //redis url
  { no_ready_check: true }                                                              //sever loading purpose
);

redisClient.auth("I6W4b0LUtXtKFMPIKytSsCBHalWzKGwD", function (err) {                    //check authantication
  if (err) throw err;                                             
});

redisClient.on("connect", async function () {                                        //redis funtion on
  console.log("Connected to Redis........................................");
});


//Connection setup for redis

const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);



const postUrl = async function (req, res) {
  try {
    const body = req.body
    console.log(".........35",req.body.longUrl);
    
    if (!Validator.isValidBody(body)) return res.status(400).send({ status: false, message: " Provide details " })
    const newBody = body.longUrl.trim()
    if (!Validator.isValid(newBody)) return res.status(400).send({ status: false, message: "Enter url" })
    if (!Validator.isValidurl(newBody)) return res.status(400).send({ status: false, message: "Url is not valid" })

    const urlCode = shortid.generate().toLowerCase();
    const obj = {
      "longUrl": body.longUrl,
      "shortUrl": `http://localhost:3000/${urlCode.trim()}`,
      "urlCode": urlCode
    }
    console.log(obj,"........48");
    

    let CahceData = await GET_ASYNC(`${body.longUrl}`)
    console.log("..........52",CahceData);
    
    if (CahceData) {
      return res.status(200).send({ status: true, data: JSON.parse(CahceData) }) //convrt string to object
    }

    const findUrl = await urlModel.findOne({ longUrl: body.longUrl })
    if (findUrl) {
      console.log(findUrl,".............54");
      
      return res.status(200).send({ status: true, data: findUrl })
    }

    const data = await urlModel.create(obj)
    console.log(data,"..............60");
    
    if (data) { 
      await SET_ASYNC(`${data.longUrl}`, JSON.stringify(data));//conver object to string
      return res.status(201).send({ status: true, data: data })
    }

  } catch (err) {
    return res.status(500).send({ status: false, message: err.message })
  }
}



// ....................................................................................
const getUrl = async function (req, res) {
  try {
    // Accessing URL code from params instead of body
    const urlCode = req.params.urlCode;
    console.log("Received URL Code:", urlCode);

    // Getting data from cache
    
    let cacheData = await GET_ASYNC(urlCode);
    console.log("Cache Data:", cacheData);

    if (cacheData) {
      console.log("Found in cache.");
      return res.redirect(JSON.parse(cacheData).longUrl);
    } else {
      console.log("Not found in cache, checking database.");

      // Finding in database using findOne() instead of find()
      let checkUrl = await urlModel.findOne({ urlCode: urlCode });
      console.log("Database Data:", checkUrl);

      if (!checkUrl) return res.status(404).send({ status: false, message: "No URL found" });

      // Caching the found URL
      await SET_ASYNC(urlCode, JSON.stringify(checkUrl));
      return res.redirect(checkUrl.longUrl);
    }
  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
};



module.exports = {postUrl,getUrl}
