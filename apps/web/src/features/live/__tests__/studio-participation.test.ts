import { describe,expect,it } from 'vitest';
import { applyStudioCommand,emptyStudioState,projectStudioState,type StudioActor } from '../live-studio-domain';
import { studioCommandSchema,studioStateSchema,type StudioCommand } from '../live-studio.contract';

const id=(n:number)=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const teacher:StudioActor={id:id(1),name:'Docente',canManage:true,courseId:id(99),status:'live'};
const pupil={...teacher,id:id(2),name:'Alumno',canManage:false},other={...pupil,id:id(3)};
const now='2026-10-24T18:00:00.000Z';
const at=(seconds:number)=>new Date(Date.parse(now)+seconds*1000).toISOString();
const apply=(state:ReturnType<typeof emptyStudioState>,command:StudioCommand,actor=teacher,seconds=0)=>applyStudioCommand(state,command,actor,crypto.randomUUID(),at(seconds),()=>crypto.randomUUID());
const post={type:'post' as const,content:'Mensaje',question:false,room_id:null};

describe('reacciones y ritmo de participación',()=>{
  it('solo el instructor define un intervalo entero de 0 a 300 segundos',()=>{
    expect(()=>apply(emptyStudioState(),{type:'chat_interval',seconds:10},pupil)).toThrow('permisos');
    for(const seconds of [-1,301,1.5])expect(studioCommandSchema.safeParse({type:'chat_interval',seconds}).success).toBe(false);
    expect(apply(emptyStudioState(),{type:'chat_interval',seconds:0}).moderation.message_interval_seconds).toBe(0);
  });
  it('mantiene espera fuera del historial de cien mensajes y no limita al instructor',()=>{
    let state=apply(emptyStudioState(),{type:'chat_interval',seconds:10});state=apply(state,post,pupil);
    for(let n=0;n<101;n++)state=apply(state,post,teacher,1);
    expect(state.messages.some(message=>message.user_id===pupil.id)).toBe(false);
    expect(()=>apply(state,post,pupil,9)).toThrow('Espera 1 s');expect(apply(state,post,pupil,10).messages[99]?.user_id).toBe(pupil.id);
    state=apply(state,{type:'chat_interval',seconds:0});expect(()=>apply(state,post,pupil,1)).not.toThrow();
  });
  it('cambiar sala o renovar presencia no borra la espera',()=>{
    let state=apply(emptyStudioState(),{type:'chat_interval',seconds:30});state=apply(state,post,pupil);
    state.rooms=[{id:id(10),name:'Sala',user_ids:[pupil.id]}];state=apply(state,{type:'presence',room_id:id(10)},pupil,1);
    expect(()=>apply(state,{...post,room_id:id(10)},pupil,2)).toThrow('Espera');
  });
  it('reacciona sobre video aunque el chat esté cerrado, sin crear mensajes',()=>{
    let state=apply(emptyStudioState(),{type:'moderation',locked:true,reactions:true});state=apply(state,{type:'reaction',emoji:'👏',room_id:null},pupil);
    expect(state.messages).toEqual([]);expect(state.reaction_events[0]).toMatchObject({emoji:'👏',author:'Alumno',user_id:pupil.id});
    expect(()=>apply(state,{type:'reaction',emoji:'👍',room_id:null},pupil,.5)).toThrow('Espera');
    state=apply(state,{type:'moderation',locked:false,reactions:false});expect(()=>apply(state,{type:'reaction',emoji:'👍',room_id:null},pupil,2)).toThrow('deshabilitadas');
  });
  it('aísla eventos por sala y elimina eventos vencidos y ledger ajeno de la proyección',()=>{
    let state=emptyStudioState();state.rooms=[{id:id(10),name:'Sala',user_ids:[pupil.id]}];state=apply(state,{type:'presence',room_id:id(10)},pupil);state=apply(state,{type:'reaction',emoji:'❤️',room_id:id(10)},pupil);
    expect(projectStudioState(state,other,at(1)).reaction_events).toEqual([]);expect(projectStudioState(state,pupil,at(1)).reaction_events).toHaveLength(1);expect(projectStudioState(state,pupil,at(5)).reaction_events).toEqual([]);expect(projectStudioState(state,other,at(1)).participation).toEqual({});
    expect(studioCommandSchema.safeParse({type:'reaction',emoji:'texto',room_id:null}).success).toBe(false);expect(studioCommandSchema.safeParse({type:'reaction',emoji:'👏',room_id:null,author:'Falso'}).success).toBe(false);
  });
  it('lee estados anteriores con intervalo desactivado y sin eventos',()=>{
    const old={...emptyStudioState(),reaction_events:undefined,participation:undefined,moderation:{locked:false,reactions:true,restrictions:{}}};expect(studioStateSchema.parse(old)).toMatchObject({reaction_events:[],participation:{},moderation:{message_interval_seconds:0}});
  });
});
