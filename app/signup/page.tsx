"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import QRCode from "qrcode";
import { v4 as uuidv4 } from "uuid";

const TOTAL_STEPS = 7;
const STEP_LABELS = ["Account", "Details", "MPIN", "Documents", "Selfie", "Review", "Done"];

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  // Step 1: Account
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", password: "", confirmPassword: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  // Step 2: Personal details
  const [dob, setDob] = useState("");

  // Step 3: MPIN
  const [pins, setPins] = useState(["", "", "", ""]);
  const [confirmPins, setConfirmPins] = useState(["", "", "", ""]);
  const [mpinError, setMpinError] = useState("");

  // Step 4: Documents
  const [docs, setDocs] = useState<{ aadhaarFront: string | null; aadhaarBack: string | null; pan: string | null }>({
    aadhaarFront: null, aadhaarBack: null, pan: null,
  });
  const [docError, setDocError] = useState("");

  // Step 5: Selfie
  const [selfieData, setSelfieData] = useState<string | null>(null);
  const [selfieError, setSelfieError] = useState("");

  // Step 6/7: Account info
  const [accountInfo, setAccountInfo] = useState({ accountNo: "", upiId: "" });

  const next = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  const back = () => setStep((s) => Math.max(s - 1, 1));

  /* ─── Step 1: Validate & Register ─── */
  const validateStep1 = () => {
    const e: Record<string, string> = {};
    if (!form.firstName.trim()) e.firstName = "Required";
    if (!form.lastName.trim()) e.lastName = "Required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Invalid email";
    if (!/^\d{10}$/.test(form.phone)) e.phone = "Must be 10 digits";
    if (form.password.length < 6) e.password = "Min 6 characters";
    if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords don't match";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validateStep1()) return;
    setServerError("");
    next();
  };

  const validateStep2 = () => {
    const e: Record<string, string> = {};
    if (!dob) e.dob = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleMpinSubmit = async () => {
    const pin = pins.join("");
    const confirm = confirmPins.join("");
    if (pin.length !== 4) { setMpinError("Enter all 4 digits"); return; }
    if (confirm.length !== 4) { setMpinError("Confirm your MPIN"); return; }
    if (pin !== confirm) { setMpinError("MPINs don't match"); return; }
    setMpinError("");
    next();
  };

  const handleDocsContinue = () => {
    if (!docs.aadhaarFront || !docs.aadhaarBack || !docs.pan) {
      setDocError("Please upload all 3 documents to continue");
      return;
    }
    setDocError("");
    next();
  };

  const handleSelfieContinue = () => {
    if (!selfieData) {
      setSelfieError("Please capture your selfie to continue");
      return;
    }
    setSelfieError("");
    next();
  };

  const handleComplete = async () => {
    const pin = pins.join("");
    setLoading(true);
    setServerError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          dob,
          mpin: pin,
          aadhaarFront: docs.aadhaarFront,
          aadhaarBack: docs.aadhaarBack,
          pan: docs.pan,
          selfie: selfieData,
          kycStatus: "verified",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setServerError(data.error || "Registration failed");
        setLoading(false);
        return;
      }

      const signInRes = await signIn("credentials", { email: form.email, password: form.password, redirect: false });
      if (signInRes?.error) {
        setServerError("Account created but login failed.");
        setLoading(false);
        return;
      }

      const meRes = await fetch("/api/auth/me");
      const meData = await meRes.json();
      if (meData.user) setAccountInfo({ accountNo: meData.user.accountNo, upiId: meData.user.upiId });

      setLoading(false);
      next();
    } catch {
      setServerError("Something went wrong");
      setLoading(false);
    }
  };

  const field = (name: keyof typeof form, label: string, type = "text", placeholder = "") => (
    <div>
      <label className="block text-sm text-muted mb-1.5">{label}</label>
      <input type={type} placeholder={placeholder} value={form[name]}
        onChange={(e) => setForm({ ...form, [name]: e.target.value })}
        className="w-full bg-darkbg border border-white/10 rounded-xl px-4 py-3 text-white placeholder-muted/50 focus:border-primary focus:outline-none transition" />
      {errors[name] && <p className="text-error text-xs mt-1">{errors[name]}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-darkbg flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <Link href="/" className="text-2xl font-bold gradient-text block text-center mb-4">NovaPay</Link>

        {step < TOTAL_STEPS && (
          <div className="mb-6">
            <div className="flex justify-between text-xs text-muted mb-2">
              <span>Step {step} of {TOTAL_STEPS - 1}</span>
              <span>{Math.round((step / (TOTAL_STEPS - 1)) * 100)}%</span>
            </div>
            <div className="h-2 bg-cardbg rounded-full overflow-hidden">
              <motion.div className="h-full bg-gradient-to-r from-primary to-secondary rounded-full" animate={{ width: `${(step / (TOTAL_STEPS - 1)) * 100}%` }} transition={{ duration: 0.4 }} />
            </div>
            <div className="flex justify-between mt-3">
              {STEP_LABELS.slice(0, -1).map((label, i) => (
                <div key={label} className="flex flex-col items-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all ${
                    i + 1 < step ? "bg-success border-success text-white" : i + 1 === step ? "bg-primary border-primary text-white" : "border-white/10 text-muted"
                  }`}>{i + 1 < step ? "✓" : i + 1}</div>
                  <span className={`text-[9px] mt-1 hidden sm:block ${i + 1 === step ? "text-primary" : "text-muted/50"}`}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>

            {/* STEP 1: Account */}
            {step === 1 && (
              <div className="glass rounded-2xl p-8">
                <h1 className="text-xl font-semibold text-center mb-6">Create your account</h1>
                {serverError && <div className="bg-error/10 border border-error/30 rounded-xl p-3 text-error text-sm mb-4">{serverError}</div>}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">{field("firstName", "First Name", "text", "John")}{field("lastName", "Last Name", "text", "Doe")}</div>
                  {field("email", "Email", "email", "john@example.com")}
                  {field("phone", "Phone Number", "tel", "9876543210")}
                  {field("password", "Password", "password", "••••••")}
                  {field("confirmPassword", "Confirm Password", "password", "••••••")}
                  <button onClick={handleRegister} disabled={loading} className="w-full gradient-btn py-3 rounded-xl font-semibold text-white disabled:opacity-50">
                    {loading ? "Creating account..." : "Continue"}
                  </button>
                </div>
                <p className="text-muted text-sm text-center mt-4">Already have an account? <Link href="/login" className="text-primary hover:underline">Login</Link></p>
              </div>
            )}

            {/* STEP 2: Personal Details */}
            {step === 2 && (
              <div className="glass rounded-2xl p-8">
                <h2 className="text-xl font-semibold mb-6">Personal Details</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm text-muted mb-1.5">First Name</label><input value={form.firstName} disabled className="w-full bg-darkbg/50 border border-white/5 rounded-xl px-4 py-3 text-muted" /></div>
                    <div><label className="block text-sm text-muted mb-1.5">Last Name</label><input value={form.lastName} disabled className="w-full bg-darkbg/50 border border-white/5 rounded-xl px-4 py-3 text-muted" /></div>
                  </div>
                  <div><label className="block text-sm text-muted mb-1.5">Email</label><input value={form.email} disabled className="w-full bg-darkbg/50 border border-white/5 rounded-xl px-4 py-3 text-muted" /></div>
                  <div><label className="block text-sm text-muted mb-1.5">Phone</label><input value={form.phone} disabled className="w-full bg-darkbg/50 border border-white/5 rounded-xl px-4 py-3 text-muted" /></div>
                  <div>
                    <label className="block text-sm text-muted mb-1.5">Date of Birth <span className="text-error">*</span></label>
                    <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="w-full bg-darkbg border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:outline-none transition" />
                    {errors.dob && <p className="text-error text-xs mt-1">{errors.dob}</p>}
                  </div>
                </div>
                <div className="flex gap-4 mt-6">
                  <button onClick={back} className="px-6 py-3 rounded-xl border border-white/10 text-muted hover:text-white transition">Back</button>
                  <button onClick={() => validateStep2() && next()} className="flex-1 gradient-btn py-3 rounded-xl font-semibold text-white">Continue</button>
                </div>
              </div>
            )}

            {/* STEP 3: MPIN */}
            {step === 3 && (
              <div className="glass rounded-2xl p-8">
                <h2 className="text-xl font-semibold mb-2">Set Your MPIN</h2>
                <p className="text-muted text-sm mb-8">Create a 4-digit MPIN to secure your transactions</p>
                <div className="space-y-8">
                  <div><label className="block text-sm text-muted mb-4 text-center font-medium">Enter 4-digit MPIN</label><PinBoxes values={pins} onChange={setPins} autoFocusFirst /></div>
                  <div><label className="block text-sm text-muted mb-4 text-center font-medium">Confirm MPIN</label><PinBoxes values={confirmPins} onChange={setConfirmPins} /></div>
                  {mpinError && <motion.p className="text-error text-sm text-center" initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}>{mpinError}</motion.p>}
                </div>
                <div className="flex gap-4 mt-8">
                  <button onClick={back} className="px-6 py-3 rounded-xl border border-white/10 text-muted hover:text-white transition">Back</button>
                  <button onClick={handleMpinSubmit} className="flex-1 gradient-btn py-3 rounded-xl font-semibold text-white">Continue</button>
                </div>
              </div>
            )}

            {/* STEP 4: Documents (MANDATORY) */}
            {step === 4 && (
              <div className="glass rounded-2xl p-8">
                <h2 className="text-xl font-semibold mb-2">Document Upload</h2>
                <p className="text-muted text-sm mb-6">Upload your KYC documents to verify your identity <span className="text-error">*</span></p>
                {docError && <motion.div className="bg-error/10 border border-error/30 rounded-xl p-3 text-error text-sm mb-4" initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}>{docError}</motion.div>}
                <div className="space-y-4">
                  <DropZone label="Aadhaar Card — Front" fileName={docs.aadhaarFront} required onFile={(f) => { setDocs({ ...docs, aadhaarFront: f.name }); setDocError(""); }} />
                  <DropZone label="Aadhaar Card — Back" fileName={docs.aadhaarBack} required onFile={(f) => { setDocs({ ...docs, aadhaarBack: f.name }); setDocError(""); }} />
                  <DropZone label="PAN Card" fileName={docs.pan} required onFile={(f) => { setDocs({ ...docs, pan: f.name }); setDocError(""); }} />
                </div>
                <div className="flex gap-4 mt-8">
                  <button onClick={back} className="px-6 py-3 rounded-xl border border-white/10 text-muted hover:text-white transition">Back</button>
                  <button onClick={handleDocsContinue} className="flex-1 gradient-btn py-3 rounded-xl font-semibold text-white">Continue</button>
                </div>
              </div>
            )}

            {/* STEP 5: Selfie with REAL-TIME WebRTC (MANDATORY) */}
            {step === 5 && (
              <Step5WebRTCSelfie
                selfieData={selfieData}
                setSelfieData={setSelfieData}
                selfieError={selfieError}
                onContinue={handleSelfieContinue}
                onBack={back}
              />
            )}

            {/* STEP 6: Review */}
            {step === 6 && (
              <div className="glass rounded-2xl p-8">
                <h2 className="text-xl font-semibold mb-6">Review & Submit</h2>
                {serverError && <div className="bg-error/10 border border-error/30 rounded-xl p-3 text-error text-sm mb-4">{serverError}</div>}
                <div className="space-y-4">
                  <SummaryRow label="Name" value={`${form.firstName} ${form.lastName}`} />
                  <SummaryRow label="Email" value={form.email} />
                  <SummaryRow label="Phone" value={form.phone} />
                  <SummaryRow label="Date of Birth" value={dob || "—"} />
                  <SummaryRow label="MPIN" value="••••" />
                  <SummaryRow label="Aadhaar Front" value={docs.aadhaarFront || "—"} ok={!!docs.aadhaarFront} />
                  <SummaryRow label="Aadhaar Back" value={docs.aadhaarBack || "—"} ok={!!docs.aadhaarBack} />
                  <SummaryRow label="PAN Card" value={docs.pan || "—"} ok={!!docs.pan} />
                  <SummaryRow label="Selfie" value={selfieData ? "Captured" : "—"} ok={!!selfieData} />
                </div>
                <div className="flex gap-4 mt-8">
                  <button onClick={back} className="px-6 py-3 rounded-xl border border-white/10 text-muted hover:text-white transition">Back</button>
                  <button onClick={handleComplete} disabled={loading} className="flex-1 gradient-btn py-3 rounded-xl font-semibold text-white disabled:opacity-50">
                    {loading ? "Creating Account..." : "Complete Setup"}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 7: Done */}
            {step === 7 && <StepDone firstName={form.firstName} lastName={form.lastName} accountNo={accountInfo.accountNo} upiId={accountInfo.upiId} />}

          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   STEP 5: WebRTC Real-Time Selfie
   ═══════════════════════════════════════════════ */
function Step5WebRTCSelfie({ selfieData, setSelfieData, selfieError, onContinue, onBack }: {
  selfieData: string | null;
  setSelfieData: (d: string | null) => void;
  selfieError: string;
  onContinue: () => void;
  onBack: () => void;
}) {
  const [sessionId] = useState(() => uuidv4());
  const [qrUrl, setQrUrl] = useState("");
  const [mobileUrl, setMobileUrl] = useState("");
  const [mode, setMode] = useState<"choose" | "webcam" | "phone">("choose");
  const [phoneConnected, setPhoneConnected] = useState(false);
  const [captured, setCaptured] = useState<string | null>(selfieData);
  const [webcamReady, setWebcamReady] = useState(false);

  // Webcam refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // WebRTC refs
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const icePollingRef = useRef<NodeJS.Timeout | null>(null);
  const fallbackPollingRef = useRef<NodeJS.Timeout | null>(null);

  const isTouchDevice = typeof window !== "undefined" && (
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    window.matchMedia("(pointer: coarse)").matches
  );

  const stopWebcam = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setWebcamReady(false);
  };

  const attachVideoStream = async (video: HTMLVideoElement | null, stream: MediaStream) => {
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

  // Auto-detect touch devices: go straight to webcam mode for live selfie
  useEffect(() => {
    if (isTouchDevice && !captured) setMode("webcam");
  }, [isTouchDevice, captured]);

  useEffect(() => {
    if (mode === "webcam" && !captured) {
      startWebcam();
    }
    if (mode !== "webcam") {
      stopWebcam();
    }

    return () => {
      stopWebcam();
    };
  }, [mode, captured]);

  // Generate QR for phone mode
  useEffect(() => {
    if (mode === "phone") {
      const currentUrl = new URL(window.location.href);
      const localIp = process.env.NEXT_PUBLIC_LOCAL_IP;
      const isLocalhost = ["localhost", "127.0.0.1", "::1"].includes(currentUrl.hostname);
      const url = isLocalhost && localIp
        ? `${currentUrl.protocol}//${localIp}:${currentUrl.port || "3000"}/mobile/stream?session=${sessionId}`
        : `${currentUrl.origin}/mobile/stream?session=${sessionId}`;
      setMobileUrl(url);
      QRCode.toDataURL(url, { width: 220, color: { dark: "#FFFFFF", light: "#00000000" } }).then(setQrUrl);
      startWebRTCReceiver();

      // Also poll image store as fallback (phone may send photo instead of stream on non-HTTPS)
      fallbackPollingRef.current = setInterval(async () => {
        try {
          const res = await fetch(`/api/get-image?session=${sessionId}&doc=selfie`);
          const data = await res.json();
          if (data.image) {
            setCaptured(data.image);
            setSelfieData(data.image);
            cleanupWebRTC();
            if (fallbackPollingRef.current) clearInterval(fallbackPollingRef.current);
          }
        } catch {}
      }, 2000);
    }
    return () => {
      cleanupWebRTC();
      if (fallbackPollingRef.current) clearInterval(fallbackPollingRef.current);
    };
  }, [mode]);

  const startWebRTCReceiver = () => {
    // Desktop: wait for phone's offer, then create answer
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
    });
    pcRef.current = pc;

    pc.ontrack = (event) => {
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
        setPhoneConnected(true);
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        fetch("/api/signal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session: sessionId, type: "ice-desktop", data: event.candidate.toJSON() }),
        });
      }
    };

    // Poll for offer from phone
    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/signal?session=${sessionId}&type=offer`);
        const { data } = await res.json();
        if (data && pc.signalingState === "stable") {
          clearInterval(pollingRef.current!);
          await pc.setRemoteDescription(new RTCSessionDescription(data));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          await fetch("/api/signal", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ session: sessionId, type: "answer", data: answer }),
          });

          // Start polling for phone ICE candidates
          icePollingRef.current = setInterval(async () => {
            try {
              const iceRes = await fetch(`/api/signal?session=${sessionId}&type=ice-phone`);
              const iceData = await iceRes.json();
              if (iceData.data && Array.isArray(iceData.data)) {
                for (const candidate of iceData.data) {
                  try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch {}
                }
              }
            } catch {}
          }, 1000);
        }
      } catch {}
    }, 1500);
  };

  const cleanupWebRTC = () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    if (icePollingRef.current) clearInterval(icePollingRef.current);
    if (pcRef.current) { pcRef.current.close(); pcRef.current = null; }
    fetch(`/api/signal?session=${sessionId}`, { method: "DELETE" }).catch(() => {});
  };

  // Webcam mode
  const startWebcam = async () => {
    setMode("webcam");
    try {
      stopWebcam();
      let s: MediaStream;
      try {
        s = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "user" }, width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        });
      } catch {
        s = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }
      streamRef.current = s;
      await attachVideoStream(videoRef.current, s);
      setWebcamReady(true);
    } catch {
      setWebcamReady(false);
    }
  };

  const captureFromWebcam = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);
    const img = canvas.toDataURL("image/jpeg", 0.85);
    setCaptured(img);
    setSelfieData(img);
    stopWebcam();
  };

  const captureFromStream = () => {
    if (!remoteVideoRef.current) return;
    const video = remoteVideoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    const img = canvas.toDataURL("image/jpeg", 0.85);
    setCaptured(img);
    setSelfieData(img);
    cleanupWebRTC();
  };

  const retake = () => {
    setCaptured(null);
    setSelfieData(null);
    if (mode === "webcam") startWebcam();
    else { setMode("choose"); setPhoneConnected(false); }
  };

  return (
    <div className="glass rounded-2xl p-8">
      <h2 className="text-xl font-semibold mb-2">Take a Selfie</h2>
      <p className="text-muted text-sm mb-6">We need a clear photo of your face for KYC verification <span className="text-error">*</span></p>

      {selfieError && <motion.div className="bg-error/10 border border-error/30 rounded-xl p-3 text-error text-sm mb-4" initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}>{selfieError}</motion.div>}

      <div className="flex flex-col items-center gap-5">
        {captured ? (
          /* ─── Captured Preview ─── */
          <>
            <div className="w-56 h-56 rounded-full overflow-hidden border-4 border-success">
              <img src={captured} alt="Selfie" className="w-full h-full object-cover" />
            </div>
            <p className="text-success text-sm font-medium">Selfie captured!</p>
            <button onClick={retake} className="text-sm text-primary hover:underline">Retake Selfie</button>
          </>
        ) : mode === "choose" ? (
          /* ─── Choose Mode ─── */
          <>
            <div className="relative">
              <div className="w-56 h-56 rounded-full border-4 border-white/10 bg-cardbg flex items-center justify-center">
                <div className="text-center">
                  <div className="text-5xl mb-2 opacity-30">👤</div>
                  <p className="text-muted text-xs">Choose a method</p>
                </div>
              </div>
              <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-primary rounded-tl-full" />
              <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-primary rounded-tr-full" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-primary rounded-bl-full" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-primary rounded-br-full" />
            </div>
            <div className="flex gap-3">
              <button onClick={startWebcam} className="gradient-btn px-5 py-2.5 rounded-xl font-semibold text-white text-sm flex items-center gap-2">
                💻 Use Webcam
              </button>
              <button onClick={() => setMode("phone")} className="px-5 py-2.5 rounded-xl font-semibold border border-primary/40 text-white text-sm flex items-center gap-2 hover:bg-primary/10 transition">
                📱 Use Phone (Live)
              </button>
            </div>
          </>
        ) : mode === "webcam" ? (
          /* ─── Webcam Mode ─── */
          <>
            <div className="relative">
              <div className="w-56 h-56 rounded-full overflow-hidden border-4 border-primary">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
              </div>
              <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-ping" style={{ animationDuration: "2s" }} />
            </div>
            <div className="flex items-center gap-2 text-xs text-success"><div className="w-2 h-2 bg-success rounded-full animate-pulse" /> Camera active</div>
            <button onClick={captureFromWebcam} className="gradient-btn px-8 py-3 rounded-xl font-semibold text-white flex items-center gap-2">
              📷 Capture Selfie
            </button>
          </>
        ) : (
          /* ─── Phone WebRTC Mode ─── */
          <>
            <div className="relative">
              <div className={`w-56 h-56 rounded-full overflow-hidden border-4 ${phoneConnected ? "border-success" : "border-primary/40"} bg-cardbg flex items-center justify-center`}>
                {phoneConnected ? (
                  <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
                ) : (
                  <div className="text-center p-4">
                    {qrUrl && <img src={qrUrl} alt="QR" className="w-32 h-32 mx-auto" />}
                    <p className="text-[10px] text-muted mt-2">Scan with phone</p>
                  </div>
                )}
              </div>
              {!phoneConnected && <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-ping" style={{ animationDuration: "3s" }} />}
              {phoneConnected && <div className="absolute -top-1 -right-1 w-5 h-5 bg-success rounded-full border-2 border-darkbg flex items-center justify-center text-[8px]">✓</div>}
            </div>

            {phoneConnected ? (
              <>
                <div className="flex items-center gap-2 text-xs text-success"><div className="w-2 h-2 bg-success rounded-full animate-pulse" /> Live stream from phone</div>
                <button onClick={captureFromStream} className="gradient-btn px-8 py-3 rounded-xl font-semibold text-white flex items-center gap-2">
                  📷 Capture Selfie
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 text-xs text-muted"><div className="w-2 h-2 bg-primary rounded-full animate-pulse" /> Waiting for phone connection...</div>
                <p className="text-[11px] text-muted/60 text-center max-w-xs">Open the QR link on your phone (same WiFi network). Your phone&apos;s front camera will stream live here.</p>
                {mobileUrl && <p className="text-[10px] text-muted/40 text-center break-all max-w-xs">{mobileUrl}</p>}
                <button onClick={() => { cleanupWebRTC(); setMode("choose"); }} className="text-xs text-muted hover:text-white transition">Use webcam instead</button>
              </>
            )}
          </>
        )}
      </div>

      <div className="flex gap-4 mt-8">
        <button onClick={onBack} className="px-6 py-3 rounded-xl border border-white/10 text-muted hover:text-white transition">Back</button>
        <button onClick={onContinue} className="flex-1 gradient-btn py-3 rounded-xl font-semibold text-white">Continue</button>
      </div>
    </div>
  );
}

/* ═══════ Sub-components ═══════ */

function PinBoxes({ values, onChange, autoFocusFirst }: { values: string[]; onChange: (v: string[]) => void; autoFocusFirst?: boolean }) {
  const refs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];
  useEffect(() => { if (autoFocusFirst) refs[0].current?.focus(); }, []);
  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const arr = [...values]; arr[index] = value; onChange(arr);
    if (value && index < 3) refs[index + 1].current?.focus();
  };
  return (
    <div className="flex gap-4 justify-center">
      {values.map((v, i) => (
        <input key={i} ref={refs[i]} type="password" inputMode="numeric" maxLength={1} value={v}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => { if (e.key === "Backspace" && !values[i] && i > 0) refs[i - 1].current?.focus(); }}
          className={`w-16 h-16 text-center text-2xl font-bold bg-darkbg border-2 rounded-xl text-white focus:outline-none transition-all ${v ? "border-primary shadow-lg shadow-primary/20" : "border-white/10"} focus:border-primary`} />
      ))}
    </div>
  );
}

function DropZone({ label, fileName, onFile, required }: { label: string; fileName: string | null; onFile: (f: File) => void; required?: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  return (
    <div
      className={`relative border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
        fileName ? "border-success/40 bg-success/5" : dragging ? "border-primary bg-primary/5" : "border-white/10 hover:border-primary/40 hover:bg-primary/5"
      }`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files[0]) onFile(e.dataTransfer.files[0]); }}
    >
      <input ref={inputRef} type="file" accept="image/*,.pdf" onChange={(e) => { if (e.target.files?.[0]) onFile(e.target.files[0]); }} className="hidden" />
      {fileName ? (
        <div className="flex items-center justify-center gap-3">
          <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center text-success">✓</div>
          <div className="text-left"><p className="text-sm font-medium">{label}</p><p className="text-xs text-success truncate max-w-[200px]">{fileName}</p></div>
        </div>
      ) : (
        <><div className="text-3xl mb-2 text-muted/40">📄</div><p className="text-sm font-medium mb-1">{label} {required && <span className="text-error">*</span>}</p><p className="text-xs text-muted">Drag & drop or <span className="text-primary">browse</span></p></>
      )}
    </div>
  );
}

function SummaryRow({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-white/5">
      <span className="text-sm text-muted">{label}</span>
      <span className={`text-sm font-medium truncate max-w-[200px] flex items-center gap-1 ${ok !== undefined ? (ok ? "text-success" : "text-error") : ""}`}>
        {ok !== undefined && (ok ? "✅ " : "❌ ")}{value}
      </span>
    </div>
  );
}

function StepDone({ firstName, lastName, accountNo, upiId }: { firstName: string; lastName: string; accountNo: string; upiId: string }) {
  const router = useRouter();
  const [showConfetti, setShowConfetti] = useState(true);
  const confettiColors = ["#6C3CE1", "#00D4AA", "#FF4757", "#FFD700", "#FF69B4", "#00BFFF", "#FFA500", "#7B68EE"];
  useEffect(() => { const t = setTimeout(() => setShowConfetti(false), 5000); return () => clearTimeout(t); }, []);
  return (
    <div className="glass rounded-2xl p-8 text-center relative overflow-hidden">
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {Array.from({ length: 50 }).map((_, i) => {
            const size = 6 + Math.random() * 10; const isCircle = Math.random() > 0.5;
            return (<div key={i} className="absolute" style={{ left: `${Math.random() * 100}%`, top: `-${10 + Math.random() * 20}px`, width: `${size}px`, height: `${isCircle ? size : size * 0.6}px`, borderRadius: isCircle ? "50%" : "2px", backgroundColor: confettiColors[i % confettiColors.length], animation: `confetti-fall ${2.5 + Math.random() * 3}s linear ${Math.random() * 1.5}s forwards` }} />);
          })}
        </div>
      )}
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }}>
        <div className="text-7xl mb-4">🎉</div>
        <h2 className="text-3xl font-bold mb-2">You&apos;re all set!</h2>
        <p className="text-muted mb-8">Your NovaPay account is ready to use.</p>
      </motion.div>
      <motion.div className="glass rounded-xl p-6 max-w-sm mx-auto text-left" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <h3 className="text-sm text-muted mb-4 text-center font-medium">Account Summary</h3>
        <div className="space-y-4">
          <div className="flex justify-between"><span className="text-muted text-sm">Name</span><span className="font-medium">{firstName} {lastName}</span></div>
          <div className="h-px bg-white/5" />
          <div className="flex justify-between"><span className="text-muted text-sm">Account No</span><motion.span className="font-mono font-medium text-primary" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>{accountNo}</motion.span></div>
          <div className="h-px bg-white/5" />
          <div className="flex justify-between"><span className="text-muted text-sm">UPI ID</span><motion.span className="font-medium text-secondary" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.0 }}>{upiId}</motion.span></div>
          <div className="h-px bg-white/5" />
          <div className="flex justify-between"><span className="text-muted text-sm">KYC Status</span><motion.span className="text-success font-medium" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}>✅ Verified</motion.span></div>
        </div>
      </motion.div>
      <motion.button onClick={() => router.push("/dashboard")} className="gradient-btn px-10 py-3.5 rounded-xl font-semibold text-white text-lg mt-8"
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.0 }}>Open App</motion.button>
    </div>
  );
}
