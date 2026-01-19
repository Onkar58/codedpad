import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { v4 as uuidv4 } from "uuid";
import { generateDownloadUrl, generateUploadUrl } from "./helpers/awsClient";
import { metaDataRouter } from "./routes/metadata.route";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.post("/s3/presign-upload", async (req, res) => {
  try {
    const { fileName, fileType, fileSize } = req.body;

    // ---- VALIDATION (your "input check") ----
    if (!fileName || !fileType || !fileSize) {
      return res.status(400).json({ error: "Missing file metadata" });
    }

    if (fileSize > 50 * 1024 * 1024) {
      return res.status(400).json({ error: "File too large (max 50MB)" });
    }

    const allowedTypes = ["image/png", "image/jpeg", "application/pdf"];
    if (!allowedTypes.includes(fileType)) {
      return res.status(400).json({ error: "File type not allowed" });
    }

    // Create unique key in S3
    const key = `uploads/${uuidv4()}-${fileName}`;

    const uploadUrl = await generateUploadUrl(key, fileType);

    return res.json({
      uploadUrl,
      key,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create presigned URL" });
  }
});

app.post("/s3/presign-download", async (req, res) => {
  try {
    const { key } = req.body;

    if (!key) {
      return res.status(400).json({ error: "Missing file key" });
    }

    const downloadUrl = await generateDownloadUrl(key);

    res.json({ downloadUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create download URL" });
  }
});

app.use("/metaData", metaDataRouter);
const PORT = 4000;
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`),
);
