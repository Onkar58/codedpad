export async function getUploadUrl(file: File) {
  const res = await fetch("http://localhost:4000/s3/presign-upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
    }),
  });

  return res.json();
}

export async function uploadToS3(file: File, uploadUrl: string) {
  await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
}

export async function getDownloadUrl(key: string) {
  const res = await fetch("http://localhost:4000/s3/presign-download", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key }),
  });

  return res.json(); // { downloadUrl }
}
