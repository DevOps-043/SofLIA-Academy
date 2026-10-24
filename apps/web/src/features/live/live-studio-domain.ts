import { studioCommandSchema, studioStateSchema, type StudioCommand, type StudioState } from './live-studio.contract';

export class StudioDomainError extends Error {
  constructor(public code: 'forbidden' | 'invalid' | 'closed' | 'rate_limited', message: string) { super(message); }
}
export type StudioActor = { id: string; name: string; canManage: boolean; courseId: string; status: string };
export function emptyStudioState(): StudioState {
  return { version: 1, revision: 0, engine_revision: null, moderation: { locked: false, reactions: true, message_interval_seconds:0, restrictions: {} }, reaction_events:[],participation:{},messages: [], members: [], rooms: [], scenes: [], active_scene_id: null, materials: [], quizzes: [], active_quiz_id: null, answers: [], practices: [], submissions: [], clock: null };
}
function deny(message = 'No tienes permisos para esta operación'): never { throw new StudioDomainError('forbidden', message); }
function invalid(message: string): never { throw new StudioDomainError('invalid', message); }
function upsert<T extends { id: string }>(items: T[], item: T, max: number): T[] {
  if (!items.some((entry) => entry.id === item.id) && items.length >= max) invalid('Se alcanzó el límite de contenido de la sesión');
  return [...items.filter((entry) => entry.id !== item.id), item];
}
export function applyStudioCommand(previous: StudioState, input: StudioCommand, actor: StudioActor, commandId: string, now: string, newId: () => string): StudioState {
  const command = studioCommandSchema.parse(input);
  const state = structuredClone(studioStateSchema.parse(previous));
  if (state.moderation.restrictions[actor.id] === 'blocked') deny('Tu acceso a esta sesión está bloqueado');
  if (['ended', 'cancelled'].includes(actor.status) && command.type !== 'presence') throw new StudioDomainError('closed', 'La sesión está cerrada');
  const participantCommands = ['post', 'reaction', 'presence', 'answer_quiz', 'submit_practice'];
  if (!actor.canManage && !participantCommands.includes(command.type)) deny();
  const currentRoom = state.members.find((member) => member.user_id === actor.id)?.room_id ?? null;
  const roomAllowed = (room: string | null) => !room || state.rooms.some((entry) => entry.id === room && (actor.canManage || entry.user_ids.includes(actor.id)));
  const milliseconds=Date.parse(now);
  state.reaction_events=state.reaction_events.filter(event=>milliseconds-Date.parse(event.created_at)>=0&&milliseconds-Date.parse(event.created_at)<5000);
  state.participation=Object.fromEntries(Object.entries(state.participation).filter(([,entry])=>Math.max(Date.parse(entry.last_message_at||'')||0,Date.parse(entry.last_reaction_at||'')||0)>milliseconds-300000));
  const previousParticipation=state.participation[actor.id]??{};
  function waitSince(timestamp:string|undefined,seconds:number){const remaining=timestamp?Math.ceil((Date.parse(timestamp)+seconds*1000-milliseconds)/1000):0;if(remaining>0)throw new StudioDomainError('rate_limited',`Espera ${remaining} s antes de volver a enviar.`);}
  switch (command.type) {
    case 'chat_interval': state.moderation.message_interval_seconds=command.seconds;break;
    case 'reaction': {
      if(!state.moderation.reactions)deny('Las reacciones están deshabilitadas');
      if(!roomAllowed(command.room_id)||command.room_id!==currentRoom)deny('Entra a la sala antes de reaccionar');
      waitSince(previousParticipation.last_reaction_at,1);
      state.participation[actor.id]={...previousParticipation,last_reaction_at:now};
      state.reaction_events=[...state.reaction_events.slice(-99),{id:commandId,user_id:actor.id,author:actor.name,emoji:command.emoji,room_id:command.room_id,created_at:now}];break;
    }
    case 'post': {
      if (!actor.canManage && (state.moderation.locked || state.moderation.restrictions[actor.id] === 'chat')) deny('Tu chat está en modo lectura');
      if (!roomAllowed(command.room_id) || command.room_id !== currentRoom) deny('Entra a la sala antes de escribir');
      if(!actor.canManage)waitSince(previousParticipation.last_message_at,state.moderation.message_interval_seconds);
      state.participation[actor.id]={...previousParticipation,last_message_at:now};
      state.messages = [...state.messages.slice(-99), { id: commandId, user_id: actor.id, author: actor.name, instructor: actor.canManage, content: command.content, question: command.question, room_id: command.room_id, created_at: now }]; break;
    }
    case 'moderation': state.moderation.locked = command.locked; state.moderation.reactions = command.reactions; break;
    case 'restrict': {
      if (command.user_id === actor.id || state.members.some((member) => member.user_id === command.user_id && member.instructor)) deny('No se puede moderar a un instructor desde el chat');
      if (command.restriction !== 'none' && !state.members.some((member) => member.user_id === command.user_id)) invalid('El participante no está en la sesión');
      if (command.restriction === 'none') delete state.moderation.restrictions[command.user_id];
      else state.moderation.restrictions[command.user_id] = command.restriction;
      if (command.restriction === 'blocked') state.members = state.members.filter((member) => member.user_id !== command.user_id);
      break;
    }
    case 'presence': {
      if (!roomAllowed(command.room_id)) deny('No tienes asignada esa sala');
      state.members = state.members.filter((member) => member.user_id !== actor.id && Date.parse(now) - Date.parse(member.seen_at) < 90000);
      if (!command.leave) {
        if (state.members.length >= 500) invalid('La sesión alcanzó el límite de participantes');
        state.members.push({ user_id: actor.id, name: actor.name, instructor: actor.canManage, room_id: command.room_id, seen_at: now });
      }
      break;
    }
    case 'rooms': {
      const users = state.members.filter((member) => !member.instructor && Date.parse(now) - Date.parse(member.seen_at) < 90000).map((member) => member.user_id).sort();
      if (!users.length) invalid('No hay participantes conectados para distribuir');
      const count = Math.min(users.length, command.mode === 'size' ? Math.ceil(users.length / command.value) : command.value, 50);
      state.rooms = Array.from({ length: count }, (_, index) => ({ id: newId(), name: `Sala ${index + 1}`, user_ids: users.filter((_, position) => position % count === index) }));
      state.members.forEach((member) => { member.room_id = null; }); break;
    }
    case 'close_rooms': state.rooms = []; state.members.forEach((member) => { member.room_id = null; }); break;
    case 'scene': {
      if (state.scenes.some((scene) => scene.id !== command.scene.id && scene.name.toLocaleLowerCase() === command.scene.name.toLocaleLowerCase())) invalid('Ya existe una escena con ese nombre');
      state.scenes = upsert(state.scenes, command.scene, 12); state.active_scene_id ??= command.scene.id; break;
    }
    case 'remove_scene': state.scenes = state.scenes.filter((scene) => scene.id !== command.scene_id); if (state.active_scene_id === command.scene_id) state.active_scene_id = state.scenes[0]?.id ?? null; break;
    case 'select_scene': if (command.scene_id && !state.scenes.some((scene) => scene.id === command.scene_id)) invalid('La escena no pertenece a esta sesión'); state.active_scene_id = command.scene_id; break;
    case 'material': state.materials = upsert(state.materials, command.material, 20); break;
    case 'remove_material': state.materials = state.materials.filter((material) => material.id !== command.material_id); break;
    case 'quiz': state.quizzes = upsert(state.quizzes, command.quiz, 20); break;
    case 'publish_quiz': if (command.quiz_id && !state.quizzes.some((quiz) => quiz.id === command.quiz_id)) invalid('Quiz no encontrado'); state.active_quiz_id = command.quiz_id; break;
    case 'answer_quiz': {
      const quiz = state.quizzes.find((entry) => entry.id === command.quiz_id && entry.id === state.active_quiz_id);
      if (!quiz || command.answer >= quiz.options.length) invalid('El quiz o la respuesta no están disponibles');
      if (state.answers.some((answer) => answer.user_id === actor.id && answer.quiz_id === quiz.id)) invalid('Ya respondiste este quiz');
      if (state.answers.length >= 10000) invalid('Se alcanzó el límite de respuestas');
      state.answers.push({ quiz_id: quiz.id, user_id: actor.id, answer: command.answer }); break;
    }
    case 'practice': state.practices = upsert(state.practices, command.practice, 20); break;
    case 'submit_practice': {
      if (!state.practices.some((entry) => entry.id === command.practice_id)) invalid('Práctica no encontrada');
      state.submissions = state.submissions.filter((entry) => entry.practice_id !== command.practice_id || entry.user_id !== actor.id);
      if (state.submissions.length >= 500) invalid('Se alcanzó el límite de entregas');
      state.submissions.push({ practice_id: command.practice_id, user_id: actor.id, content: command.content, created_at: now }); break;
    }
    case 'clock': state.clock = { ...command.clock, updated_at: now }; break;
    case 'import_engine': {
      const manifest = command.manifest;
      if (manifest.course_id !== actor.courseId) deny('El contenido pertenece a otro curso');
      for (const collection of [manifest.scenes, manifest.materials, manifest.quizzes, manifest.practices]) {
        if (new Set(collection.map((item) => item.id)).size !== collection.length) invalid('El manifiesto tiene identificadores duplicados');
      }
      state.scenes = manifest.scenes; state.materials = manifest.materials; state.quizzes = manifest.quizzes; state.practices = manifest.practices;
      state.active_scene_id = manifest.scenes[0]?.id ?? null; state.active_quiz_id = null; state.answers = []; state.submissions = []; state.engine_revision = manifest.revision; break;
    }
  }
  state.revision++;
  return studioStateSchema.parse(state);
}

/** Nunca devuelve claves de quiz, entregas ajenas ni conversaciones de otras salas. */
export function projectStudioState(state: StudioState, actor: StudioActor, now: string) {
  const room = state.members.find((member) => member.user_id === actor.id)?.room_id ?? null;
  if (state.moderation.restrictions[actor.id] === 'blocked') deny('Tu acceso a esta sesión está bloqueado');
  return {
    ...state,
    reaction_events:(state.reaction_events??[]).filter(event=>event.room_id===room&&Date.parse(now)-Date.parse(event.created_at)>=0&&Date.parse(now)-Date.parse(event.created_at)<5000),
    participation:state.participation?.[actor.id]?{[actor.id]:state.participation[actor.id]}:{},
    messages: state.messages.filter((message) => actor.canManage || message.room_id === room),
    members: state.members.filter((member) => Date.parse(now) - Date.parse(member.seen_at) < 90000),
    moderation: { ...state.moderation, restrictions: actor.canManage ? state.moderation.restrictions : state.moderation.restrictions[actor.id] ? { [actor.id]: state.moderation.restrictions[actor.id] } : {} },
    rooms: state.rooms.map((entry) => ({ ...entry, user_ids: actor.canManage ? entry.user_ids : entry.user_ids.filter((user) => user === actor.id) })),
    quizzes: state.quizzes.map(({ correct, ...quiz }) => actor.canManage ? { ...quiz, correct } : quiz),
    answers: state.answers.filter((answer) => actor.canManage || answer.user_id === actor.id),
    submissions: state.submissions.filter((submission) => actor.canManage || submission.user_id === actor.id),
  };
}
