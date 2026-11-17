// SPDX-License-Identifier: MIT
import type {
  CloningPreset,
  ConcUnit,
  InsertInput,
  LigoMode,
  LigoRatioCalcInput,
  SizeUnit,
} from "./schemas.js";

export type {
  CloningPreset,
  ConcUnit,
  InsertInput,
  LigoMode,
  LigoRatioCalcInput,
  SizeUnit,
};

export type RunStatus = "queued" | "running" | "completed" | "failed" | (string & {});

export interface RunOptions {
  idempotency_key?: string;
  label?: string;
  [key: string]: unknown;
}

export interface ManifestExample {
  name: string;
  description?: string;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
}

export interface ToolManifest {
  schema_version: string;
  tool_id: string;
  title: string;
  description?: string;
  tags?: string[];
  category?: string;
  execution_mode?: string;
  estimated_runtime_sec?: number;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  agent_notes?: string;
  example_prompts?: string[];
  examples?: ManifestExample[];
  limits?: Record<string, unknown>;
  input_schema?: Record<string, unknown>;
}

export interface ExampleMeta {
  name: string;
  description?: string;
}

export interface InsertResult {
  id?: string;
  name?: string;
  mass_ng: number;
  pmol: number;
  volume_ul: number;
  [key: string]: unknown;
}

export interface LigoColumnResult {
  ratio: number;
  feasible: boolean;
  vector_mass_ng: number;
  vector_pmol: number;
  vector_volume_ul: number;
  inserts: InsertResult[];
  total_insert_volume_ul: number;
  buffer_volume_ul: number;
  enzyme_volume_ul: number;
  water_volume_ul: number;
  warnings: string[];
  status_message?: string | null;
  [key: string]: unknown;
}

export interface LigoRatioCalcResult {
  mode: LigoMode | string;
  cloning_preset?: CloningPreset | string;
  vector_bp: number;
  reaction_volume_ul: number;
  columns: LigoColumnResult[];
  global_warnings: string[];
  has_blocking_errors: boolean;
  [key: string]: unknown;
}

export interface RunResult<T = LigoRatioCalcResult> {
  run_id: string;
  status: RunStatus;
  result?: T;
  error?: string | { message?: string; code?: string; details?: unknown } | null;
  result_url?: string;
  permalink?: string;
  duration_ms?: number;
}

export class PepkioAPIError extends Error {
  readonly status: number;
  readonly body?: unknown;
  readonly runId?: string;
  readonly code?: string;

  constructor(
    message: string,
    opts: { status: number; body?: unknown; runId?: string; code?: string },
  ) {
    super(message);
    this.name = "PepkioAPIError";
    this.status = opts.status;
    this.body = opts.body;
    this.runId = opts.runId;
    this.code = opts.code;
  }
}
