// SPDX-License-Identifier: MIT
import { z } from "zod";

export const ligoModeSchema = z.enum(["standard", "multi_fragment"]);
export type LigoMode = z.infer<typeof ligoModeSchema>;

export const cloningPresetSchema = z.enum([
  "sticky_end",
  "blunt_end",
  "ta_cloning",
  "gibson",
]);
export type CloningPreset = z.infer<typeof cloningPresetSchema>;

export const sizeUnitSchema = z.enum(["bp", "kb"]);
export type SizeUnit = z.infer<typeof sizeUnitSchema>;

export const concUnitSchema = z.enum(["ng_uL", "ug_mL"]);
export type ConcUnit = z.infer<typeof concUnitSchema>;

export const insertInputSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().optional(),
    size: z.number().positive("Insert size must be greater than 0"),
    size_unit: sizeUnitSchema.optional().default("bp"),
    concentration: z.number().positive("Insert concentration must be greater than 0"),
    conc_unit: concUnitSchema.optional().default("ng_uL"),
  })
  .passthrough();
export type InsertInput = z.infer<typeof insertInputSchema>;

export const ligoRatioCalcInputSchema = z
  .object({
    mode: ligoModeSchema,
    cloning_preset: cloningPresetSchema.optional(),
    vector_size: z.number().positive("Vector size must be greater than 0"),
    vector_size_unit: sizeUnitSchema.optional().default("bp"),
    vector_concentration: z
      .number()
      .positive("Vector concentration must be greater than 0"),
    vector_conc_unit: concUnitSchema.optional().default("ng_uL"),
    vector_mass_ng: z.number().positive("Vector mass must be greater than 0"),
    reaction_volume_ul: z
      .number()
      .positive("Reaction volume must be greater than 0"),
    buffer_volume_ul: z.number().nonnegative("Buffer volume cannot be negative"),
    enzyme_volume_ul: z.number().nonnegative("Enzyme volume cannot be negative"),
    ratios: z
      .array(z.number().positive("Molar ratios must be positive numbers"))
      .min(1, "At least one molar ratio must be specified"),
    inserts: z
      .array(insertInputSchema)
      .min(1, "At least one insert fragment must be specified"),
  })
  .passthrough();
export type LigoRatioCalcInput = z.infer<typeof ligoRatioCalcInputSchema>;

export function parseRunInput(input: unknown): LigoRatioCalcInput {
  return ligoRatioCalcInputSchema.parse(input);
}
