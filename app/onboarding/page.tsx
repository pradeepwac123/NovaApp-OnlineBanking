"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dob: string;
  accountNo: string;
  upiId: string;
}

// ─── Shared input class ───────────────────────────────────────────────────────
// bg-surface-container-low at rest → bg-surface-container-lowest on focus.
// Ghost ring (ring-transparent) transitions to ring-primary on focus.
const INPUT_CLS =
  "w-full rounded-lg bg-surface-container-low px-4 py-3 text-sm text-on-surface " +
  "placeholder:text-on-surface-variant/50 outline-none ring-1 ring-transparent " +
  "transition focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest " +
  "disabled:bg-surface-container disabled:text-on-surface-variant disabled:cursor-not-allowed";

// ─── Page Component ───────────────────────────────────────────────────────────

/**
 * OnboardingPage — Multi-step account setup wizard.
 *
 * Design system notes:
 * - bg-surface (#f7f9fb) page canvas, bg-surface-container-lowest cards.
 * - Step indicator: primary blue (#0058bc) for active/complete, surface-
 *   container-high for future steps — no dark backgrounds.
 * - Progress bar: bg-surface-container-high track, gradient-btn fill.
 * - All .glass and bg-darkbg references removed; replaced with surface tokens.
 */
export default function OnboardingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [userData, setUserData] = useState<UserData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dob: "",
    accountNo: "",
    upiId: "",
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
      fetch("/api/auth/me")
        .then((r) => r.json())
        .then((data) => {
          if (data.user) {
            setUserData((prev) => ({
              ...prev,
              phone: data.user.phone || "",
              accountNo: data.user.accountNo || "",
              upiId: data.user.upiId || "",
            }));
          }
        })
        .catch(() => {});
    }
  }, [session, status, router]);

  const next = () => setStep((s) => Math.min(s + 1, 6));
  const back = () => setStep((s) => Math.max(s - 1, 1));

  // Loading state while session resolves
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  // ── Step label definitions ─────────────────────────────────────────────────
  const STEPS = ["Welcome", "Details", "MPIN", "Documents", "Selfie", "Done"];

  return (
    /*
     * bg-surface is the #f7f9fb light canvas for the entire onboarding flow.
     * All text defaults to text-on-surface (#191c1e).
     */
    <div className="min-h-screen bg-surface p-4 text-on-surface md:p-8">
      {/* ── Brand bar ─────────────────────────────────────────────────────── */}
      <div className="mb-8 text-center">
        <span className="font-display text-2xl font-bold gradient-text">
          NovaPay
        </span>
      </div>

      <div className="mx-auto max-w-2xl">

        {/* ── Progress section ──────────────────────────────────────────────
         *  Track: bg-surface-container-high — visible against the surface bg.
         *  Fill: gradient-btn primary-blue gradient.
         *  Step dots below: primary for active/done, surface-container-high
         *  for future steps — clear visual progression without dark colours.
         */}
        <div className="mb-8" aria-label={`Step ${step} of 6: ${STEPS[step - 1]}`}>
          {/* Step counter + percentage */}
          <div className="mb-2 flex justify-between text-xs font-medium text-on-surface-variant">
            <span>
              Step {step} of {STEPS.length}
            </span>
            <span>{Math.round((step / STEPS.length) * 100)}%</span>
          </div>

          {/* Progress bar track */}
          <div
            role="progressbar"
            aria-valuenow={step}
            aria-valuemin={1}
            aria-valuemax={STEPS.length}
            className="h-2 w-full overflow-hidden rounded-full bg-surface-container-high"
          >
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-primary to-[#1a73e8]"
              animate={{ width: `${(step / STEPS.length) * 100}%` }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            />
          </div>

          {/* Step indicator dots */}
          <div className="mt-3 flex justify-between" aria-hidden="true">
            {STEPS.map((label, i) => {
              const isComplete = i + 1 < step;
              const isActive = i + 1 === step;
              return (
                <div key={label} className="flex flex-col items-center">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
                      isComplete
                        ? // Completed step: solid primary fill, white checkmark
                          "bg-primary text-on-primary"
                        : isActive
                        ? // Active step: primary fill with ring halo
                          "bg-primary text-on-primary shadow-[0_0_0_3px_rgba(0,88,188,0.18)]"
                        : // Future step: light tonal fill, muted label
                          "bg-surface-container-high text-on-surface-variant"
                    }`}
                  >
                    {isComplete ? "✓" : i + 1}
                  </div>
                  <span
                    className={`mt-1 text-[10px] font-medium transition-colors ${
                      isActive
                        ? "text-primary"
                        : "text-on-surface-variant/50"
                    }`}
                  >
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Animated step content ─────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            {step === 1 && (
              <Step1Welcome firstName={userData.firstName} onNext={next} />
            )}
            {step === 2 && (
              <Step2Personal
                userData={userData}
                setUserData={setUserData}
                errors={errors}
                setErrors={setErrors}
                onNext={next}
                onBack={back}
              />
            )}
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

// ─── STEP 1: Welcome ──────────────────────────────────────────────────────────

function Step1Welcome({
  firstName,
  onNext,
}: {
  firstName: string;
  onNext: () => void;
}) {
  return (
    /*
     * bg-surface-container-lowest (white) card on bg-surface page.
     * No border — tonal layering provides the separation.
     */
    <div className="rounded-xl bg-surface-container-lowest p-8 text-center">
      {/* Brand greeting */}
      <h1 className="font-display text-3xl font-bold text-on-surface">
        Welcome, {firstName || "there"}!
      </h1>
      <p className="mt-3 text-sm text-on-surface-variant">
        Let&apos;s set up your digital bank account in just a few steps.
      </p>

      {/* Feature list — spacing-4 between items instead of dividers */}
      <ul
        className="mx-auto mt-8 max-w-sm space-y-4 text-left"
        aria-label="What you'll get"
      >
        {[
          "Instant UPI payments",
          "Zero-fee transfers",
          "Digital KYC verification",
          "Secure MPIN protection",
        ].map((benefit) => (
          <li key={benefit} className="flex items-center gap-3 text-sm text-on-surface">
            {/* Tick in a secondary-container pill */}
            <span
              aria-hidden="true"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary-container text-xs font-bold text-success"
            >
              ✓
            </span>
            {benefit}
          </li>
        ))}
      </ul>

      {/* CTA */}
      <button
        onClick={onNext}
        className="gradient-btn mt-8 w-full rounded-lg px-8 py-3.5 text-base font-semibold sm:w-auto"
      >
        Get Started
      </button>
    </div>
  );
}

// ─── STEP 2: Personal Details ─────────────────────────────────────────────────

function Step2Personal({
  userData,
  setUserData,
  errors,
  setErrors,
  onNext,
  onBack,
}: {
  userData: UserData;
  setUserData: React.Dispatch<React.SetStateAction<UserData>>;
  errors: Record<string, string>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onNext: () => void;
  onBack: () => void;
}) {
  const validate = () => {
    const e: Record<string, string> = {};
    if (!userData.firstName.trim()) e.firstName = "Required";
    if (!userData.lastName.trim()) e.lastName = "Required";
    if (!userData.dob) e.dob = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  return (
    <div className="rounded-xl bg-surface-container-lowest p-8">
      <h2 className="font-display text-2xl font-bold text-on-surface">
        Personal Details
      </h2>
      <p className="mt-1 text-sm text-on-surface-variant">
        Tell us a bit about yourself to verify your identity.
      </p>

      <div className="mt-6 space-y-4">
        {/* First / Last Name row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-on-surface-variant">
              First Name
            </label>
            <input
              value={userData.firstName}
              onChange={(e) =>
                setUserData({ ...userData, firstName: e.target.value })
              }
              aria-invalid={!!errors.firstName}
              aria-describedby={errors.firstName ? "err-first" : undefined}
              className={INPUT_CLS}
            />
            {errors.firstName && (
              <p id="err-first" role="alert" className="mt-1 text-xs text-error">
                {errors.firstName}
              </p>
            )}
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-on-surface-variant">
              Last Name
            </label>
            <input
              value={userData.lastName}
              onChange={(e) =>
                setUserData({ ...userData, lastName: e.target.value })
              }
              aria-invalid={!!errors.lastName}
              aria-describedby={errors.lastName ? "err-last" : undefined}
              className={INPUT_CLS}
            />
            {errors.lastName && (
              <p id="err-last" role="alert" className="mt-1 text-xs text-error">
                {errors.lastName}
              </p>
            )}
          </div>
        </div>

        {/* Date of Birth */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-on-surface-variant">
            Date of Birth
          </label>
          <input
            type="date"
            value={userData.dob}
            onChange={(e) =>
              setUserData({ ...userData, dob: e.target.value })
            }
            aria-invalid={!!errors.dob}
            aria-describedby={errors.dob ? "err-dob" : undefined}
            className={INPUT_CLS}
          />
          {errors.dob && (
            <p id="err-dob" role="alert" className="mt-1 text-xs text-error">
              {errors.dob}
            </p>
          )}
        </div>

        {/* Email — read-only, pre-filled from session */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-on-surface-variant">
            Email
            <span className="ml-1.5 text-on-surface-variant/60 font-normal">
              (from your account)
            </span>
          </label>
          <input
            value={userData.email}
            disabled
            aria-readonly="true"
            className={INPUT_CLS}
          />
        </div>

        {/* Phone — read-only */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-on-surface-variant">
            Phone
            <span className="ml-1.5 text-on-surface-variant/60 font-normal">
              (from your account)
            </span>
          </label>
          <input
            value={userData.phone}
            disabled
            aria-readonly="true"
            className={INPUT_CLS}
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="mt-8 flex gap-4">
        <button
          onClick={onBack}
          className="rounded-lg bg-surface-container-low px-6 py-3 text-sm font-medium text-on-surface-variant transition hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          Back
        </button>
        <button
          onClick={() => validate() && onNext()}
          className="gradient-btn flex-1 rounded-lg py-3 text-sm font-semibold"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

// ─── STEP 3: MPIN ─────────────────────────────────────────────────────────────

function Step3Mpin({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}) {
  const [pins, setPins] = useState(["", "", "", ""]);
  const [confirmPins, setConfirmPins] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const pinRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];
  const confirmRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const handlePin = (
    index: number,
    value: string,
    isConfirm: boolean
  ) => {
    if (!/^\d?$/.test(value)) return;
    const arr = isConfirm ? [...confirmPins] : [...pins];
    arr[index] = value;
    isConfirm ? setConfirmPins(arr) : setPins(arr);
    // Auto-advance to next box
    if (value && index < 3) {
      (isConfirm ? confirmRefs : pinRefs)[index + 1].current?.focus();
    }
    // Auto-jump from last MPIN box to first confirm box
    if (!isConfirm && value && index === 3) {
      confirmRefs[0].current?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent,
    isConfirm: boolean
  ) => {
    const refs = isConfirm ? confirmRefs : pinRefs;
    const vals = isConfirm ? confirmPins : pins;
    if (e.key === "Backspace" && !vals[index] && index > 0) {
      refs[index - 1].current?.focus();
    }
  };

  const handleSubmit = async () => {
    const pin = pins.join("");
    const confirm = confirmPins.join("");
    if (pin.length !== 4) {
      setError("Enter all 4 digits");
      return;
    }
    if (confirm.length !== 4) {
      setError("Confirm your MPIN");
      return;
    }
    if (pin !== confirm) {
      setError("MPINs don't match");
      return;
    }
    try {
      await fetch("/api/auth/set-mpin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mpin: pin }),
      });
      onNext();
    } catch {
      setError("Failed to set MPIN — please try again");
    }
  };

  /**
   * Renders four PIN digit boxes.
   * Active box (has a digit): primary border + shadow halo.
   * Empty box: surface-container ring, transitions to primary on focus.
   */
  const renderBoxes = (
    values: string[],
    refs: React.RefObject<HTMLInputElement>[],
    isConfirm: boolean,
    groupLabel: string
  ) => (
    <fieldset>
      <legend className="mb-4 block w-full text-center text-sm font-medium text-on-surface-variant">
        {groupLabel}
      </legend>
      <div className="flex justify-center gap-4">
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
            aria-label={`${isConfirm ? "Confirm " : ""}MPIN digit ${i + 1}`}
            className={`h-16 w-16 rounded-xl bg-surface-container-low text-center font-display text-2xl font-bold text-on-surface outline-none ring-2 transition-all ${
              v
                ? // Filled: primary ring + subtle shadow
                  "ring-primary shadow-[0_0_0_4px_rgba(0,88,188,0.12)]"
                : // Empty: ghost ring, transitions to primary on focus
                  "ring-surface-container-high focus:ring-primary focus:shadow-[0_0_0_4px_rgba(0,88,188,0.12)]"
            }`}
          />
        ))}
      </div>
    </fieldset>
  );

  return (
    <div className="rounded-xl bg-surface-container-lowest p-8">
      <h2 className="font-display text-2xl font-bold text-on-surface">
        Set Your MPIN
      </h2>
      <p className="mt-1 text-sm text-on-surface-variant">
        Create a 4-digit MPIN to protect your transactions.
      </p>

      <div className="mt-8 space-y-8">
        {renderBoxes(pins, pinRefs, false, "Enter 4-digit MPIN")}
        {renderBoxes(confirmPins, confirmRefs, true, "Confirm MPIN")}

        {error && (
          <motion.p
            role="alert"
            className="text-center text-sm text-error"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {error}
          </motion.p>
        )}
      </div>

      <div className="mt-8 flex gap-4">
        <button
          onClick={onBack}
          className="rounded-lg bg-surface-container-low px-6 py-3 text-sm font-medium text-on-surface-variant transition hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          Back
        </button>
        <button
          onClick={handleSubmit}
          className="gradient-btn flex-1 rounded-lg py-3 text-sm font-semibold"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

// ─── STEP 4: Document Upload ───────────────────────────────────────────────────

function Step4Documents({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}) {
  const [docs, setDocs] = useState<{
    aadhaarFront: string | null;
    aadhaarBack: string | null;
    pan: string | null;
  }>({ aadhaarFront: null, aadhaarBack: null, pan: null });

  const handleDoc = (field: keyof typeof docs, file: File) => {
    setDocs((prev) => ({ ...prev, [field]: file.name }));
  };

  return (
    <div className="rounded-xl bg-surface-container-lowest p-8">
      <h2 className="font-display text-2xl font-bold text-on-surface">
        Document Upload
      </h2>
      <p className="mt-1 text-sm text-on-surface-variant">
        Upload your KYC documents to verify your identity.
      </p>

      {/* gap-4 between drop zones — no divider lines */}
      <div className="mt-6 flex flex-col gap-4">
        <DropZone
          label="Aadhaar Card — Front"
          fileName={docs.aadhaarFront}
          onFile={(f) => handleDoc("aadhaarFront", f)}
        />
        <DropZone
          label="Aadhaar Card — Back"
          fileName={docs.aadhaarBack}
          onFile={(f) => handleDoc("aadhaarBack", f)}
        />
        <DropZone
          label="PAN Card"
          fileName={docs.pan}
          onFile={(f) => handleDoc("pan", f)}
        />
      </div>

      <div className="mt-8 flex gap-4">
        <button
          onClick={onBack}
          className="rounded-lg bg-surface-container-low px-6 py-3 text-sm font-medium text-on-surface-variant transition hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          Back
        </button>
        <button
          onClick={onNext}
          className="gradient-btn flex-1 rounded-lg py-3 text-sm font-semibold"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

/**
 * DropZone — Drag-and-drop or click-to-upload file input.
 *
 * States:
 * - Idle: bg-surface-container-low dashed area, text-on-surface-variant.
 * - Dragging: bg-secondary-container tonal fill, primary dashed outline.
 * - Uploaded: bg-green-50 tonal fill, success text.
 *
 * No 1px solid border in any state — uses tonal fills for visual changes.
 */
function DropZone({
  label,
  fileName,
  onFile,
}: {
  label: string;
  fileName: string | null;
  onFile: (f: File) => void;
}) {
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
      role="button"
      tabIndex={0}
      aria-label={`Upload ${label}`}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`relative cursor-pointer rounded-xl p-5 text-center outline-none transition-all focus-visible:ring-2 focus-visible:ring-primary/40 ${
        fileName
          ? // Uploaded: green tonal
            "bg-green-50 outline-2 outline-dashed outline-green-200"
          : dragging
          ? // Dragging: secondary-container tonal
            "bg-secondary-container outline-2 outline-dashed outline-primary/40"
          : // Idle: surface-container-low tonal
            "bg-surface-container-low outline-2 outline-dashed outline-surface-container-high hover:bg-secondary-container/40"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.pdf"
        onChange={handleChange}
        className="hidden"
        aria-hidden="true"
      />

      {fileName ? (
        /* Uploaded state */
        <div className="flex items-center justify-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-success">
            ✓
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-on-surface">{label}</p>
            <p className="mt-0.5 text-xs text-success">{fileName}</p>
          </div>
        </div>
      ) : (
        /* Idle / drag state */
        <>
          <div className="mb-2 text-2xl text-on-surface-variant/30" aria-hidden="true">
            📄
          </div>
          <p className="text-sm font-medium text-on-surface">{label}</p>
          <p className="mt-1 text-xs text-on-surface-variant">
            Drag & drop or{" "}
            <span className="font-medium text-primary">browse</span>
          </p>
        </>
      )}
    </div>
  );
}

// ─── STEP 5: Selfie ───────────────────────────────────────────────────────────

function Step5Selfie({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}) {
  const [cameraAllowed, setCameraAllowed] = useState(false);
  const [selfieTaken, setSelfieTaken] = useState(false);

  return (
    <div className="rounded-xl bg-surface-container-lowest p-8">
      <h2 className="font-display text-2xl font-bold text-on-surface">
        Take a Selfie
      </h2>
      <p className="mt-1 text-sm text-on-surface-variant">
        We need a clear photo of your face for KYC verification.
      </p>

      <div className="mt-8 flex flex-col items-center gap-6">
        {/* Circular viewfinder
         * State-driven fills:
         * - Default: bg-surface-container-low ring
         * - Camera active: primary ring
         * - Selfie taken: success green ring
         */}
        <div className="relative">
          <div
            aria-live="polite"
            aria-label={
              selfieTaken
                ? "Selfie captured"
                : cameraAllowed
                ? "Camera active"
                : "Camera inactive"
            }
            className={`flex h-56 w-56 items-center justify-center rounded-full transition-all duration-300 ${
              selfieTaken
                ? "bg-green-50 ring-4 ring-success/60"
                : cameraAllowed
                ? "bg-secondary-container ring-4 ring-primary"
                : "bg-surface-container-low ring-4 ring-surface-container-high"
            }`}
          >
            {selfieTaken ? (
              <div className="text-center">
                <div className="text-5xl" aria-hidden="true">😊</div>
                <p className="mt-2 text-sm font-medium text-success">
                  Selfie captured!
                </p>
              </div>
            ) : cameraAllowed ? (
              <div className="text-center">
                <div
                  className="animate-pulse text-5xl"
                  aria-hidden="true"
                >
                  📷
                </div>
                <p className="mt-2 text-xs font-medium text-primary">
                  Camera active
                </p>
              </div>
            ) : (
              <div className="text-center">
                <div
                  className="text-5xl opacity-30"
                  aria-hidden="true"
                >
                  👤
                </div>
                <p className="mt-2 text-xs text-on-surface-variant">
                  Camera off
                </p>
              </div>
            )}
          </div>

          {/* Scanning pulse ring — visible only when camera is active */}
          {cameraAllowed && !selfieTaken && (
            <div
              aria-hidden="true"
              className="absolute inset-0 animate-ping rounded-full ring-4 ring-primary/20"
            />
          )}

          {/* Corner framing markers — primary blue */}
          {!selfieTaken && (
            <>
              <div
                aria-hidden="true"
                className="absolute left-0 top-0 h-6 w-6 rounded-tl-full border-l-2 border-t-2 border-primary"
              />
              <div
                aria-hidden="true"
                className="absolute right-0 top-0 h-6 w-6 rounded-tr-full border-r-2 border-t-2 border-primary"
              />
              <div
                aria-hidden="true"
                className="absolute bottom-0 left-0 h-6 w-6 rounded-bl-full border-b-2 border-l-2 border-primary"
              />
              <div
                aria-hidden="true"
                className="absolute bottom-0 right-0 h-6 w-6 rounded-br-full border-b-2 border-r-2 border-primary"
              />
            </>
          )}
        </div>

        {/* Action buttons */}
        {!cameraAllowed ? (
          <button
            onClick={() => setCameraAllowed(true)}
            className="gradient-btn flex items-center gap-2 rounded-lg px-8 py-3 text-sm font-semibold"
          >
            <span aria-hidden="true">📸</span> Allow Camera
          </button>
        ) : !selfieTaken ? (
          <button
            onClick={() => setSelfieTaken(true)}
            className="gradient-btn flex items-center gap-2 rounded-lg px-8 py-3 text-sm font-semibold"
          >
            <span aria-hidden="true">📷</span> Take Selfie
          </button>
        ) : (
          <button
            onClick={() => {
              setSelfieTaken(false);
              setCameraAllowed(true);
            }}
            className="text-sm font-medium text-primary underline underline-offset-2 hover:opacity-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 rounded"
          >
            Retake Selfie
          </button>
        )}
      </div>

      <div className="mt-8 flex gap-4">
        <button
          onClick={onBack}
          className="rounded-lg bg-surface-container-low px-6 py-3 text-sm font-medium text-on-surface-variant transition hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          Back
        </button>
        <button
          onClick={onNext}
          className="gradient-btn flex-1 rounded-lg py-3 text-sm font-semibold"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

// ─── STEP 6: Done ─────────────────────────────────────────────────────────────

function Step6Done({ userData }: { userData: UserData }) {
  const router = useRouter();
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    fetch("/api/auth/complete-kyc", { method: "POST" }).catch(() => {});
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  // Confetti uses on-brand colours plus celebratory accents
  const confettiColors = [
    "#0058bc", "#1a73e8", "#d8e2ff", "#006d3b",
    "#ffd700", "#ff6b6b", "#a78bfa", "#34d399",
  ];

  return (
    <div className="relative overflow-hidden rounded-xl bg-surface-container-lowest p-8 text-center">
      {/* CSS confetti — fixed overlay, pointer-events-none so it doesn't block */}
      {showConfetti && (
        <div
          className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
          aria-hidden="true"
        >
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
                  backgroundColor:
                    confettiColors[i % confettiColors.length],
                  animation: `confetti-fall ${2.5 + Math.random() * 3}s linear ${Math.random() * 1.5}s forwards`,
                  transform: `rotate(${Math.random() * 360}deg)`,
                }}
              />
            );
          })}
        </div>
      )}

      {/* Success icon + headline */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", delay: 0.2 }}
      >
        <div
          className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-secondary-container text-4xl"
          aria-hidden="true"
        >
          🎉
        </div>
        <h2 className="mt-5 font-display text-3xl font-bold text-on-surface">
          You&apos;re all set!
        </h2>
        <p className="mt-2 text-sm text-on-surface-variant">
          Your NovaPay account is ready to use.
        </p>
      </motion.div>

      {/* Account summary card
       * bg-surface-container-low sits one tonal step above the white panel.
       * Items separated by spacing (py-3 + flex column gap) — NO divider lines.
       */}
      <motion.div
        className="mx-auto mt-8 max-w-sm rounded-xl bg-surface-container-low p-5 text-left"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        aria-label="Account summary"
      >
        <p className="mb-4 text-center text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
          Account Summary
        </p>

        {/* Each row separated by padding — no <hr> or divider elements */}
        <div className="flex flex-col gap-3">
          <SummaryRow label="Name" value={`${userData.firstName} ${userData.lastName}`} />
          <SummaryRow
            label="Account No"
            value={userData.accountNo}
            valueClass="font-mono font-semibold text-primary"
            animDelay={0.8}
          />
          <SummaryRow
            label="UPI ID"
            value={userData.upiId}
            valueClass="font-medium text-primary"
            animDelay={1.0}
          />
          <SummaryRow
            label="KYC Status"
            value="Verified"
            valueClass="font-semibold text-success"
            animDelay={1.2}
          />
        </div>
      </motion.div>

      {/* CTA */}
      <motion.button
        onClick={() => router.push("/dashboard")}
        className="gradient-btn mt-8 w-full rounded-lg px-10 py-3.5 text-base font-semibold sm:w-auto sm:px-16"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
      >
        Open App
      </motion.button>
    </div>
  );
}

/** SummaryRow — used in the Step 6 account summary card. */
function SummaryRow({
  label,
  value,
  valueClass = "font-medium text-on-surface",
  animDelay = 0,
}: {
  label: string;
  value: string;
  valueClass?: string;
  animDelay?: number;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-on-surface-variant">{label}</span>
      <motion.span
        className={`text-sm ${valueClass}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: animDelay }}
      >
        {value}
      </motion.span>
    </div>
  );
}
