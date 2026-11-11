/**
 * Ecosystem tools mapped to the nodes of the SofLIA molecular 3D logo.
 *
 * SofLIA is the umbrella brand; Engine, Academy, Agent and Skills are the
 * ecosystem tools. Each is "powered by SofLIA" but will ship its own 3D logo.
 * This config is the single source of truth the scrollytelling stage reads to
 * know which node of the molecule to zoom into and which tool logo to show.
 */
export type EcosystemToolId = 'engine' | 'learning' | 'agent' | 'skills';

export interface EcosystemTool {
  id: EcosystemToolId;
  /**
   * Approximate node position in the molecular logo's LOCAL space. The GLB is a
   * single merged mesh (no named nodes), and its bounding box is roughly
   * x∈[-0.71, 0.71], y∈[-0.95, 0.95], z∈[-0.19, 0.18]. These are hand-tuned to
   * sit on the four visible balls of the "S" — adjust once the real per-tool
   * logos land if the framing needs nudging.
   */
  nodePosition: [number, number, number];
  /** Highlight color for this tool's node pulse (design-system aqua for now). */
  color: string;
  /**
   * Path to the tool's own 3D logo (GLB) served from /public. Drop the file in
   * public/ecosystem/ and set the path here; until then the stage renders an
   * animated placeholder so the layout is complete.
   *
   * e.g. logoUrl: '/ecosystem/engine.web.glb'
   */
  logoUrl?: string;
}

export const ECOSYSTEM_TOOLS: EcosystemTool[] = [
  { id: 'engine', nodePosition: [-0.3, 0.72, 0.08], color: '#00D4B3', logoUrl: undefined },
  { id: 'learning', nodePosition: [0.42, 0.26, 0.08], color: '#00D4B3', logoUrl: undefined },
  // Optimized build of public/Pulse-Hub3D.glb (meshopt + WebP, ~0.4 MB).
  { id: 'agent', nodePosition: [-0.42, -0.26, 0.08], color: '#00D4B3', logoUrl: '/pulse-hub3d.web.glb' },
  { id: 'skills', nodePosition: [0.3, -0.72, 0.08], color: '#00D4B3', logoUrl: undefined },
]

export const ECOSYSTEM_TOOL_IDS = ECOSYSTEM_TOOLS.map((tool) => tool.id)

export function getEcosystemTool(id: EcosystemToolId): EcosystemTool {
  return ECOSYSTEM_TOOLS.find((tool) => tool.id === id) ?? ECOSYSTEM_TOOLS[0]
}

/** Optimized build of public/Soflia3D.glb (meshopt + WebP, ~0.5 MB). */
export const MODEL_URL = '/soflia3d.web.glb'
export const MODEL_SCALE = 2.2
