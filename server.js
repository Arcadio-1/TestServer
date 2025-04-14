const jsonServer = require("json-server");
const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const server = jsonServer.create();
const router = jsonServer.router("db.json");
const middlewares = jsonServer.defaults();

// Use default middlewares (logger, static, cors, and no-cache)
server.use(middlewares);
server.use(jsonServer.bodyParser);

// Simulate a network delay for every request (1.5 seconds)
server.use((req, res, next) => {
  setTimeout(next, 1500);
});

// Set up file upload support
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});
const upload = multer({ storage });

server.use("/uploads", express.static(uploadDir));

server.post("/upload/:displayId", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }
  const { type } = req.query;
  const { displayId } = req.params;
  const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${
    req.file.filename
  }`;

  const thumbnailFilename = `thumbnail-${req.file.filename}`;
  const thumbnailPath = path.join(uploadDir, thumbnailFilename);

  try {
    await sharp(path.join(uploadDir, req.file.filename))
      .resize({ width: 200 })
      .toFile(thumbnailPath);
  } catch (err) {
    console.error("Error generating thumbnail:", err);
    return res.status(500).json({ message: "Error generating thumbnail" });
  }

  const thumbnailUrl = `${req.protocol}://${req.get(
    "host"
  )}/uploads/${thumbnailFilename}`;

  const uploadData = {
    uid: req.file.filename, // unique id
    url: fileUrl,
    name: req.file.originalname,
    status: "done",
    type: req.file.mimetype, // using the file's mimetype
    thumbUrl: thumbnailUrl,
    displayId: displayId,
  };

  const db = router.db;
  if (!db.has("uploads").value()) {
    db.set("uploads", []).write();
  }
  db.get("uploads").push(uploadData).write();

  const { mediaFile } = uploadData;
  res.status(200).json({
    message: "File uploaded successfully",
    ...mediaFile,
  });
});

server.get("/getMedias/:displayId", (req, res) => {
  const { displayId } = req.params;

  if (!displayId) {
    return res
      .status(400)
      .json({ message: "display Id not provided in params" });
  }
  const db = router.db;
  const uploads = db.get("uploads").filter({ displayId }).value() || [];
  const mediaFiles = uploads.map(({ displayId, ...media }) => media);
  res.json(uploads);
});

server.delete("/deleteMedia/:uid", (req, res) => {
  const { uid } = req.params;

  if (!uid) {
    return res.status(400).json({ error: "UID parameter is required." });
  }

  const db = router.db;

  const mediaEntry = db.get("uploads").find({ uid }).value();
  if (!mediaEntry) {
    return res.status(404).json({ error: "Media file not found in DB." });
  }

  const filePath = path.join(uploadDir, uid);
  const thumbnailPath = path.join(uploadDir, `thumbnail-${uid}`);

  fs.unlink(filePath, (err) => {
    if (err) {
      console.error(`Error deleting file ${filePath}:`, err);
    }

    fs.unlink(thumbnailPath, (thumbErr) => {
      if (thumbErr) {
        console.error(`Error deleting thumbnail ${thumbnailPath}:`, thumbErr);
      }

      db.get("uploads").remove({ uid }).write();

      res.json({
        message: "Media file and associated thumbnail deleted successfully.",
        uid: uid,
      });
    });
  });
});

// Custom endpoint that creates a default display item
server.post("/generateDisplay", (req, res) => {
  // Create a default display item based on your schema.
  // Generate a unique id; here using Date.now() for simplicity.
  const defaultDisplayItem = {
    id: `display${Date.now()}`, // or use another unique string
    title: "",
    description: "",
    keywords: "",
    categoryId: null,
    displayType: "",
    brandId: null,
    serialNumber: "",
    sound: null,
    createDate: new Date(),
    displaySize: "",
    horizontalNumber: 1,
    verticalNumber: 1,
    aspectRatio: "",
  };

  // Insert the default display item into the "display" array in the DB.
  const db = router.db; // lowdb instance
  db.get("displays").push(defaultDisplayItem).write();

  // Respond with the id of the newly created display item.
  res.status(201).json({ id: defaultDisplayItem.id });
});

// Custom endpoint to delete multiple display items by an array of IDs.
server.post("/deleteDisplays", (req, res) => {
  const { displayIds } = req.body;

  if (!Array.isArray(displayIds)) {
    return res.status(400).json({
      error:
        "Request body should contain an array of IDs under the key 'displayIds'.",
    });
  }

  const db = router.db; // lowdb instance
  const removedIds = [];

  displayIds.forEach((id) => {
    // Find the display item by id
    const displayItem = db.get("displays").find({ id }).value();
    console.log(displayItem);

    if (displayItem) {
      removedIds.push(displayItem.id);
      // Remove the display item from the 'display' collection
      db.get("displays").remove({ id }).write();
    }
  });

  res.status(200).json({ removedIds });
});

// Use JSON Server's auto-generated endpoints from db.json
server.use(router);

const app = express();
app.use(server);

const PORT = 8000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}/`);
});
