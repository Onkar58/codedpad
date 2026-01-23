import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import { getUploadUrl, uploadToS3 } from "../utils/fileFunctions";
import { Loader } from "../components/Loader";

type FileItem = {
  id: string;
  name: string;
  size: string;
  key?: string;
  status: "uploading" | "uploaded" | "error";
};

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export function FilesPage() {
  const { code } = useParams<{ code: string }>();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getAllFiles() {
      try {
        const resp = await fetch(`${BACKEND_URL}/metadata/${code}/files`);
        const body = await resp.json();
        if (Array.isArray(body?.files)) {
          setFiles(body.files);
        }
      } catch (err) {
        console.log({ err });
      } finally {
        setLoading(false);
      }
    }
    getAllFiles();
  }, [code]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;

    Array.from(selectedFiles).forEach(async (file, index) => {
      const tempId = `${Date.now()}-${index}`;

      const newFile: FileItem = {
        id: tempId,
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        status: "uploading",
      };

      setFiles((prev) => [...prev, newFile]);
      await uploadFile(file, newFile);
    });
  };

  const uploadFile = async (file: File, newFile: FileItem) => {
    const { key, uploadUrl } = await getUploadUrl(file);
    await uploadToS3(file, uploadUrl);

    const uploadedFile: FileItem = {
      ...newFile,
      key,
      status: "uploaded",
    };

    setFiles((prev) =>
      prev.map((f) => (f.id === newFile.id ? uploadedFile : f)),
    );

    await fetch(`${BACKEND_URL}/metaData/${code}/files`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ files: [uploadedFile] }),
    });
  };

  const handleDelete = async (fileId: string) => {
    const fileKey = files.find((f) => f.id === fileId)?.key;
    if (!fileKey) return;

    await fetch(`${BACKEND_URL}/metaData/${code}/files`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileKey }),
    });

    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const handleDownload = async (fileKey: string) => {
    const resp = await fetch(`${BACKEND_URL}/s3/presign-download`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: fileKey }),
    });

    const { downloadUrl } = await resp.json();
    window.open(downloadUrl, "_blank");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-app-muted">
        Loading files for "{code}"...
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen px-10 py-8 space-y-8"
    >
      {/* Header */}
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">
          Files for <span className="text-app-muted">{code}</span>
        </h1>

        <button
          onClick={handleUploadClick}
          className="ml-4 px-4 py-2 rounded-md bg-emerald-500 text-black text-sm font-medium hover:bg-emerald-400 transition"
        >
          Upload files
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        hidden
        onChange={handleFileChange}
      />

      {/* Files Grid */}
      <div className="flex flex-wrap gap-4">
        {files.length === 0 && (
          <p className="text-app-muted">No files found for this code.</p>
        )}

        <AnimatePresence>
          {files.map((file) => (
            <motion.div
              key={file.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="relative w-[220px] rounded-xl border border-app bg-app-muted p-4 flex flex-col gap-2"
            >
              {/* Delete */}
              {file.status === "uploaded" && (
                <button
                  onClick={() => handleDelete(file.id)}
                  className="absolute top-2 right-2 text-red-400 hover:text-red-300"
                >
                  ×
                </button>
              )}

              {/* Upload Overlay */}
              {file.status === "uploading" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2 rounded-xl z-10"
                >
                  <Loader />
                  <span className="text-sm text-white">Uploading…</span>
                </motion.div>
              )}

              <div className="font-medium truncate">{file.name}</div>
              <div className="text-xs text-app-muted">Size: {file.size}</div>

              {file.status === "uploaded" && file.key && (
                <button
                  onClick={() => handleDownload(file.key!)}
                  className="mt-auto text-sm py-1.5 rounded-md bg-blue-500 text-white hover:bg-blue-400 transition"
                >
                  Download
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
