"use client";

import { KycRequest } from "@/services/api/adminDashboard";

type KycVerificationPanelProps = {
  requests: KycRequest[];
  onApprove: (request: KycRequest) => void;
  onReject: (request: KycRequest) => void;
};

export function KycVerificationPanel({ requests, onApprove, onReject }: KycVerificationPanelProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold text-white">KYC Verification</h2>
        <p className="mt-1 text-sm text-[#8b8ba7]">Review pending identity submissions with document previews and action rails.</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {requests.filter((entry) => entry.status === "Pending").map((request) => (
          <div key={request.id} className="rounded-3xl border border-white/6 bg-[#11111d] p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-lg font-semibold text-white">{request.userName}</p>
                <p className="mt-1 text-sm text-[#8b8ba7]">Submitted {new Date(request.submittedAt).toLocaleString("en-IN")}</p>
              </div>
              <span className="rounded-full border border-[#f5b942]/20 bg-[#f5b942]/10 px-3 py-1 text-xs text-[#ffd88d]">
                Pending Review
              </span>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              {request.documents.map((document) => (
                <div key={document.label} className="rounded-2xl border border-white/6 bg-[#0f0f1a] p-4">
                  <div className="flex h-24 items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] text-xs text-[#777798]">
                    Document Preview
                  </div>
                  <p className="mt-3 text-sm text-white">{document.label}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 flex gap-3">
              <button onClick={() => onApprove(request)} className="rounded-xl bg-gradient-to-r from-[#6C3CE1] to-[#00D4AA] px-4 py-2 text-sm font-medium text-white">
                Approve
              </button>
              <button onClick={() => onReject(request)} className="rounded-xl border border-[#ff5d6c]/20 bg-[#ff5d6c]/10 px-4 py-2 text-sm text-[#ffb1b8]">
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

