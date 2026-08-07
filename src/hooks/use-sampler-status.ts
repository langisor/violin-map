import { useEffect, useState } from "react";
import type { StatusReportingSampler, SamplerStatus } from "@/lib/sampler-audio";

/** Reactively tracks a sampler engine's load status (loading/ready/error/empty) for UI toggles. */
export function useSamplerStatus(engine: StatusReportingSampler): SamplerStatus {
 const [status, setStatus] = useState<SamplerStatus>(engine.status);

 useEffect(() => {
  setStatus(engine.status);
  return engine.onStatusChange(setStatus);
 }, [engine]);

 return status;
}
