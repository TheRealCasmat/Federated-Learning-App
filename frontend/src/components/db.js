import Dexie from "dexie";

const db = new Dexie("FeedbackDatabase");

// Define the schema
db.version(1).stores({
  feedbacks: "++id,imageDataUrl,trueLabel",
});

export default db;
