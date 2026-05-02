import { useEffect, useState } from "react";
import { useAuth } from "@clerk/react";

export interface TrialStatus {
  isLoading: boolean;
  daysLeft: number;
  trialExpired: boolean;
  isPaid: boolean;
}

export function useTrialStatus(): TrialStatus {
  const { isSignedIn, isLoaded } = useAuth();
  const [status, setStatus] = useState<TrialStatus>({
    isLoading: true,
    daysLeft: 30,
    trialExpired: false,
    isPaid: false,
  });

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setStatus({ isLoading: false, daysLeft: 30, trialExpired: false, isPaid: false });
      return;
    }

    fetch("/api/users/me", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        setStatus({
          isLoading: false,
          daysLeft: data.daysLeft ?? 0,
          trialExpired: data.trialExpired ?? false,
          isPaid: data.isPaid ?? false,
        });
      })
      .catch(() => {
        setStatus({ isLoading: false, daysLeft: 30, trialExpired: false, isPaid: false });
      });
  }, [isSignedIn, isLoaded]);

  return status;
}
