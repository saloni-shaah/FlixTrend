import { useEffect, useState } from "react";

export type Quality = "1080p" | "720p";

export function useNetworkQuality(): Quality {
  const [quality, setQuality] = useState<Quality>("720p");

  useEffect(() => {
    // Use Network Information API if available
    const conn = (navigator as any).connection;
    if (conn) {
      const check = () => {
        const fast = conn.effectiveType === "4g" && conn.downlink >= 5;
        setQuality(fast ? "1080p" : "720p");
      };
      check();
      conn.addEventListener("change", check);
      return () => conn.removeEventListener("change", check);
    }

    // Fallback: fetch a small probe and time it
    const start = Date.now();
    fetch("https://www.gstatic.com/generate_204", { cache: "no-store" })
      .then(() => {
        const ms = Date.now() - start;
        setQuality(ms < 300 ? "1080p" : "720p");
      })
      .catch(() => setQuality("720p"));
  }, []);

  return quality;
}
