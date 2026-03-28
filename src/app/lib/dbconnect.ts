import mongoose from "mongoose";

const MONGODB_URI="mongodb://ollan:foohq9dNOvFuzzdC@ac-dfx629c-shard-00-00.jge27ka.mongodb.net:27017,ac-dfx629c-shard-00-01.jge27ka.mongodb.net:27017,ac-dfx629c-shard-00-02.jge27ka.mongodb.net:27017/?ssl=true&replicaSet=atlas-up2uwj-shard-0&authSource=admin&appName=Cluster0"
if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI");
}

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export default dbConnect;