// lib/streaming.ts
import * as streamingAvailability from "streaming-availability";

export type StreamingOption = {
  serviceId: string;
  serviceName: string;
  type: string;
  link: string | null;
  quality: string | null;
};

export type CountryStreaming = {
  options: StreamingOption[];
  updatedAt: Date;
};

function getClient() {
  const apiKey = process.env.STREAMING_AVAILABILITY_API_KEY;
  if (!apiKey) return null;
  return new streamingAvailability.Client(
    new streamingAvailability.Configuration({ apiKey }),
  );
}

/**
 * One MotN call — no country → global streamingOptions map.
 * Returns {} if key missing or request fails (fail soft).
 */
export async function fetchGlobalWhereToWatch(
  showId: string,
): Promise<Record<string, CountryStreaming>> {
  const client = getClient();
  if (!client) return {};

  try {
    // Intentionally omit country for global availability
    const show = await client.showsApi.getShow({ id: showId });
    const now = new Date();
    const byCountry: Record<string, CountryStreaming> = {};

    const map = show.streamingOptions ?? {};
    for (const [countryCode, options] of Object.entries(map)) {
      const list = Array.isArray(options) ? options : [];
      byCountry[countryCode] = {
        options: list.map((opt) => ({
          serviceId: opt.service?.id ?? "unknown",
          serviceName: opt.service?.name ?? "Unknown",
          type: String(opt.type ?? "unknown"),
          link: opt.link ?? null,
          quality: opt.quality ?? null,
        })),
        updatedAt: now,
      };
    }
    return byCountry;
  } catch (err) {
    console.error("Streaming Availability global fetch failed:", err);
    return {};
  }
}
