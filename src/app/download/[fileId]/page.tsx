'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface FileData {
  url: string;
  name: string;
  expiresAt: string;
}

export default function DownloadPage() {
  const params = useParams();
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFileData = async () => {
      try {
        const response = await fetch(`/api/download/${params.fileId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch file data');
        }

        setFileData(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to fetch file data');
      } finally {
        setLoading(false);
      }
    };

    fetchFileData();
  }, [params.fileId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!fileData) return null;

  const isExpired = new Date(fileData.expiresAt) < new Date();
  const timeLeft = Math.max(
    0,
    Math.floor((new Date(fileData.expiresAt).getTime() - Date.now()) / 1000)
  );

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Download File</h1>
        
        {isExpired ? (
          <div className="text-red-600">
            <p>This file has expired and is no longer available.</p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <p className="text-gray-600 mb-2">File name: {fileData.name}</p>
              <p className="text-gray-600">
                Time left: {Math.floor(timeLeft / 60)}m {timeLeft % 60}s
              </p>
            </div>

            <a
              href={fileData.url}
              download={fileData.name}
              className="block w-full bg-blue-600 text-white text-center py-3 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Download File
            </a>
          </>
        )}
      </div>
    </div>
  );
}
