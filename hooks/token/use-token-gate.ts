"use client";

// =============================================================================
// isaacpaha.com — useTokenGate Client Hook
// hooks/use-token-gate.ts
//
// Handles the client-side 402 response from token-gate.ts.
// Surfaces the InsufficientTokensModal automatically.
//
// Usage in any tool component:
//
//   const { tokenModal, handleGateResponse, closeTokenModal } = useTokenGate();
//
//   // After a fetch call:
//   const res = await fetch("/api/tools/chemistry-engine/explain", { ... });
//   if (!await handleGateResponse(res)) return; // modal shown, stop here
//   const data = await res.json();
//   // ... use data
//
//   // In JSX:
//   <InsufficientTokensModal
//     open={!!tokenModal}
//     onClose={closeTokenModal}
//     required={tokenModal?.required  ?? 0}
//     balance={tokenModal?.balance ?? 0}
//     toolName={tokenModal?.toolName}
//     onPlayGame={() => { closeTokenModal(); router.push("/game"); }}
//   />
// =============================================================================

import { useState, useCallback } from "react";

export interface TokenModalState {
  required: number;
  balance:  number;
  toolName: string | null;
}

export function useTokenGate() {
  const [tokenModal, setTokenModal] = useState<TokenModalState | null>(null);

  /**
   * Pass the raw Response from a fetch call.
   * Returns true if the route succeeded (non-402), false if tokens were short
   * (and the modal has been triggered).
   *
   * Note: does NOT consume the response body — callers can still call res.json().
   */
  const handleGateResponse = useCallback(
    async (res: Response): Promise<boolean> => {
      if (res.status !== 402) return true;

      try {
        const data = await res.clone().json();
        setTokenModal({
          required: data.required ?? 0,
          balance:  data.balance  ?? 0,
          toolName: data.toolName ?? null,
        });
      } catch {
        setTokenModal({ required: 0, balance: 0, toolName: null });
      }

      return false;
    },
    [],
  );

  const closeTokenModal = useCallback(() => setTokenModal(null), []);

  return { tokenModal, handleGateResponse, closeTokenModal };
}