import * as mongodb from 'mongodb'

const uri = "mongodb://maci-coordinator:let-me-in@localhost"

const client = new mongodb.MongoClient(uri);
async function run() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("Connected successfully to server");
  } finally {
    await client.close();
  }
}
run().catch(console.dir);
