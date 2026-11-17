# Pepkio Ligation Ratio Calculator

Typed TypeScript and Node.js SDK with CLI for planning DNA ligation stoichiometry, reaction mix volume budgets, and insert-to-vector molar ratios via the Pepkio Tools API.

# What It Does

In recombinant DNA cloning, setting up successful ligation reactions requires accurate molar stoichiometry between insert DNA fragments and plasmid vector backbones. Manual calculations and generic spreadsheets frequently introduce errors such as inverting length ratios, confusing mass and molar units, or overlooking whether required DNA volumes exceed reaction volume limits.

This package provides a typed Node.js/ESM client and command-line interface to calculate DNA ligation reaction parameters via the Pepkio Tools REST API. Given vector and insert sizes, concentrations, target molar ratios (e.g., 1:1, 3:1, 5:1, 10:1), and fixed buffer/enzyme allowances, it computes required insert masses, pipetting volumes, and nuclease-free water volumes while rigorously validating reaction volume budgets.

Programmatic runs require an active network connection and a Pepkio API key. Calculations are processed via the Pepkio Tools REST API.

# Features

- **Multi-Ratio Stoichiometry**: Evaluates multiple insert-to-vector molar ratios (e.g. 1:1, 3:1, 5:1, 10:1) simultaneously in a single API call
- **Volumetric Feasibility Validation**: Validates reaction volume constraints (5–50 µL) and alerts when stock DNA concentrations are too dilute to fit
- **Flexible Cloning Presets**: Built-in support for cohesive-end (sticky-end), blunt-end, TA cloning, and Gibson multi-fragment assembly
- **Multi-Fragment Assembly**: Handles single-insert subcloning as well as multi-insert reactions (up to 4 fragments in multi-fragment mode)
- **Automatic Unit Handling**: Supports fragment sizes in base pairs (bp) or kilobases (kb), and concentrations in ng/µL or µg/mL
- **Manifest and Example Inspection**: Typed helper methods `getManifest`, `listExamples`, and `getExampleInput`
- **Command-Line Interface (CLI)**: Inspect API manifests and execute cloning calculations directly with `npx pepkio-ligo-ratio-calc`
- **TypeScript & ESM Native**: Fully typed with runtime validation powered by Zod

# Installation

```bash
npm install pepkio-ligo-ratio-calc
```

Requires Node.js 18 or newer.

# Configuration

Set an API key with **tools:run** scope before calling `run()`:

```bash
export PEPKIO_API_KEY="your-api-key"
```

Create an API key in your [Pepkio account settings](https://www.pepkio.com/account/api-keys).

Optional configuration variables:

| Variable | Purpose |
|----------|---------|
| `PEPKIO_API_KEY` | Production API key (for remote API calls) |
| `LOCAL_PEPKIO_API_KEY` | Local development key when `PEPKIO_API_BASE_URL` points to `tools.localtest.me` |
| `PEPKIO_API_BASE_URL` | API base URL (default: `https://tools.pepkio.com`) |

# Quick Example

```typescript
import { PepkioClient } from "pepkio-ligo-ratio-calc";

const client = new PepkioClient({ apiKey: process.env.PEPKIO_API_KEY });

// Retrieve pre-configured sticky-end 3 kb vector / 1 kb insert example input
const input = await client.getExampleInput("sticky_3kb_1kb");
const response = await client.run(input);

if (response.result) {
  console.log("Feasibility and pipetting recipe:");
  for (const col of response.result.columns) {
    console.log(`Ratio ${col.ratio}: Feasible=${col.feasible}, Insert Vol=${col.insert_volume_ul} µL, Water=${col.water_volume_ul} µL`);
  }
}
```

# CLI

```bash
# Inspect available manifest examples
npx pepkio-ligo-ratio-calc manifest --examples

# Run a pre-configured manifest example
npx pepkio-ligo-ratio-calc run --example sticky_3kb_1kb
```

# Typical Use Cases

- **Cohesive-End (Sticky-End) Subcloning**: Calculate exact insert mass and pipetting volume for 3:1 or 5:1 molar ratios when ligating digested fragments into linearized vectors
- **Blunt-End Ligation Optimization**: Scale insert stoichiometry (5:1 to 10:1) to enhance bimolecular collision rates for blunt-ended PCR amplicons
- **Gibson Assembly & Multi-Fragment Cloning**: Balance molar ratios across multiple fragments while keeping total DNA volume under 20% of reaction capacity
- **Reaction Volume Budgeting**: Check whether dilute mini-prep or gel-extracted DNA samples fit into standard 10 µL or 20 µL T4 ligase mixtures
- **Automated Plate Setup**: Feed stoichiometric calculations directly into automated liquid handler protocols or bioinformatics pipelines

# Scientific Background

Ligation efficiency is governed by the relative molar concentration of fragment ends rather than absolute mass concentration. Double-stranded DNA molar amounts are calculated from mass and length using the average dsDNA molecular weight (~660 g/mol per bp):

$$\text{pmol dsDNA} = \frac{\text{Mass (ng)} \times 1000}{\text{Length (bp)} \times 660}$$

To achieve a target insert-to-vector molar ratio ($R$), the required insert mass is determined by:

$$\text{Insert Mass (ng)} = \text{Vector Mass (ng)} \times \left( \frac{\text{Insert Size (bp)}}{\text{Vector Size (bp)}} \right) \times R$$

Pipetting volume is calculated as Insert Mass (ng) / Insert Concentration (ng/µL). Total volume is completed with nuclease-free water after subtracting buffer, enzyme, vector, and insert volumes from the total reaction volume.

# Web Application

For researchers who prefer a graphical interface, an interactive web version is available.

Web Application: https://www.pepkio.com/tools/ligo-ratio-calc

The web application provides real-time volume budget visualization, cloning preset selection, shareable permalinks, and printable benchtop worksheets.

# Documentation and Resources

GitHub Repository: https://github.com/pepkio/pepkio-ligo-ratio-calc-js

Web Application: https://www.pepkio.com/tools/ligo-ratio-calc

Python client (PyPI): https://pypi.org/project/pepkio-ligo-ratio-calc/

# About Pepkio

Pepkio (https://www.pepkio.com/) develops software tools and bioinformatics solutions for life science researchers, including laboratory calculators and analysis services (https://www.pepkio.com/cro).

A semantic, AI-native version of this document in the K2F format is available at https://k2f.dev (https://k2f.dev/v/f766fd88d3f610e0d44e3fa916c2d0e13307620ead569182b7f0e540dc764f18)
