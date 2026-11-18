// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { engineSessionManifestSchema, engineConductionSchema } from '../engine-preparation.contract';
import { applyStudioCommand, emptyStudioState, projectStudioState } from '../live-studio-domain';
import { projectStudioResponse } from '../studio-response';

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const teacher = { id: id(1), name: 'Docente', canManage: true, courseId: id(2), status: 'scheduled' };
const now = '2026-11-17T18:00:00.000Z';
function manifest() {
  return engineSessionManifestSchema.parse({
    version: 1, course_id: id(2), revision: 'engine:origen:sesion:1',
    scenes: [{ id: id(3), name: 'Lámina', kind: 'slide', title: 'Tema', description: 'Visible' }],
    materials: [], quizzes: [], practices: [{ id: id(4), title: 'Caso', instructions: 'Resuelve' }],
    preparation: {
      minutes: 60,
      blocks: [{ id: 'aplicacion', purpose: 'Aplicar', minutes: 60, explanation: 'RESERVADO', activity: 'Caso', criteria: ['Justifica'], practice_ids: [id(4)] }],
      speaker_notes: [{ scene_id: id(3), content: 'NOTA RESERVADA' }],
    },
  });
}
function prepared() {
  return applyStudioCommand(emptyStudioState(), { type: 'import_engine', manifest: manifest() }, teacher, id(5), now, () => id(6));
}
describe('preparación de sesión por rol y versión', () => {
  it('conserva bloques y notas y excluye toda preparación del participante', () => {
    const state = prepared();
    expect(projectStudioState(state, teacher, now).engine_preparation).toEqual(manifest().preparation);
    const student = projectStudioState(state, { ...teacher, id: id(7), canManage: false }, now);
    expect(student).not.toHaveProperty('engine_preparation');
    expect(JSON.stringify(student)).not.toContain('RESERVAD');
    expect(student.scenes[0].description).toBe('Visible');
  });
  it('rechaza importación por alumno y conserva su estado previo', () => {
    const state = emptyStudioState();
    expect(() => applyStudioCommand(state, { type: 'import_engine', manifest: manifest() }, { ...teacher, canManage: false }, id(5), now, () => id(6))).toThrow('permisos');
    expect(state.engine_revision).toBeNull();
  });
  it('solo devuelve preparación cuando el cliente negocia y el actor puede gestionar', () => {
    const response = { snapshot: { session_id: id(8), user_id: id(1), can_manage: true, title: 'Clase', server_time: now, state: prepared(), asset_urls: {} } };
    expect(projectStudioResponse(response, true).snapshot?.state).not.toHaveProperty('engine_preparation');
    expect(projectStudioResponse(response, false).snapshot?.state).not.toHaveProperty('engine_preparation');
    expect(projectStudioResponse(response, true, true).snapshot?.state.engine_preparation).toBeDefined();
    expect(projectStudioResponse({ snapshot: { ...response.snapshot, can_manage: false } }, true, true).snapshot?.state).not.toHaveProperty('engine_preparation');
    expect(response.snapshot.state.engine_preparation).toBeDefined();
  });
  it('admite manifiesto anterior y limpia notas de una preparación reemplazada', () => {
    const { preparation, ...legacy } = manifest();
    void preparation;
    expect(engineSessionManifestSchema.safeParse(legacy).success).toBe(true);
    const state = applyStudioCommand(prepared(), { type: 'import_engine', manifest: legacy }, teacher, id(9), now, () => id(10));
    expect(state.engine_preparation).toBeUndefined();
  });
  it('rechaza tiempos, IDs duplicados, referencias ajenas y notas repetidas', () => {
    const valid = manifest();
    const preparation = valid.preparation!;
    expect(engineConductionSchema.safeParse({ ...preparation, minutes: 61 }).success).toBe(false);
    expect(engineConductionSchema.safeParse({ ...preparation, minutes: 120, blocks: [...preparation.blocks, ...preparation.blocks] }).success).toBe(false);
    expect(engineSessionManifestSchema.safeParse({ ...valid, preparation: { ...preparation, speaker_notes: [{ scene_id: id(99), content: 'Ajena' }] } }).success).toBe(false);
    expect(engineSessionManifestSchema.safeParse({ ...valid, preparation: { ...preparation, blocks: [{ ...preparation.blocks[0], practice_ids: [id(99)] }] } }).success).toBe(false);
    expect(engineConductionSchema.safeParse({ ...preparation, speaker_notes: [...preparation.speaker_notes, ...preparation.speaker_notes] }).success).toBe(false);
  });
});
