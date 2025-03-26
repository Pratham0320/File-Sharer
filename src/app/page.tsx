'use client';

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import QRCode from "qrcode";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setLoading(true);
    setError(null);

    try {
      // Generate a unique file name
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("file-share")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from("file-share")
        .getPublicUrl(fileName);

      // Store file metadata in the database
      const { data: fileData, error: dbError } = await supabase
        .from("files")
        .insert([
          {
            id: crypto.randomUUID(),
            file_path: fileName,
            file_name: file.name,
            file_size: file.size,
            expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes from now
          },
        ])
        .select()
        .single();

      if (dbError) throw dbError;

      // Generate QR code for the download page URL
      const downloadUrl = `${window.location.origin}/download/${fileData.id}`;
      const qrDataUrl = await QRCode.toDataURL(downloadUrl);
      
      setFileUrl(downloadUrl);
      setQrCode(qrDataUrl);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
  });

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">AnyShare</h1>
          <p className="mt-2 text-gray-600">Share files instantly with a 10-minute expiry</p>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-md">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
              isDragActive ? "border-blue-400 bg-blue-50" : "border-gray-300"
            }`}
          >
            <input {...getInputProps()} />
            {loading ? (
              <p className="text-gray-600">Uploading...</p>
            ) : isDragActive ? (
              <p className="text-blue-600">Drop the file here...</p>
            ) : (
              <p className="text-gray-600">
                Drag and drop a file here, or click to select a file
              </p>
            )}
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-md">
              {error}
            </div>
          )}

          {fileUrl && qrCode && (
            <div className="mt-8 space-y-6">
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-2">Share using QR code:</p>
                <img
                  src={qrCode}
                  alt="QR Code"
                  className="mx-auto w-48 h-48"
                />
              </div>
              
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-2">Or share using link:</p>
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 break-all"
                >
                  {fileUrl}
                </a>
              </div>
              
              <p className="text-center text-sm text-gray-500">
                This link will expire in 10 minutes
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
