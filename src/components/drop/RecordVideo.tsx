'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";

export default function RecordVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [recordedVideo, setRecordedVideo] = useState<string | null>(null);

  useEffect(() => {
    async function setupCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setMediaStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error("Error accessing camera:", error);
      }
    }

    if (!recordedVideo) {
        setupCamera();
    }

    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [recordedVideo]);

  const handleStartRecording = () => {
    if (mediaStream) {
      const recorder = new MediaRecorder(mediaStream);
      setMediaRecorder(recorder);
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setRecordedChunks((prev) => [...prev, event.data]);
        }
      };
      recorder.start();
      setIsRecording(true);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
      const blob = new Blob(recordedChunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      setRecordedVideo(url);
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    }
  };

  const handleSave = () => {
    // In a real app, you'd upload the video to a storage service
    alert('Video saved! (not really)');
  };

  const handleDiscard = () => {
    setRecordedVideo(null);
    setRecordedChunks([]);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <h1 className="text-4xl font-bold">Record Drop</h1>
      
      <div className="my-8 relative">
        <video ref={videoRef} autoPlay={!recordedVideo} muted={!recordedVideo} controls={!!recordedVideo} src={recordedVideo || undefined} className="w-full h-auto border rounded-lg" />
        {isRecording && <div className="absolute top-2 right-2 w-4 h-4 bg-red-500 rounded-full animate-pulse" />}
      </div>
      
      <div className="flex gap-4">
        {!recordedVideo ? (
          <Button onClick={isRecording ? handleStopRecording : handleStartRecording}>
            {isRecording ? 'Stop' : 'Record'}
          </Button>
        ) : (
          <>
            <Button onClick={handleSave}>Save</Button>
            <Button onClick={handleDiscard}>Discard</Button>
          </>
        )}
      </div>
    </div>
  );
}
