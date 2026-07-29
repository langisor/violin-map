import { useEffect, useState } from "react";
import type { SamplerEngine, SamplerStatus } from "@/lib/sampler-audio";

/** Reactively tracks a SamplerEngine's load status (loading/ready/error/empty) for UI toggles. */
export function useSamplerStatus(engine: SamplerEngine): SamplerStatus {
  const [status, setStatus] = useState<SamplerStatus>(engine.status);

  useEffect(() => {
    setStatus(engine.status);
    return engine.onStatusChange(setStatus);
  }, [engine]);

  return status;
}
