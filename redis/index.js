// Redis
const redis = require("redis");
// const dbClient = redis.createClient(6379, "redis-001.xdq59a.0001.euc1.cache.amazonaws.com");
const dbClient = redis.createClient(6379, "localhost");
console.log('Redis connected');
module.exports = dbClient;
