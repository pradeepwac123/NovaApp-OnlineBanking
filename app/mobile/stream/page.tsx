"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function MobileStreamPage() {
  return (
    // Loading fallback: light surface bg
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <MobileStreamPageContent />
    </Suspense>
  );
}

function MobileStreamPageContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session") || "";

  const videoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const [status, setStatus] = useState<"idle" | "starting" | "streaming" | "error" | "insecure" | "done">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // Fallback: capture photo and upload via polling API (for non-HTTPS)
  const [fallbackMode, setFallbackMode] = useState(false);
  const [captured, setCaptured] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const attachStreamToVideo = async (stream: MediaStream) => {
    const video = videoRef.current;
    if (!video) return;
    video.srcObject = stream;
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
    if (!sessionId) { setErrorMsg("No session ID"); setStatus("error"); return; }

    const isLocalhost = ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
    if (!window.isSecureContext && !isLocalhost) {
      setStatus("insecure");
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setStatus("insecure");
      return;
    }

    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (pcRef.current) pcRef.current.close();
    };
  }, []);

  const startStreaming = async () => {
    try {
      setErrorMsg("");
      setStatus("starting");
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "user" },
            width:  { ideal: 640 },
            height: { ideal: 480 },
          },
          audio: false,
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }
      streamRef.current = stream;
      await attachStreamToVideo(stream);

      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302"  },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      });
      pcRef.current = pc;

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          fetch("/api/signal", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ session: sessionId, type: "ice-phone", data: event.candidate.toJSON() }),
          });
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "connected")   setStatus("streaming");
        if (pc.connectionState === "disconnected" || pc.connectionState === "failed") setStatus("done");
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      await fetch("/api/signal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session: sessionId, type: "offer", data: offer }),
      });

      setStatus("streaming");

      pollingRef.current = setInterval(async () => {
        try {
          const answerRes = await fetch(`/api/signal?session=${sessionId}&type=answer`);
          const answerData = await answerRes.json();
          if (answerData.data && pc.signalingState === "have-local-offer") {
            await pc.setRemoteDescription(new RTCSessionDescription(answerData.data));
          }
          const iceRes = await fetch(`/api/signal?session=${sessionId}&type=ice-desktop`);
          const iceData = await iceRes.json();
          if (iceData.data && Array.isArray(iceData.data)) {
            for (const candidate of iceData.data) {
              try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch {}
            }
          }
          if (pc.connectionState === "connected" && pc.remoteDescription) {
            clearInterval(pollingRef.current!);
          }
        } catch {}
      }, 1000);

    } catch (err: any) {
      setErrorMsg(err?.message || "Camera access denied");
      setStatus("error");
    }
  };

  // Fallback: file/camera input capture
  const handleFallbackCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCaptured(reader.result as string);
    reader.readAsDataURL(file);
  };

  const sendFallbackPhoto = async () => {
    if (!captured) return;
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session: sessionId, doc: "selfie", image: captured }),
      });
      if (res.ok) setSent(true);
      else setErrorMsg("Failed to send photo");
    } catch { setErrorMsg("Network error"); }
  };

  // ─── SENT SCREEN ───
  if (sent) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 text-center">
        <div className="text-6xl mb-4 text-success">&#10003;</div>
        <h1 className="text-xl font-bold mb-2 text-on-surface">Selfie Sent!</h1>
        <p className="text-on-surface-variant text-sm">
          Your photo has been sent to the desktop. You can close this page now.
        </p>
      </div>
    );
  }

  // ─── INSECURE / FALLBACK MODE ───
  if (status === "insecure" || fallbackMode) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6">
        {/* Brand */}
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-sm bg-primary flex items-center justify-center text-sm font-bold text-on-primary">
            N
          </div>
          <span className="font-bold text-on-surface text-lg">NovaPay</span>
        </div>

        {!captured ? (
          <div className="text-center">
            <div className="text-4xl mb-4">&#128247;</div>
            <h1 className="text-lg font-bold mb-2 text-on-surface">Take a Selfie</h1>
            <p className="text-on-surface-variant text-sm mb-2 max-w-xs">
              Live streaming requires HTTPS. Use the button below to take a selfie with your camera app instead.
            </p>
            <p className="text-xs text-on-surface-variant/60 mb-6">
              Tip: For live streaming, access via HTTPS or localhost
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="user"
              onChange={handleFallbackCapture}
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="gradient-btn px-8 py-3 rounded-sm font-semibold text-on-primary text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Open Camera &amp; Take Selfie
            </button>
          </div>
        ) : (
          <div className="text-center">
            {/* Preview circle: success ring on light bg */}
            <div className="w-48 h-48 rounded-full overflow-hidden ring-4 ring-success mx-auto mb-4">
              <img src={captured} alt="Selfie preview" className="w-full h-full object-cover" />
            </div>
            <p className="text-success text-sm font-medium mb-4">Looking good!</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => { setCaptured(null); fileInputRef.current?.click(); }}
                className="px-5 py-2.5 rounded-sm bg-surface-container-high text-on-surface-variant text-sm font-medium hover:bg-surface-container transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                Retake
              </button>
              <button
                onClick={sendFallbackPhoto}
                className="gradient-btn px-6 py-2.5 rounded-sm font-semibold text-on-primary text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                Send to Desktop
              </button>
            </div>
          </div>
        )}

        {errorMsg && (
          <p className="text-error text-sm mt-4" role="alert">{errorMsg}</p>
        )}
      </div>
    );
  }

  // ─── MAIN STREAM SCREEN ───
  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-4">
      {/* Brand */}
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 rounded-sm bg-primary flex items-center justify-center text-sm font-bold text-on-primary">
          N
        </div>
        <span className="font-bold text-on-surface text-lg">NovaPay</span>
      </div>

      {status === "error" ? (
        <div className="text-center">
          <div className="text-5xl mb-4">&#10007;</div>
          <h1 className="text-xl font-bold mb-2 text-on-surface">Camera Error</h1>
          <p className="text-on-surface-variant text-sm max-w-xs mb-4">{errorMsg}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-primary rounded-sm text-sm font-medium text-on-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Retry
            </button>
            <button
              onClick={() => setFallbackMode(true)}
              className="px-6 py-2 bg-surface-container-high rounded-sm text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Use Photo Instead
            </button>
          </div>
        </div>

      ) : status === "done" ? (
        <div className="text-center">
          <div className="text-5xl mb-4 text-success">&#10003;</div>
          <h1 className="text-xl font-bold mb-2 text-on-surface">Stream Ended</h1>
          <p className="text-on-surface-variant text-sm">
            The desktop has captured your selfie. You can close this page.
          </p>
        </div>

      ) : (
        <>
          <p className="text-xs text-on-surface-variant uppercase tracking-wider mb-3">
            {status === "idle"      ? "Ready to start camera"
            : status === "starting" ? "Starting camera..."
            : "Live streaming to desktop"}
          </p>

          {/* Camera circle: primary ring */}
          <div className="relative">
            <div className="w-64 h-64 rounded-full overflow-hidden ring-4 ring-primary">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]"
              />
            </div>

            {/* Live indicator badge */}
            {status === "streaming" && (
              <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-error/90 px-2 py-0.5 rounded-full">
                <div className="w-2 h-2 bg-on-primary rounded-full animate-pulse" />
                <span className="text-[10px] font-bold uppercase text-on-primary">Live</span>
              </div>
            )}

            {/* Pulse ring — GPU-accelerated opacity/transform */}
            <div
              className="absolute inset-0 rounded-full ring-4 ring-primary/20 animate-ping"
              style={{ animationDuration: "2s" }}
            />
          </div>

          {/* Connection status indicator */}
          <div className="mt-4 flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full animate-pulse ${
                status === "streaming" ? "bg-success" : "bg-primary"
              }`}
            />
            <span className="text-xs text-on-surface-variant">
              {status === "streaming" ? "Connected — Desktop can see your face"
              : status === "starting"  ? "Connecting..."
              : "Tap below to allow camera"}
            </span>
          </div>

          {status !== "streaming" && (
            <div className="mt-5 flex flex-col items-center gap-3">
              <button
                onClick={startStreaming}
                className="gradient-btn px-8 py-3 rounded-sm font-semibold text-on-primary text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                Start Front Camera
              </button>
              <button
                onClick={() => setFallbackMode(true)}
                className="px-6 py-2 bg-surface-container-high rounded-sm text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                Use Photo Instead
              </button>
            </div>
          )}

          <p className="text-xs text-on-surface-variant/60 mt-6 text-center max-w-xs">
            Keep your face centered in the circle. The desktop will capture the selfie from this live stream.
          </p>
        </>
      )}
    </div>
  );
}
