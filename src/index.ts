// SPDX-License-Identifier: MIT

export {
  DEFAULT_API_BASE_URL,
  TOOL_ID,
  apiPath,
  isLocalUrl,
  resolveApiKey,
  resolveBaseUrl,
} from "./config.js";

export {
  cloningPresetSchema,
  concUnitSchema,
  insertInputSchema,
  ligoModeSchema,
  ligoRatioCalcInputSchema,
  parseRunInput,
  sizeUnitSchema,
  type CloningPreset,
  type ConcUnit,
  type InsertInput,
  type LigoMode,
  type LigoRatioCalcInput,
  type SizeUnit,
} from "./schemas.js";

export {
  PepkioAPIError,
  type ExampleMeta,
  type InsertResult,
  type LigoColumnResult,
  type LigoRatioCalcResult,
  type ManifestExample,
  type RunOptions,
  type RunResult,
  type RunStatus,
  type ToolManifest,
} from "./types.js";

export {
  PepkioClient,
  type PepkioClientOptions,
} from "./client.js";

import { PepkioClient } from "./client.js";
export default PepkioClient;
