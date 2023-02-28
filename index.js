const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');

const PORT = 3000;
const JSON_FILE = process.env.JSON_FILE || 'videos.json';
const UPLOADS_DIR = 'uploads';

app.use(bodyParser.json());

// Serve static files from the 'public' directory
app.use(express.static('public'));

app.use(function (err, req, res, next) {
  console.error(err.stack);
  res.status(500).send('Something broke!');
  next(err);
});


// Set up multer storage engine to store files in the 'uploads' directory
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR)
  },
  filename: function (req, file, cb) {
    const fileId = uuidv4();
    const ext = file.originalname.split('.').pop();
    cb(null, `${fileId}.${ext}`)
  }
});

// Set up multer middleware to handle file uploads
const upload = multer({ storage: storage });

// Route to handle file uploads
app.post('/upload', upload.single('video'), (req, res) => {
  // Get the unique ID of the uploaded file
  const fileId = req.file.filename.split('.')[0];

  // Get the file path from the uploaded file object
  const filePath = req.file.path;

  // Add the file path to the JSON file with the generated ID
  const jsonFilePath = path.join(__dirname, JSON_FILE);
  const videos = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
  videos[fileId] = filePath;
  fs.writeFileSync(jsonFilePath, JSON.stringify(videos));

  // Redirect to the video template page with the generated ID
  res.redirect(`/videoTemplate.html?id=${fileId}`);
});

// Route to handle video playback on the template page
app.get('/video', (req, res) => {
  // Get the ID of the video to play from the query parameters
  const fileId = req.query.id;
  console.log("Request Detected! file id =")
  console.info(fileId)
  // Get the file path from the JSON file using the ID
  const jsonFilePath = path.join(__dirname, JSON_FILE);
  const videos = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
  const filePath = videos[fileId];
  console.log("Found Path To Video! videoPath =")
  console.info(filePath)
  if (!filePath) {
    res.status(404).send('Video not found');
    console.log("Request was not sent correctly...")
    return;
  }

  // Serve the video file with the correct MIME type
  const videoFileStream = fs.createReadStream(filePath);
  res.setHeader('Content-Type', 'video/mp4');
  videoFileStream.pipe(res);
  console.log("Success! Check network in case of problems.")
});


// Route to handle video metadata retrieval
app.get('/metadata', (req, res) => {
  // Get the ID of the video to retrieve metadata for from the query parameters
  const fileId = req.query.id;

  // Get the file path from the JSON file using the ID
  const jsonFilePath = path.join(__dirname, JSON_FILE);
  const videos = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
  const filePath = videos[fileId];

  // Get the metadata of the video using a video metadata module
  const metadata = getVideoMetadata(filePath);

  // Send the metadata as a JSON response
  res.json(metadata);
});

// A dummy function to get video metadata
function getVideoMetadata(filePath) {
  return {
    title: 'My Uploaded Video',
    description: 'This is a video I uploaded to my website!'
  };
}


// Start the server
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
