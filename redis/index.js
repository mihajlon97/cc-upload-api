const redis = require("redis");
const dbClient = redis.createClient(6379, process.env.REDIS_URL);
console.log('Redis connected');
module.exports = dbClient;
