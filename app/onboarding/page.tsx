"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface UserData {
  firstName: string; lastName: string; email: string; phone: string;
  dob: string; accountNo: string; upiId: string;
}

export default function OnboardingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [userData, setUserData] = useState<UserData>({
    firstName: "", lastName: "", email: "", phone: "",
    dob: "", accountNo: "", upiId: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (session?.user) {
      const name = session.user.name?.split(" ") || ["", ""];
      setUserData((prev) => ({
        ...prev,
        firstName: (session.user as any).firstName || name[0],
        lastName: name.slice(1).join(" "),
        email: session.user?.email || "",
      }));
      fetch("/api/auth/me").then(r => r.json()).then(data => {
        if (data.user) {
          setUserData(prev => ({
            ...prev,
            phone: data.user.phone || "",
            accountNo: data.user.accountNo || "",
            upiId: data.user.upiId || "",
          }));
        }
      }).catch(() => {});
    }
  }, [session, status, router]);

  const next = () => setStep((s) => Math.min(s + 1, 6));
  const back = () => setStep((s) => Math.max(s - 1, 1));

  if (status === "loading") return <div className="min-h-screen bg-darkbg flex items-center justify-center"><div className="text-muted">Loading...</div></div>;

  return (
    <div className="min-h-screen bg-darkbg p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-muted mb-2">
            <span>Step {step} of 6</span>
            <span>{Math.round((step / 6) * 100)}%</span>
          </div>
          <div className="h-2 bg-cardbg rounded-full overflow-hidden">
            <motion.div className="h-full bg-gradient-to-r from-primary to-secondary rounded-full" animate={{ width: `${(step / 6) * 100}%` }} transition={{ duration: 0.4 }} />
          </div>
          {/* Step indicators */}
          <div className="flex justify-between mt-3">
            {["Welcome", "Details", "MPIN", "Documents", "Selfie", "Done"].map((label, i) => (
              <div key={label} className="flex flex-col items-center">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                  i + 1 < step ? "bg-success border-success text-white" :
                  i + 1 === step ? "bg-primary border-primary text-white" :
                  "border-white/10 text-muted"
                }`}>
                  {i + 1 < step ? "✓" : i + 1}
                </div>
                <span className={`text-[10px] mt-1 ${i + 1 === step ? "text-primary" : "text-muted/50"}`}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
            {step === 1 && <Step1Welcome firstName={userData.firstName} onNext={next} />}
            {step === 2 && <Step2Personal userData={userData} setUserData={setUserData} errors={errors} setErrors={setErrors} onNext={next} onBack={back} />}
            {step === 3 && <Step3Mpin onNext={next} onBack={back} />}
            {step === 4 && <Step4Documents onNext={next} onBack={back} />}
            {step === 5 && <Step5Selfie onNext={next} onBack={back} />}
            {step === 6 && <Step6Done userData={userData} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ─── STEP 1: Welcome ─── */
function Step1Welcome({ firstName, onNext }: { firstName: string; onNext: () => void }) {
  return (
    <div className="glass rounded-2xl p-8 text-center">
      <div className="text-4xl font-bold gradient-text mb-2">NovaPay</div>
      <h1 className="text-3xl font-bold mt-6 mb-4">Welcome, {firstName || "there"}!</h1>
      <p className="text-muted mb-8">Let&apos;s set up your digital bank account in just a few steps.</p>
      <div className="space-y-3 text-left max-w-sm mx-auto mb-8">
        {["Instant UPI payments", "Zero-fee transfers", "Digital KYC verification", "Secure MPIN protection"].map((b) => (
          <div key={b} className="flex items-center gap-3 text-sm"><span className="text-success text-lg">✓</span> {b}</div>
        ))}
      </div>
      <button onClick={onNext} className="gradient-btn px-8 py-3 rounded-xl font-semibold text-white text-lg">Get Started</button>
    </div>
  );
}

/* ─── STEP 2: Personal Details ─── */
function Step2Personal({ userData, setUserData, errors, setErrors, onNext, onBack }: any) {
  const validate = () => {
    const e: Record<string, string> = {};
    if (!userData.firstName.trim()) e.firstName = "Required";
    if (!userData.lastName.trim()) e.lastName = "Required";
    if (!userData.dob) e.dob = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  return (
    <div className="glass rounded-2xl p-8">
      <h2 className="text-2xl font-bold mb-6">Personal Details</h2>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-muted mb-1">First Name</label>
            <input value={userData.firstName} onChange={(e) => setUserData({ ...userData, firstName: e.target.value })}
              className="w-full bg-darkbg border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:outline-none" />
            {errors.firstName && <p className="text-error text-xs mt-1">{errors.firstName}</p>}
          </div>
          <div>
            <label className="block text-sm text-muted mb-1">Last Name</label>
            <input value={userData.lastName} onChange={(e) => setUserData({ ...userData, lastName: e.target.value })}
              className="w-full bg-darkbg border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:outline-none" />
            {errors.lastName && <p className="text-error text-xs mt-1">{errors.lastName}</p>}
          </div>
        </div>
        <div>
          <label className="block text-sm text-muted mb-1">Date of Birth</label>
          <input type="date" value={userData.dob} onChange={(e) => setUserData({ ...userData, dob: e.target.value })}
            className="w-full bg-darkbg border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:outline-none" />
          {errors.dob && <p className="text-error text-xs mt-1">{errors.dob}</p>}
        </div>
        <div>
          <label className="block text-sm text-muted mb-1">Email</label>
          <input value={userData.email} disabled className="w-full bg-darkbg/50 border border-white/5 rounded-xl px-4 py-3 text-muted" />
        </div>
        <div>
          <label className="block text-sm text-muted mb-1">Phone</label>
          <input value={userData.phone} disabled className="w-full bg-darkbg/50 border border-white/5 rounded-xl px-4 py-3 text-muted" />
        </div>
      </div>
      <div className="flex gap-4 mt-8">
        <button onClick={onBack} className="px-6 py-3 rounded-xl border border-white/10 text-muted hover:text-white transition">Back</button>
        <button onClick={() => validate() && onNext()} className="flex-1 gradient-btn py-3 rounded-xl font-semibold text-white">Continue</button>
      </div>
    </div>
  );
}

/* ──�� STEP 3: MPIN ─── */
function Step3Mpin({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [pins, setPins] = useState(["", "", "", ""]);
  const [confirmPins, setConfirmPins] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const pinRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];
  const confirmRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  const handlePin = (index: number, value: string, isConfirm: boolean) => {
    if (!/^\d?$/.test(value)) return;
    const arr = isConfirm ? [...confirmPins] : [...pins];
    arr[index] = value;
    isConfirm ? setConfirmPins(arr) : setPins(arr);

    // Auto-advance to next box
    if (value && index < 3) {
      const refs = isConfirm ? confirmRefs : pinRefs;
      refs[index + 1].current?.focus();
    }
    // Auto-jump from last pin box to first confirm box
    if (!isConfirm && value && index === 3) {
      confirmRefs[0].current?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent, isConfirm: boolean) => {
    const refs = isConfirm ? confirmRefs : pinRefs;
    const vals = isConfirm ? confirmPins : pins;
    if (e.key === "Backspace" && !vals[index] && index > 0) {
      refs[index - 1].current?.focus();
    }
  };

  const handleSubmit = async () => {
    const pin = pins.join("");
    const confirm = confirmPins.join("");
    if (pin.length !== 4) { setError("Enter all 4 digits"); return; }
    if (confirm.length !== 4) { setError("Confirm your MPIN"); return; }
    if (pin !== confirm) { setError("MPINs don't match"); return; }

    try {
      await fetch("/api/auth/set-mpin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mpin: pin }),
      });
      onNext();
    } catch {
      setError("Failed to set MPIN");
    }
  };

  const renderBoxes = (values: string[], refs: React.RefObject<HTMLInputElement>[], isConfirm: boolean) => (
    <div className="flex gap-4 justify-center">
      {values.map((v, i) => (
        <input
          key={i}
          ref={refs[i]}
          type="password"
          inputMode="numeric"
          maxLength={1}
          value={v}
          onChange={(e) => handlePin(i, e.target.value, isConfirm)}
          onKeyDown={(e) => handleKeyDown(i, e, isConfirm)}
          className={`w-16 h-16 text-center text-2xl font-bold bg-darkbg border-2 rounded-xl text-white focus:outline-none transition-all ${
            v ? "border-primary shadow-lg shadow-primary/20" : "border-white/10"
          } focus:border-primary`}
        />
      ))}
    </div>
  );

  return (
    <div className="glass rounded-2xl p-8">
      <h2 className="text-2xl font-bold mb-2">Set Your MPIN</h2>
      <p className="text-muted mb-8">Create a 4-digit MPIN to secure your transactions</p>

      <div className="space-y-8">
        <div>
          <label className="block text-sm text-muted mb-4 text-center font-medium">Enter 4-digit MPIN</label>
          {renderBoxes(pins, pinRefs, false)}
        </div>
        <div>
          <label className="block text-sm text-muted mb-4 text-center font-medium">Confirm MPIN</label>
          {renderBoxes(confirmPins, confirmRefs, true)}
        </div>
        {error && (
          <motion.p className="text-error text-sm text-center" initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}>
            {error}
          </motion.p>
        )}
      </div>

      <div className="flex gap-4 mt-8">
        <button onClick={onBack} className="px-6 py-3 rounded-xl border border-white/10 text-muted hover:text-white transition">Back</button>
        <button onClick={handleSubmit} className="flex-1 gradient-btn py-3 rounded-xl font-semibold text-white">Continue</button>
      </div>
    </div>
  );
}

/* ─── STEP 4: Document Upload (Drag & Drop, simulated) ─── */
function Step4Documents({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [docs, setDocs] = useState<{ aadhaarFront: string | null; aadhaarBack: string | null; pan: string | null }>({
    aadhaarFront: null, aadhaarBack: null, pan: null,
  });

  const handleDoc = (field: keyof typeof docs, file: File) => {
    setDocs((prev) => ({ ...prev, [field]: file.name }));
  };

  return (
    <div className="glass rounded-2xl p-8">
      <h2 className="text-2xl font-bold mb-2">Document Upload</h2>
      <p className="text-muted mb-6">Upload your KYC documents to verify your identity</p>

      <div className="space-y-4">
        <DropZone label="Aadhaar Card — Front" fileName={docs.aadhaarFront} onFile={(f) => handleDoc("aadhaarFront", f)} />
        <DropZone label="Aadhaar Card — Back" fileName={docs.aadhaarBack} onFile={(f) => handleDoc("aadhaarBack", f)} />
        <DropZone label="PAN Card" fileName={docs.pan} onFile={(f) => handleDoc("pan", f)} />
      </div>

      <div className="flex gap-4 mt-8">
        <button onClick={onBack} className="px-6 py-3 rounded-xl border border-white/10 text-muted hover:text-white transition">Back</button>
        <button onClick={onNext} className="flex-1 gradient-btn py-3 rounded-xl font-semibold text-white">Continue</button>
      </div>
    </div>
  );
}

function DropZone({ label, fileName, onFile }: { label: string; fileName: string | null; onFile: (f: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onFile(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFile(file);
  };

  return (
    <div
      className={`relative border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
        fileName ? "border-success/40 bg-success/5" :
        dragging ? "border-primary bg-primary/5" :
        "border-white/10 hover:border-primary/40 hover:bg-primary/5"
      }`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <input ref={inputRef} type="file" accept="image/*,.pdf" onChange={handleChange} className="hidden" />

      {fileName ? (
        <div className="flex items-center justify-center gap-3">
          <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center text-success">✓</div>
          <div className="text-left">
            <p className="text-sm font-medium">{label}</p>
            <p className="text-xs text-success">{fileName}</p>
          </div>
        </div>
      ) : (
        <>
          <div className="text-3xl mb-2 text-muted/40">📄</div>
          <p className="text-sm font-medium mb-1">{label}</p>
          <p className="text-xs text-muted">Drag & drop or <span className="text-primary">browse</span></p>
        </>
      )}
    </div>
  );
}

/* ─── STEP 5: Selfie (UI only, no real camera) ─── */
function Step5Selfie({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [cameraAllowed, setCameraAllowed] = useState(false);
  const [selfieTaken, setSelfieTaken] = useState(false);

  return (
    <div className="glass rounded-2xl p-8">
      <h2 className="text-2xl font-bold mb-2">Take a Selfie</h2>
      <p className="text-muted mb-6">We need a clear photo of your face for KYC verification</p>

      <div className="flex flex-col items-center gap-6">
        {/* Circular camera viewfinder */}
        <div className="relative">
          <div className={`w-56 h-56 rounded-full border-4 flex items-center justify-center transition-all ${
            selfieTaken ? "border-success bg-success/10" :
            cameraAllowed ? "border-primary bg-cardbg" :
            "border-white/10 bg-cardbg"
          }`}>
            {selfieTaken ? (
              <div className="text-center">
                <div className="text-5xl mb-2">😊</div>
                <p className="text-success text-sm font-medium">Selfie captured!</p>
              </div>
            ) : cameraAllowed ? (
              <div className="text-center">
                <div className="text-5xl mb-2 animate-pulse">📷</div>
                <p className="text-primary text-xs">Camera active</p>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-5xl mb-2 opacity-30">👤</div>
                <p className="text-muted text-xs">Camera off</p>
              </div>
            )}
          </div>

          {/* Scanning ring animation when camera is active */}
          {cameraAllowed && !selfieTaken && (
            <div className="absolute inset-0 rounded-full border-4 border-primary/30 animate-ping" />
          )}

          {/* Corner markers */}
          {!selfieTaken && (
            <>
              <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-primary rounded-tl-full" />
              <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-primary rounded-tr-full" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-primary rounded-bl-full" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-primary rounded-br-full" />
            </>
          )}
        </div>

        {/* Action buttons */}
        {!cameraAllowed ? (
          <button onClick={() => setCameraAllowed(true)}
            className="gradient-btn px-8 py-3 rounded-xl font-semibold text-white flex items-center gap-2">
            <span>📸</span> Allow Camera
          </button>
        ) : !selfieTaken ? (
          <button onClick={() => setSelfieTaken(true)}
            className="gradient-btn px-8 py-3 rounded-xl font-semibold text-white flex items-center gap-2">
            <span>📷</span> Take Selfie
          </button>
        ) : (
          <button onClick={() => { setSelfieTaken(false); setCameraAllowed(true); }}
            className="text-sm text-primary hover:underline">Retake Selfie</button>
        )}
      </div>

      <div className="flex gap-4 mt-8">
        <button onClick={onBack} className="px-6 py-3 rounded-xl border border-white/10 text-muted hover:text-white transition">Back</button>
        <button onClick={onNext} className="flex-1 gradient-btn py-3 rounded-xl font-semibold text-white">Continue</button>
      </div>
    </div>
  );
}

/* ��── STEP 6: Done with Confetti ─── */
function Step6Done({ userData }: { userData: UserData }) {
  const router = useRouter();
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    fetch("/api/auth/complete-kyc", { method: "POST" }).catch(() => {});
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  const confettiColors = ["#6C3CE1", "#00D4AA", "#FF4757", "#FFD700", "#FF69B4", "#00BFFF", "#FFA500", "#7B68EE"];

  return (
    <div className="glass rounded-2xl p-8 text-center relative overflow-hidden">
      {/* CSS Confetti */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {Array.from({ length: 50 }).map((_, i) => {
            const size = 6 + Math.random() * 10;
            const isCircle = Math.random() > 0.5;
            return (
              <div
                key={i}
                className="absolute"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `-${10 + Math.random() * 20}px`,
                  width: `${size}px`,
                  height: `${isCircle ? size : size * 0.6}px`,
                  borderRadius: isCircle ? "50%" : "2px",
                  backgroundColor: confettiColors[i % confettiColors.length],
                  animation: `confetti-fall ${2.5 + Math.random() * 3}s linear ${Math.random() * 1.5}s forwards`,
                  transform: `rotate(${Math.random() * 360}deg)`,
                }}
              />
            );
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
          <div className="flex justify-between items-center">
            <span className="text-muted text-sm">Name</span>
            <span className="font-medium">{userData.firstName} {userData.lastName}</span>
          </div>
          <div className="h-px bg-white/5" />
          <div className="flex justify-between items-center">
            <span className="text-muted text-sm">Account No</span>
            <motion.span className="font-mono font-medium text-primary" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
              {userData.accountNo}
            </motion.span>
          </div>
          <div className="h-px bg-white/5" />
          <div className="flex justify-between items-center">
            <span className="text-muted text-sm">UPI ID</span>
            <motion.span className="font-medium text-secondary" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.0 }}>
              {userData.upiId}
            </motion.span>
          </div>
          <div className="h-px bg-white/5" />
          <div className="flex justify-between items-center">
            <span className="text-muted text-sm">KYC Status</span>
            <motion.span className="text-success font-medium flex items-center gap-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}>
              ✅ Verified
            </motion.span>
          </div>
        </div>
      </motion.div>

      <motion.button
        onClick={() => router.push("/dashboard")}
        className="gradient-btn px-10 py-3.5 rounded-xl font-semibold text-white text-lg mt-8"
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.0 }}
      >
        Open App
      </motion.button>
    </div>
  );
}
