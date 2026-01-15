'use client';

import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";

export default function UploadFile() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleUpload = () => {
    if (file) {
      // In a real app, you'd upload the file to a storage service
      alert(`Uploading ${file.name}... (not really)`);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <h1 className="text-4xl font-bold">Upload Drop</h1>

      <div className="my-8 w-full max-w-md flex flex-col items-center gap-4">
        {previewUrl ? (
          <div className="relative w-full">
            {file?.type.startsWith('video') ? (
                <video src={previewUrl} controls className="w-full h-auto border rounded-lg" />
            ) : (
                <img src={previewUrl} alt="File preview" className="w-full h-auto border rounded-lg" />
            )}
            <Button onClick={handleRemoveFile} className="absolute top-2 right-2">Remove</Button>
          </div>
        ) : (
          <div className="w-full h-48 border-2 border-dashed rounded-lg flex items-center justify-center">
            <input ref={fileInputRef} type="file" onChange={handleFileChange} className="hidden" id="file-upload" />
            <label htmlFor="file-upload" className="cursor-pointer">
                <p className="text-center text-muted-foreground">Click to select a file</p>
            </label>
          </div>
        )}
      </div>

      {file && <Button onClick={handleUpload}>Upload</Button>}
    </div>
  );
}
