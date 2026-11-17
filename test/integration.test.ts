// SPDX-License-Identifier: MIT
import { describe, expect, it } from "vitest";
import { PepkioClient } from "../src/client.js";
import { TOOL_ID } from "../src/config.js";

const LOCAL_BASE_URL = "https://tools.localtest.me";
const PRODUCTION_BASE_URL = "https://tools.pepkio.com";

function envConfig(env: "local" | "production") {
  const baseUrl = process.env.PEPKIO_API_BASE_URL
    ? process.env.PEPKIO_API_BASE_URL.replace(/\/$/, "")
    : env === "local"
      ? LOCAL_BASE_URL
      : PRODUCTION_BASE_URL;

  const isLocal = baseUrl.includes("localtest.me") || baseUrl.includes("localhost");
  const apiKey = isLocal
    ? process.env.LOCAL_PEPKIO_API_KEY ?? process.env.PEPKIO_API_KEY
    : process.env.PEPKIO_API_KEY;

  return { baseUrl, apiKey, isLocal };
}

describe("integration: local", () => {
  const { baseUrl, apiKey } = envConfig("local");

  it.skipIf(!apiKey || !baseUrl.includes("localtest.me"))(
    "fetches manifest",
    async () => {
      const client = new PepkioClient({ baseUrl, apiKey });
      const manifest = await client.getManifest();

      expect(manifest.tool_id).toBe(TOOL_ID);
      expect(manifest.title).toBe("Ligation Ratio Calculator");
      const names = manifest.examples?.map((e) => e.name) ?? [];
      expect(names).toContain("sticky_3kb_1kb");
    },
    30_000,
  );

  it.skipIf(!apiKey || !baseUrl.includes("localtest.me"))(
    "runs sticky_3kb_1kb example",
    async () => {
      const client = new PepkioClient({ baseUrl, apiKey });
      const input = await client.getExampleInput("sticky_3kb_1kb");
      const result = await client.run(input);

      expect(result.status).toBe("completed");
      expect(result.error).toBeFalsy();
      expect(result.run_id).toBeTruthy();
      expect(result.result).toBeDefined();
      expect(result.result?.columns?.length).toBe(3);
      expect(result.result?.columns?.[0].ratio).toBe(1);
      expect(result.result?.columns?.[0].feasible).toBe(true);
      expect(result.result?.columns?.[0].inserts?.length).toBe(1);
      expect(result.result?.columns?.[0].inserts?.[0].mass_ng).toBeCloseTo(16.67, 1);
    },
    60_000,
  );
});

describe("integration: production", () => {
  const { baseUrl, apiKey } = envConfig("production");

  it.skipIf(!apiKey || baseUrl.includes("localtest.me"))(
    "fetches manifest",
    async () => {
      const client = new PepkioClient({ baseUrl, apiKey });
      const manifest = await client.getManifest();

      expect(manifest.tool_id).toBe(TOOL_ID);
      expect(manifest.title).toBe("Ligation Ratio Calculator");
      const names = manifest.examples?.map((e) => e.name) ?? [];
      expect(names).toContain("sticky_3kb_1kb");
    },
    30_000,
  );

  it.skipIf(!apiKey || baseUrl.includes("localtest.me"))(
    "runs sticky_3kb_1kb example",
    async () => {
      const client = new PepkioClient({ baseUrl, apiKey });
      const input = await client.getExampleInput("sticky_3kb_1kb");
      const result = await client.run(input);

      expect(result.status).toBe("completed");
      expect(result.error).toBeFalsy();
      expect(result.run_id).toBeTruthy();
      expect(result.result).toBeDefined();
      expect(result.result?.columns?.length).toBe(3);
      expect(result.result?.columns?.[1].ratio).toBe(3);
      expect(result.result?.columns?.[1].feasible).toBe(true);
      expect(result.result?.columns?.[1].inserts?.length).toBe(1);
      expect(result.result?.columns?.[1].inserts?.[0].mass_ng).toBe(50);
    },
    60_000,
  );
});
