export default () => ({
  port: parseInt(process.env.PORT, 10),
  secret: process.env.SECRET,
  mongo_uri: process.env.MONGODB_URI,
  jwt_ttl: process.env.JWT_EXPIRATION_TIME,
});
