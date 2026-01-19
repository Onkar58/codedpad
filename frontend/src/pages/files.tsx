import React from "react";
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Loader } from "../components/Loader";
import { getUploadUrl, uploadToS3 } from "../utils/fileFunctions";

type FileItem = {
  id: string;
  name: string;
  size: string;
  key?: string;
  status: "uploading" | "uploaded" | "error";
};

const BACKEND_URL = "http://localhost:4000";

export function FilesPage() {
  const { code } = useParams<{ code: string }>();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function getAllFiles() {
      const resp = await fetch(`${BACKEND_URL}/metadata/${code}/files`);
      const body = await resp.json();
      if (Array.isArray(body?.files) && body.files.length) {
        console.log({ body });
        setFiles(body?.files);
      }
    }
    getAllFiles();
    setLoading(false);
  }, []);

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
      await uploadFile(file, newFile);
    });
  };

  const uploadFile = async (file: File, newFile: FileItem) => {
    const formData = new FormData();
    formData.append("file", file);

    const { key, uploadUrl } = await getUploadUrl(file);
    await uploadToS3(file, uploadUrl);
    const newFileItem: FileItem = {
      ...newFile,
      key,
      status: "uploaded",
    };
    setFiles((prev) => [...prev, ...[newFileItem]]);
    await fetch(`${BACKEND_URL}/metaData/${code}/files`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ files: [newFileItem] }),
    });
  };

  const handleDelete = async (fileId: string) => {
    await fetch(`${BACKEND_URL}/metaData/${code}/files`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileKey: files.find((file) => file.id === fileId)?.key,
      }),
    });
    setFiles((prev) => {
      const newFiles = prev.filter((file) => file.id !== fileId);
      return newFiles;
    });
  };
  const handleDownload = async (fileKey: string) => {
    const resp = await fetch(`${BACKEND_URL}/s3/presign-download`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        key: fileKey,
      }),
    });
    const { downloadUrl } = await resp.json();
    console.log({ downloadUrl });
    window.open(downloadUrl, "_blank");
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", marginTop: "40px" }}>
        Loading files for "{code}"...
      </div>
    );
  }

  return (
    <div style={{ padding: "40px", height: "100vh", width: "100vw" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "start",
          gap: "20px",
        }}
      >
        <h1>Files for: {code}</h1>

        <button
          onClick={handleUploadClick}
          style={{
            // marginBottom: "20px",
            padding: "10px 16px",
            borderRadius: "8px",
            border: "none",
            background: "#22c55e",
            color: "white",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          Upload Files
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      <div
        style={{
          display: "flex",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        {files.length === 0 && <h1>No Files found for the code</h1>}
        {files.map((file) => (
          <div
            key={file.id}
            style={{
              position: "relative",
              width: "220px",
              padding: "16px",
              borderRadius: "12px",
              border: "1px solid #ddd",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              overflow: "hidden",
            }}
          >
            {/* DELETE BUTTON */}
            {file.status === "uploaded" && (
              <button
                onClick={() => handleDelete(file.id)}
                style={{
                  position: "absolute",
                  top: "8px",
                  right: "8px",
                  border: "none",
                  color: "red",
                  width: "24px",
                  height: "24px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  background: "none",
                  zIndex: 10,
                }}
              >
                ×
              </button>
            )}

            {/* PROGRESS OVERLAY */}
            {file.status === "uploading" && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(0,0,0,0.55)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                  color: "white",
                  gap: "8px",
                  zIndex: 5,
                }}
              >
                <Loader />
              </div>
            )}

            <div style={{ fontWeight: "600" }}>{file.name}</div>
            <div style={{ color: "#666", fontSize: "14px" }}>
              Size: {file.size}
            </div>

            {file.status === "uploaded" && file.key && (
              <button
                style={{
                  marginTop: "auto",
                  textAlign: "center",
                  padding: "8px",
                  borderRadius: "8px",
                  background: "#0070f3",
                  color: "white",
                  textDecoration: "none",
                  fontSize: "14px",
                }}
                onClick={() => handleDownload(file.key)}
              >
                Download
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
