'use client';

import { useState } from 'react';
import VideoOrUpload from './VideoOrUpload';
import RecordVideo from './RecordVideo';
import UploadFile from './UploadFile';

export default function Creating() {
  const [creationStep, setCreationStep] = useState('selectType');

  if (creationStep === 'recordVideo') {
    return <RecordVideo />;
  }

  if (creationStep === 'uploadFile') {
    return <UploadFile />;
  }

  return <VideoOrUpload setCreationStep={setCreationStep} />;
}
