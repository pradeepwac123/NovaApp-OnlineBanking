"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function MobileCapturePage() {
  return (
    // Loading fallback: light surface bg with primary spinner
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <MobileCapturePageContent />
    </Suspense>
  );
}

function MobileCapturePageContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session") || "";
  const doc = searchParams.get("doc") || "";
  const isSelfie = doc === "selfie";

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [captured, setCaptured] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [cameraStarted, setCameraStarted] = useState(false);

  const stopStream = (activeStream?: MediaStream | null) => {
    activeStream?.getTracks().forEach((t) => t.stop());
  };

  const attachStreamToVideo = async (activeStream: MediaStream) => {
    const video = videoRef.current;
    if (!video) return;
    video.srcObject = activeStream;
    video.muted = true;
    video.playsInline = true;
    video.setAttribute("muted", "true");
    video.setAttribute("playsinline", "true");
    await new Promise<void>((resolve) => {
      if (video.readyState >= 1) {
        resolve();
        return;
      }
      video.onloadedmetadata = () => resolve();
    });
    try {
      await video.play();
    } catch {}
  };

  useEffect(() => {
    return () => {
      stopStream(streamRef.current);
    };
  }, []);

  const startCamera = async () => {
    try {
      setError("");
      stopStream(streamRef.current);
      let s: MediaStream;
      try {
        s = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: isSelfie ? "user" : "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });
      } catch {
        s = await navigator.mediaDevices.getUserMedia({ video: true });
      }
      streamRef.current = s;
      setStream(s);
      setCameraStarted(true);
      await attachStreamToVideo(s);
    } catch {
      setError("Camera access denied. Please allow camera permissions.");
      setCameraStarted(false);
    }
  };

  const capture = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);
    setCaptured(canvas.toDataURL("image/jpeg", 0.8));
  };

  const retake = () => {
    setCaptured(null);
    startCamera();
  };

  const send = async () => {
    if (!captured) return;
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session: sessionId, doc, image: captured }),
      });
      if (res.ok) setSent(true);
      else setError("Failed to send photo");
    } catch {
      setError("Network error");
    }
  };

  // Success screen
  if (sent) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl mb-4">&#10003;</div>
          <h1 className="text-2xl font-bold mb-2 text-on-surface">Photo received on desktop</h1>
          <p className="text-on-surface-variant">You can close this page now.</p>
        </div>
      </div>
    );
  }

  const docLabel =
    doc === "aadhaar_front" ? "Aadhaar Front"
    : doc === "aadhaar_back" ? "Aadhaar Back"
    : doc === "pan"          ? "PAN Card"
    : "Selfie";

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-4">
      {/* Brand */}
      <h1 className="text-xl font-bold mb-1 text-primary">NovaPay</h1>
      <p className="text-on-surface-variant text-sm mb-4">Capture: {docLabel}</p>

      {/* Error message */}
      {error && <p className="text-error text-sm mb-4" role="alert">{error}</p>}

      {/* Camera / preview area */}
      <div className="relative w-full max-w-sm aspect-[4/3]">
        {!captured ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${isSelfie ? "rounded-full" : "rounded-sm"} ring-2 ring-primary/40`}
            />
            {isSelfie && (
              <div className="absolute inset-0 rounded-full border-4 border-dashed border-primary/30 pointer-events-none" />
            )}
          </>
        ) : (
          // Captured preview — success ring
          <img
            src={captured}
            alt="Captured"
            className={`w-full h-full object-cover ${isSelfie ? "rounded-full" : "rounded-sm"} ring-2 ring-success`}
          />
        )}
      </div>

      {/* Controls */}
      <div className="flex gap-4 mt-6">
        {!captured ? (
          <>
            {!cameraStarted ? (
              <button
                onClick={startCamera}
                className="gradient-btn px-8 py-3 rounded-sm font-semibold text-on-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                Start Camera
              </button>
            ) : (
              <button
                onClick={capture}
                className="gradient-btn px-8 py-3 rounded-sm font-semibold text-on-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                Capture Photo
              </button>
            )}
          </>
        ) : (
          <>
            {/* Secondary: surface-container-high tonal button */}
            <button
              onClick={retake}
              className="px-6 py-3 rounded-sm bg-surface-container-high text-on-surface-variant font-medium transition-colors hover:bg-surface-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Retake
            </button>
            <button
              onClick={send}
              className="gradient-btn px-8 py-3 rounded-sm font-semibold text-on-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Send
            </button>
          </>
        )}
      </div>
    </div>
  );
}
