
"use client";
import React, { useEffect, useRef, useState } from 'react';
import { FaceLandmarker, FilesetResolver, DrawingUtils } from "@mediapipe/tasks-vision";
import { X, Glasses, Brush, Package, PartyPopper, Zap } from 'lucide-react';

let faceLandmarker: FaceLandmarker;
let lastVideoTime = -1;

// Image assets for filters
const sunglassesImg = new Image();
sunglassesImg.src = '/filters/sunglasses.png';
const hatImg = new Image();
hatImg.src = '/filters/hat.png'; // New hat image

const setupFaceLandmarker = async () => {
    if (faceLandmarker) return;
    const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );
    faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
            modelAssetPath: `/models/face_landmarker.task`,
            delegate: "GPU"
        },
        outputFaceBlendshapes: true,
        runningMode: "VIDEO",
        numFaces: 1
    });
};

type FilterType = "None" | "Sunglasses" | "Blush & Lipstick" | "Funny Nose" | "Hat";

export function FilterCamera({ onCapture }: { onCapture: (image: string) => void }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isCameraReady, setIsCameraReady] = useState(false);
    const [activeFilter, setActiveFilter] = useState<FilterType>("None");

    useEffect(() => {
        const enableWebcam = async () => {
            try {
                await setupFaceLandmarker();
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: 1280, height: 720 },
                });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.addEventListener('loadeddata', predictWebcam);
                }
                setIsCameraReady(true);
            } catch (err) {
                console.error("Failed to start camera:", err);
            }
        };

        enableWebcam();

        return () => {
            const stream = videoRef.current?.srcObject as MediaStream;
            stream?.getTracks().forEach(track => track.stop());
            if (videoRef.current) {
                 videoRef.current.removeEventListener('loadeddata', predictWebcam);
            }
        }
    }, []);

    const drawFilter = (ctx: CanvasRenderingContext2D, landmarks: any[], videoWidth: number, videoHeight: number) => {
        switch (activeFilter) {
            case "Sunglasses":
                const leftEye = landmarks[130];
                const rightEye = landmarks[359];
                if (leftEye && rightEye) {
                    const eyeCenter = { x: (leftEye.x + rightEye.x) / 2 * videoWidth, y: (leftEye.y + rightEye.y) / 2 * videoHeight };
                    const eyeDistance = Math.sqrt(Math.pow((rightEye.x - leftEye.x) * videoWidth, 2) + Math.pow((rightEye.y - leftEye.y) * videoHeight, 2));
                    const glassesWidth = eyeDistance * 2.5;
                    const angle = Math.atan2((rightEye.y - leftEye.y) * videoHeight, (rightEye.x - leftEye.x) * videoWidth);

                    ctx.save();
                    ctx.translate(eyeCenter.x, eyeCenter.y);
                    ctx.rotate(angle);
                    ctx.drawImage(sunglassesImg, -glassesWidth / 2, -glassesWidth * 0.2, glassesWidth, glassesWidth * 0.4);
                    ctx.restore();
                }
                break;
            
            case "Blush & Lipstick":
                 const lipLandmarks = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0, 37, 39, 40, 185, 61].map(i => landmarks[i]);
                 const leftCheek = landmarks[117];
                 const rightCheek = landmarks[346];

                if(lipLandmarks.every(p => p)){
                    ctx.fillStyle = 'rgba(255, 0, 100, 0.5)';
                    ctx.beginPath();
                    ctx.moveTo(lipLandmarks[0].x * videoWidth, lipLandmarks[0].y * videoHeight);
                    for (let i = 1; i < lipLandmarks.length; i++) {
                        ctx.lineTo(lipLandmarks[i].x * videoWidth, lipLandmarks[i].y * videoHeight);
                    }
                    ctx.closePath();
                    ctx.fill();
                }
                if(leftCheek && rightCheek){
                    ctx.fillStyle = 'rgba(255, 105, 180, 0.4)';
                    ctx.beginPath();
                    ctx.arc(leftCheek.x * videoWidth, leftCheek.y * videoHeight, 25, 0, 2 * Math.PI);
                    ctx.fill();
                    ctx.beginPath();
                    ctx.arc(rightCheek.x * videoWidth, rightCheek.y * videoHeight, 25, 0, 2 * Math.PI);
                    ctx.fill();
                }
                break;

            case "Funny Nose":
                const noseTip = landmarks[4];
                if (noseTip) {
                    ctx.fillStyle = 'red';
                    ctx.beginPath();
                    ctx.arc(noseTip.x * videoWidth, noseTip.y * videoHeight, 20, 0, 2 * Math.PI);
                    ctx.fill();
                }
                break;

            case "Hat":
                const forehead = landmarks[10];
                const leftBrow = landmarks[70];
                const rightBrow = landmarks[300];
                if (forehead && leftBrow && rightBrow) {
                    const browWidth = Math.abs(rightBrow.x - leftBrow.x) * videoWidth;
                    const hatWidth = browWidth * 1.8;
                    const hatHeight = hatImg.height * (hatWidth / hatImg.width)

                    ctx.save();
                    ctx.translate(forehead.x * videoWidth, forehead.y * videoHeight);
                    ctx.drawImage(hatImg, -hatWidth / 2, -hatHeight * 0.9, hatWidth, hatHeight);
                    ctx.restore();
                }
                break;
        }
    }

    const predictWebcam = () => {
        if (!videoRef.current || !canvasRef.current || !faceLandmarker) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        if (lastVideoTime !== video.currentTime) {
            lastVideoTime = video.currentTime;
            const results = faceLandmarker.detectForVideo(video, performance.now());

            ctx.save();
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

            if (results.faceLandmarks && results.faceLandmarks.length > 0) {
                drawFilter(ctx, results.faceLandmarks[0], video.videoWidth, video.videoHeight);
            }
            ctx.restore();
        }

        requestAnimationFrame(predictWebcam);
    };

    const handleCapture = () => {
        if (canvasRef.current) {
            const image = canvasRef.current.toDataURL("image/jpeg");
            onCapture(image);
        }
    };

    const FilterButton = ({ filter, icon: Icon, label }: { filter: FilterType, icon: React.ElementType, label: string}) => (
         <button onClick={() => setActiveFilter(filter)} className={`flex flex-col items-center gap-1 p-2 rounded-lg ${activeFilter === filter ? 'bg-accent-pink/30' : ''}`}>
            <Icon size={24} className="text-white" />
            <span className="text-xs text-white">{label}</span>
        </button>
    );

    return (
        <div className="relative w-full aspect-[9/16] bg-black rounded-lg overflow-hidden flex flex-col justify-between">
            <div className="relative w-full h-full">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" />
                {!isCameraReady && (
                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center">
                        <p className="text-white text-lg">Starting camera...</p>
                    </div>
                )}
            </div>
            
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-black/30 backdrop-blur-sm">
                 <div className="flex justify-center items-center gap-4">
                     <FilterButton filter="None" icon={X} label="None" />
                     <FilterButton filter="Sunglasses" icon={Glasses} label="Shades" />
                     <FilterButton filter="Blush & Lipstick" icon={Brush} label="Makeup" />
                     <FilterButton filter="Funny Nose" icon={Package} label="Clown" />
                     <FilterButton filter="Hat" icon={PartyPopper} label="Party" />
                 </div>
                <div className="flex justify-center mt-4">
                    <button 
                        onClick={handleCapture}
                        className="w-16 h-16 rounded-full bg-white border-4 border-accent-pink focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-accent-pink"
                        aria-label="Capture with filter"
                        disabled={!isCameraReady}
                    />
                </div>
            </div>
        </div>
    );
}
