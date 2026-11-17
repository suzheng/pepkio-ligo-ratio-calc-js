// SPDX-License-Identifier: MIT
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PepkioClient } from "../src/client.js";
import {
  DEFAULT_API_BASE_URL,
  TOOL_ID,
  isLocalUrl,
  resolveApiKey,
  resolveBaseUrl,
} from "../src/config.js";
import { PepkioAPIError } from "../src/types.js";

const mockManifest = {
  schema_version: "1.0",
  tool_id: TOOL_ID,
  title: "Ligation Ratio Calculator",
  description: "Multi-ratio ligation calculator",
  examples: [
    {
      name: "sticky_3kb_1kb",
      input: {
        mode: "standard",
        cloning_preset: "sticky_end",
        vector_size: 3000,
        vector_size_unit: "bp",
        vector_concentration: 50,
        vector_conc_unit: "ng_uL",
        vector_mass_ng: 50,
        reaction_volume_ul: 10,
        buffer_volume_ul: 1,
        enzyme_volume_ul: 1,
        ratios: [1, 3, 5],
        inserts: [
          {
            id: "ins1",
            name: "Insert",
            size: 1000,
            size_unit: "bp",
            concentration: 20,
            conc_unit: "ng_uL",
          },
        ],
      },
      output: {
        columns: [{ ratio: 3, feasible: true }],
      },
    },
  ],
};

const mockRunResponse = {
  run_id: "test-run-ligo-123",
  status: "completed",
  result: {
    mode: "standard",
    cloning_preset: "sticky_end",
    vector_bp: 3000,
    reaction_volume_ul: 10,
    columns: [
      {
        ratio: 1,
        feasible: true,
        vector_mass_ng: 50,
        vector_pmol: 0.025,
        vector_volume_ul: 1,
        inserts: [
          {
            id: "ins1",
            name: "Insert",
            mass_ng: 16.67,
            pmol: 0.025,
            volume_ul: 0.83,
          },
        ],
        total_insert_volume_ul: 0.83,
        buffer_volume_ul: 1,
        enzyme_volume_ul: 1,
        water_volume_ul: 6.17,
        warnings: [],
        status_message: null,
      },
    ],
    global_warnings: [],
    has_blocking_errors: false,
  },
  error: null,
  duration_ms: 2,
};

describe("config utilities", () => {
  const origBase = process.env.PEPKIO_API_BASE_URL;
  const origLocal = process.env.LOCAL_PEPKIO_API_KEY;
  const origProd = process.env.PEPKIO_API_KEY;

  beforeEach(() => {
    delete process.env.PEPKIO_API_BASE_URL;
    delete process.env.LOCAL_PEPKIO_API_KEY;
    delete process.env.PEPKIO_API_KEY;
  });

  afterEach(() => {
    if (origBase) process.env.PEPKIO_API_BASE_URL = origBase;
    if (origLocal) process.env.LOCAL_PEPKIO_API_KEY = origLocal;
    if (origProd) process.env.PEPKIO_API_KEY = origProd;
  });

  it("resolves default production URL", () => {
    expect(resolveBaseUrl()).toBe(DEFAULT_API_BASE_URL);
  });

  it("prefers explicit override over env var", () => {
    process.env.PEPKIO_API_BASE_URL = "https://env.pepkio.com/";
    expect(resolveBaseUrl("https://override.pepkio.com/")).toBe(
      "https://override.pepkio.com",
    );
  });

  it("detects local URLs", () => {
    expect(isLocalUrl("https://tools.localtest.me")).toBe(true);
    expect(isLocalUrl("http://localhost:8000")).toBe(true);
    expect(isLocalUrl("https://tools.pepkio.com")).toBe(false);
  });

  it("picks LOCAL_PEPKIO_API_KEY for local URLs", () => {
    process.env.LOCAL_PEPKIO_API_KEY = "loc-key";
    process.env.PEPKIO_API_KEY = "prod-key";
    expect(resolveApiKey("https://tools.localtest.me")).toBe("loc-key");
    expect(resolveApiKey("https://tools.pepkio.com")).toBe("prod-key");
  });
});

describe("PepkioClient", () => {
  const origFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = origFetch;
    vi.restoreAllMocks();
  });

  it("fetches and caches manifest", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify(mockManifest),
    });
    globalThis.fetch = fetchMock;

    const client = new PepkioClient({ apiKey: "test-key" });
    const manifest1 = await client.getManifest();
    expect(manifest1.tool_id).toBe(TOOL_ID);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const manifest2 = await client.getManifest();
    expect(manifest2.tool_id).toBe(TOOL_ID);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await client.getManifest({ refresh: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("extracts and validates example inputs", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify(mockManifest),
    });

    const client = new PepkioClient({ apiKey: "test-key" });
    const examples = await client.getExamples();
    expect(examples).toHaveLength(1);
    expect(examples[0].name).toBe("sticky_3kb_1kb");

    const input = await client.getExampleInput("sticky_3kb_1kb");
    expect(input.mode).toBe("standard");
    expect(input.vector_size).toBe(3000);
    expect(input.ratios).toEqual([1, 3, 5]);

    await expect(client.getExampleInput("non_existent")).rejects.toThrow(
      /Example "non_existent" not found/,
    );
  });

  it("executes run and calculate calls", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify(mockRunResponse),
    });
    globalThis.fetch = fetchMock;

    const client = new PepkioClient({ apiKey: "test-key" });
    const input = mockManifest.examples[0].input as any;

    const res = await client.run(input, { label: "test-label" });
    expect(res.status).toBe("completed");
    expect(res.result?.columns[0].ratio).toBe(1);

    const calcRes = await client.calculate(input);
    expect(calcRes.status).toBe("completed");

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("requires API key for run()", async () => {
    const client = new PepkioClient({ apiKey: "" });
    const input = mockManifest.examples[0].input as any;

    await expect(client.run(input)).rejects.toThrow(PepkioAPIError);
    await expect(client.run(input)).rejects.toMatchObject({
      status: 401,
      message: expect.stringContaining("API key required"),
    });
  });

  it("handles HTTP error responses gracefully", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: "Bad Request",
      text: async () =>
        JSON.stringify({ error: { message: "Invalid ratio vector", code: "INVALID_INPUT" } }),
    });

    const client = new PepkioClient({ apiKey: "test-key" });
    const input = mockManifest.examples[0].input as any;

    await expect(client.run(input)).rejects.toThrow("Invalid ratio vector");
  });

  it("handles error in response body", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          run_id: "run-failed",
          status: "failed",
          error: "Calculation exceeded reaction capacity",
        }),
    });

    const client = new PepkioClient({ apiKey: "test-key" });
    const input = mockManifest.examples[0].input as any;

    await expect(client.run(input)).rejects.toThrow(
      "Calculation exceeded reaction capacity",
    );
  });

  it("waitForRun polls until completed", async () => {
    const queuedRes = {
      run_id: "async-run",
      status: "running",
    };
    const doneRes = {
      run_id: "async-run",
      status: "completed",
      result: mockRunResponse.result,
    };

    let count = 0;
    globalThis.fetch = vi.fn().mockImplementation(async () => {
      count++;
      return {
        ok: true,
        text: async () => JSON.stringify(count < 2 ? queuedRes : doneRes),
      };
    });

    const client = new PepkioClient({ apiKey: "test-key" });
    const res = await client.waitForRun("async-run", { intervalMs: 10, timeoutMs: 1000 });
    expect(res.status).toBe("completed");
    expect(count).toBe(2);
  });
});
