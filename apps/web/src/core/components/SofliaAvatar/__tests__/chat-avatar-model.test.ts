import { afterEach, describe, expect, it, vi } from 'vitest';
import { createChatAvatarActor, type ChatAvatarInput } from '../chat-avatar-model';

const reply = (id: string, content: string) => ({ id, content });
afterEach(() => vi.useRealTimers());
function setup(input: Partial<ChatAvatarInput> = {}) {
  vi.useFakeTimers(); vi.setSystemTime(new Date('2026-11-12T12:00:00Z'));
  const actor = createChatAvatarActor(); const stop = actor.subscribe(() => {});
  let current: ChatAvatarInput = { scope: 'owner:org:course', active: true, turn: 0, ...input };
  const update = (patch: Partial<ChatAvatarInput>) => { current = { ...current, ...patch }; actor.update(current); };
  update({}); return { actor, update, stop };
}

describe('presencia del asistente Academy', () => {
  it('saluda y reposa con Zzz a los veinte segundos sin uso', () => {
    const { actor, stop } = setup(); expect(actor.getSnapshot()).toBe('happy');
    vi.advanceTimersByTime(900); expect(actor.getSnapshot()).toBe('idle');
    vi.advanceTimersByTime(19100); expect(actor.getSnapshot()).toBe('sleeping');
    actor.touch(); expect(actor.getSnapshot()).toBe('idle'); stop(); expect(vi.getTimerCount()).toBe(0);
  });
  it('cargar historial no dispara confirmación ni éxito', () => {
    const { actor, update, stop } = setup(); update({ loading: true });
    update({ conversationId: 'history', loading: false, response: reply('old', 'Listo.') });
    vi.advanceTimersByTime(1200); expect(actor.getSnapshot()).toBe('idle'); stop();
  });
  it('sigue pensamiento, respuesta, voz y confirmación de un turno observado', () => {
    const { actor, update, stop } = setup();
    update({ turn: 1, loading: true }); expect(actor.getSnapshot()).toBe('thinking');
    vi.advanceTimersByTime(6000); expect(actor.getSnapshot()).toBe('focused');
    update({ response: reply('new', 'Te explico.'), loading: true }); expect(actor.getSnapshot()).toBe('speaking');
    update({ loading: false, speaking: true }); expect(actor.getSnapshot()).toBe('speaking');
    update({ speaking: false }); expect(actor.getSnapshot()).toBe('acknowledging');
    vi.advanceTimersByTime(2400); expect(actor.getSnapshot()).toBe('idle'); stop();
  });
  it('el primer borrador puede recibir ID sin perder el turno', () => {
    const { actor, update, stop } = setup(); update({ turn: 1, loading: true });
    update({ conversationId: 'persisted', response: reply('new', 'Entendido.'), loading: false });
    expect(actor.getSnapshot()).toBe('acknowledging'); stop();
  });
  it('cambiar organización o conversación descarta el gesto anterior', () => {
    const { actor, update, stop } = setup({ conversationId: 'a' }); update({ turn: 1, loading: true });
    update({ conversationId: 'b', loading: false, response: reply('old', 'Historial') });
    expect(actor.getSnapshot()).toBe('happy');
    update({ scope: 'other-owner:org:course' }); vi.advanceTimersByTime(1200); expect(actor.getSnapshot()).toBe('idle'); stop();
  });
  it('los errores y decisiones pendientes dominan sobre el borrador', () => {
    const { actor, update, stop } = setup({ draft: 'wow!!' });
    update({ error: true }); expect(actor.getSnapshot()).toBe('concerned');
    update({ permission: true }); expect(actor.getSnapshot()).toBe('warning'); stop();
  });
  it('cancelar sin respuesta no celebra resultados', () => {
    const { actor, update, stop } = setup(); update({ turn: 1, loading: true });
    vi.advanceTimersByTime(1300); update({ loading: false }); expect(actor.getSnapshot()).toBe('idle'); stop();
  });
  it('un resultado estructurado de actividad es distinto de una respuesta ordinaria', () => {
    const { actor, update, stop } = setup(); update({ result: { key: 'activity:completed', expression: 'success' } });
    expect(actor.getSnapshot()).toBe('success');
    update({ result: { key: 'activity:retry', expression: 'concerned' } }); expect(actor.getSnapshot()).toBe('concerned'); stop();
  });
});
