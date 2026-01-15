'use client';

import { Button } from "@/components/ui/button";

type Props = {
  setCreationStep: (step: 'recordVideo' | 'uploadFile') => void;
};

export default function VideoOrUpload({ setCreationStep }: Props) {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <h1 className="text-4xl font-bold">Create Drop</h1>

      <div className="my-8 flex gap-4">
        <Button onClick={() => setCreationStep('recordVideo')}>Record Video</Button>
        <Button onClick={() => setCreationStep('uploadFile')}>Upload File</Button>
      </div>
    </div>
  );
}
