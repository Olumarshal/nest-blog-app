export default () => ({
  port: parseInt(process.env.PORT, 10),
  secret: process.env.SECRET,
  mongo_uri: process.env.MONGODB_URI,
});
