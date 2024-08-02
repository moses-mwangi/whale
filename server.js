const mongoose = require("mongoose");

///handling exception error like sync code eg: console.log(x) and x not define:should be place on top
process.on("uncaughtException", (err) => {
  console.log("UNHANDLE EXCEPTION ...shuting down");
  console.log(err.name, err.message);

  process.exit(1);
});

const app = require("./app");

const db =
  "mongodb+srv://mosesmwangime:4Owf3JAY8YpVbT0y@fooddelivercluster.q3ihtsr.mongodb.net/delivery?retryWrites=true&w=majority&appName=FoodDeliverCluster";
const DB =
  "mongodb+srv://mosesmwangime:9SPqAj4JOaXBxDrI@cluster0.sqjq7km.mongodb.net/natours?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(DB).then((con) => {
  console.log("Database connection successfull");
});

// const port = process.env.PORT;
const server = app.listen(3006, "127.0.0.1", () => {
  console.log(`listening to port 3001 ll`);
});

///handling mongoDb error like bad auth eg wrong paasworg / connection to database problem
process.on("unhandledRejection", (err) => {
  console.log("UNHANDLE REJECTION ...shuting down");
  console.log(err);

  server.close(() => {
    process.exit(1);
  });
});
