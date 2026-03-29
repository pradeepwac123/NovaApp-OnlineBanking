"use client";

import { KycRequest } from "@/services/api/adminDashboard";

type KycVerificationPanelProps = {
  requests: KycRequest[];
  onApprove: (request: KycRequest) => void;
  onReject: (request: KycRequest) => void;
};

export function KycVerificationPanel({ requests, onApprove, onReject }: KycVerificationPanelProps) {
  const pending = requests.filter((entry) => entry.status === "Pending");

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-3xl font-bold text-slate-900">KYC Verification</h2>
        <p className="mt-1 text-sm text-slate-500">
          Review pending identity submissions with document previews and action rails.
        </p>
      </div>

      {pending.length === 0 && (
        <p className="rounded-[1.6rem] bg-white px-4 py-8 text-center text-sm text-slate-500 shadow-[0_20px_50px_rgba(18,38,63,0.05)]">
          No pending KYC submissions at this time.
        </p>
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        {pending.map((request) => (
          <article key={request.id} className="rounded-[1.8rem] bg-white p-5 shadow-[0_20px_50px_rgba(18,38,63,0.05)]">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-lg font-semibold text-slate-900">{request.userName}</p>
                <p className="mt-1 text-sm text-slate-500">
                  Submitted {new Date(request.submittedAt).toLocaleString("en-IN")}
                </p>
              </div>
              <span className="rounded-full bg-[#fff7e6] px-3 py-1 text-xs font-semibold text-[#b7791f]">
                Pending Review
              </span>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              {request.documents.map((document) => (
                <div key={document.label} className="rounded-[1.2rem] bg-[#f8fbff] p-4 ring-1 ring-[#e4eefc]">
                  <div
                    role="img"
                    aria-label={`${document.label} preview placeholder`}
                    className="flex h-24 items-center justify-center rounded-[1rem] border-2 border-dashed border-[#d9e6fb] bg-white text-xs text-slate-400"
                  >
                    Document Preview
                  </div>
                  <p className="mt-3 text-sm font-medium text-slate-900">{document.label}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 flex gap-3">
              <button
                onClick={() => onApprove(request)}
                className="rounded-[1rem] bg-[#2372ff] px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_32px_rgba(35,114,255,0.22)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2372ff]"
              >
                Approve
              </button>

              <button
                onClick={() => onReject(request)}
                className="rounded-[1rem] bg-[#fff1ef] px-4 py-2 text-sm font-semibold text-[#e36a5d] transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e36a5d]"
              >
                Reject
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
