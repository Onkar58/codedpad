import { Router, Request, Response } from "express";
import {
  addOrAppendFiles,
  removeFileByIndex,
  deleteItem,
  getFilesByCode,
} from "../helpers/awsClient"; // adjust path as needed

const router = Router();

interface UserParams {
  code: string;
  index?: string;
}

/**
 * POST /db/:code/files
 * Add files (creates item if not exists)
 */
router.post("/:code/files", async (req: Request<UserParams>, res: Response) => {
  try {
    const { code } = req.params;
    const { files } = req.body;

    if (!Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: "files must be a non-empty array" });
    }

    const updatedItem = await addOrAppendFiles(code, files);
    res.json(updatedItem);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /db/:code/files
 * Get all files for a code
 */
router.get("/:code/files", async (req: Request<UserParams>, res: Response) => {
  try {
    const { code } = req.params;

    const files = await getFilesByCode(code);

    if (!files) {
      return res.status(404).json({ message: "Code not found" });
    }

    res.json({ code, files });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /db/:code/files
 * Remove a single file by fileKey
 */
router.delete(
  "/:code/files",
  async (req: Request<UserParams>, res: Response) => {
    try {
      const { code } = req.params;
      const { fileKey } = req.body;

      const item = await getFilesByCode(code);

      const index = item.findIndex((f: any) => f.key === fileKey);

      if (index === -1) {
        throw new Error("File not found");
      }

      return removeFileByIndex(code, index);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },
);

/**
 * DELETE /db/:code
 * Delete entire item
 */
router.delete("/:code", async (req: Request<UserParams>, res: Response) => {
  try {
    const { code } = req.params;

    await deleteItem(code);
    res.json({ success: true, message: "Item deleted" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export { router as metaDataRouter };
