// migrate.js
import { MongoClient } from "mongodb";

// Your SOURCE MongoDB URI
const SOURCE_URI =
  "mongodb+srv://abinash0870:enZcTUPxEkRotWtz@cluster0.5ipp2rp.mongodb.net/";

// Your TARGET MongoDB URI
const TARGET_URI =
  "mongodb+srv://nearbylabour_db_user:JGKnrYLVaRgJBI9r@aws-cluster.fadkwyp.mongodb.net/";

// Your DB names
const SOURCE_DB = "motract-app";
const TARGET_DB = "nearby_labours";

async function migrateAllCollections() {
  const sourceClient = new MongoClient(SOURCE_URI);
  const targetClient = new MongoClient(TARGET_URI);

  try {
    console.log("Connecting to SOURCE and TARGET databases...");
    await sourceClient.connect();
    await targetClient.connect();
    console.log("✅ Connected to both databases.");

    const sourceDb = sourceClient.db(SOURCE_DB);
    const targetDb = targetClient.db(TARGET_DB);

    // Get all collections from source DB
    const collections = await sourceDb.listCollections().toArray();
    console.log(
      `Found ${collections.length} collections in "${SOURCE_DB}":`,
      collections.map((c) => c.name)
    );

    for (const { name: collectionName } of collections) {
      // Skip internal/system collections
      if (collectionName.startsWith("system.")) {
        console.log(`Skipping system collection "${collectionName}"`);
        continue;
      }

      console.log(`\n=== Migrating collection "${collectionName}" ===`);

      const sourceCollection = sourceDb.collection(collectionName);
      const targetCollection = targetDb.collection(collectionName);

      // Read all docs from source collection
      const docs = await sourceCollection.find({}).toArray();
      console.log(`  → Found ${docs.length} documents in source.`);

      // Clear existing data in target collection
      const deleteResult = await targetCollection.deleteMany({});
      console.log(
        `  → Cleared ${deleteResult.deletedCount} documents in target collection.`
      );

      // Insert into TARGET
      if (docs.length > 0) {
        await targetCollection.insertMany(docs);
        console.log(
          `  → Inserted ${docs.length} documents into "${TARGET_DB}.${collectionName}".`
        );
      } else {
        console.log("  → No documents to insert for this collection.");
      }
    }

    console.log("\n🎉 Migration of all collections completed successfully!");
  } catch (err) {
    console.error("\n❌ Migration error:", err);
  } finally {
    await sourceClient.close();
    await targetClient.close();
    console.log("Connections closed.");
  }
}

migrateAllCollections();
