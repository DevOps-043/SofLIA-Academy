import { ENGINE_DOCUMENT_LABELS } from '../engine-session-documents.contract';
// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { applyStudioCommand, emptyStudioState, projectPublishedDocuments, projectStudioState } from '../live-studio-domain';
import { engineSessionManifestSchema } from '../engine-preparation.contract';
import { projectStudioResponse } from '../studio-response';
import type { StudioSnapshot } from '../live-studio.contract';
const id = (value:number) => `00000000-0000-4000-8000-${String(value).padStart(12,'0')}`;
const now = '2026-11-17T18:00:00Z';
const actor = { id:id(1), name:'Docente', canManage:true, courseId:id(2), status:'scheduled' };
function fixture() {
  const manifest = engineSessionManifestSchema.parse({
    version:1, course_id:id(2), revision:'engine:curso:sesion:2', scenes:[], practices:[], materials:[], quizzes:[],
    preparation:{ minutes:60, blocks:[{id:'block',purpose:'Aplicar',minutes:60,explanation:'Explicar',activity:'Caso',criteria:['Justifica'],practice_ids:[]}], speaker_notes:[],
      documents: Object.entries(ENGINE_DOCUMENT_LABELS).map(([kind,title]) => ({
        id:kind==='assessment'?'evaluation':kind,kind,title,applicable:true,reason:'',block_ids:['block'],source_refs:[],
        participant_sections:kind==='assessment'?[{heading:'Consigna',body:'PUBLICO'}]:[],
        facilitator_sections:[{heading:'Respuesta',body:'RESERVADO'}],
      })) },
  });
  const state=applyStudioCommand(emptyStudioState(),{type:'import_engine',manifest},actor,id(3),now,()=>id(4));
  return { manifest,state };
}
describe('documentos por audiencia',()=>{
  it('parte sin documentos publicados y permite publicar y retirar secciones públicas',()=>{
    const {state}=fixture();
    expect(projectPublishedDocuments(state)).toEqual([]);
    const published=applyStudioCommand(state,{type:'publish_document',document_id:'evaluation',published:true},actor,id(5),now,()=>id(6));
    expect(projectPublishedDocuments(published)).toEqual([{id:'evaluation',kind:'assessment',title:'Instrumentos de evaluación',sections:[{heading:'Consigna',body:'PUBLICO'}]}]);
    expect(JSON.stringify(projectPublishedDocuments(published))).not.toContain('RESERVADO');
    const retired=applyStudioCommand(published,{type:'publish_document',document_id:'evaluation',published:false},actor,id(7),now,()=>id(8));
    expect(projectPublishedDocuments(retired)).toEqual([]);
  });
  it('deniega publicación por alumno y documentos reservados o ajenos',()=>{
    const {state}=fixture();
    expect(()=>applyStudioCommand(state,{type:'publish_document',document_id:'evaluation',published:true},{...actor,canManage:false},id(5),now,()=>id(6))).toThrow('permisos');
    expect(()=>applyStudioCommand(state,{type:'publish_document',document_id:'ajeno',published:true},actor,id(5),now,()=>id(6))).toThrow('disponible');
    state.engine_preparation!.documents!.find(item=>item.id==='evaluation')!.participant_sections=[];
    expect(()=>applyStudioCommand(state,{type:'publish_document',document_id:'evaluation',published:true},actor,id(5),now,()=>id(6))).toThrow('disponible');
  });
  it('una preparación nueva exige volver a publicar los documentos',()=>{
    const {state,manifest}=fixture();
    state.published_document_ids=['evaluation'];
    const next=applyStudioCommand(state,{type:'import_engine',manifest:{...manifest,revision:'engine:curso:sesion:3'}},actor,id(5),now,()=>id(6));
    expect(projectPublishedDocuments(next)).toEqual([]);
  });
  it('conserva la forma de primera entrega y excluye preparación del alumno',()=>{
    const {state}=fixture();
    const snapshot:StudioSnapshot={session_id:id(10),user_id:id(1),can_manage:true,title:'Clase',server_time:now,state:projectStudioState(state,actor,now),asset_urls:{},published_documents:[]};
    const legacy=projectStudioResponse({snapshot},true,true).snapshot!;
    expect(legacy.state.engine_preparation).not.toHaveProperty('documents');
    expect(legacy).not.toHaveProperty('published_documents');
    expect(projectStudioResponse({snapshot},true,true,true).snapshot?.state.engine_preparation?.documents).toHaveLength(14);
    expect(projectStudioState(state,{...actor,canManage:false},now)).not.toHaveProperty('engine_preparation');
  });
  it('rechaza documentos que repiten identidad o refieren bloques ajenos',()=>{
    const {manifest}=fixture();
    manifest.preparation!.documents![0].block_ids=['ajeno'];
    expect(engineSessionManifestSchema.safeParse(manifest).success).toBe(false);
  });
});

describe('protección del trabajo de participantes', () => {
  it('bloquea reemplazo del paquete cuando ya existen entregas', () => {
    const {state,manifest}=fixture();
    state.submissions=[{practice_id:id(20),user_id:id(21),content:'Evidencia del alumno',created_at:now}];
    expect(()=>applyStudioCommand(state,{type:'import_engine',manifest},actor,id(22),now,()=>id(23))).toThrow('participantes');
    expect(state.submissions).toHaveLength(1);
  });
});
