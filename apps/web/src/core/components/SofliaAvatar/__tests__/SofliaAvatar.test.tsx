import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createRef, StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SofliaAvatar, type SofliaAvatarHandle } from '../SofliaAvatar';
import { AVATAR_EXPRESSIONS } from '../avatar-model';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

let pending: Map<number, FrameRequestCallback>;
let sequence: number;
let now: number;
let reduced: boolean;
let hidden: boolean;
let intersection: IntersectionObserverCallback;
let mediaChange: () => void;
const removedMedia = vi.fn();
const disconnected = vi.fn();
function advance(milliseconds = 16) {
  now += milliseconds;
  const callbacks = [...pending.values()]; pending.clear();
  act(() => { for (const callback of callbacks) callback(now); });
}
function advanceFrames(count: number) { for (let index = 0; index < count; index++) advance(); }
function avatar() { return screen.getByRole('img'); }
function css(name: string) { return parseFloat(avatar().style.getPropertyValue(`--avatar-${name}`)); }

beforeEach(() => {
  delete document.documentElement.dataset.reduceMotion;
  pending = new Map(); sequence = 0; now = 0; reduced = false; hidden = false;
  vi.spyOn(performance, 'now').mockImplementation(() => now);
  vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => { pending.set(++sequence, callback); return sequence; }));
  vi.stubGlobal('cancelAnimationFrame', vi.fn((id: number) => { pending.delete(id); }));
  vi.stubGlobal('matchMedia', vi.fn(() => ({ get matches() { return reduced; }, addEventListener: vi.fn((_event, callback) => { mediaChange = callback; }), removeEventListener: removedMedia })));
  vi.stubGlobal('IntersectionObserver', class {
    constructor(callback: IntersectionObserverCallback) { intersection = callback; }
    observe = vi.fn(); disconnect = disconnected;
  });
  vi.stubGlobal('ResizeObserver', class { observe = vi.fn(); disconnect = disconnected; });
  vi.spyOn(document, 'hidden', 'get').mockImplementation(() => hidden);
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, width: 200, height: 200, x: 0, y: 0, right: 200, bottom: 200, toJSON: () => ({}) });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); removedMedia.mockClear(); disconnected.mockClear(); });

describe('avatar original compuesto en 2D', () => {
  it('muestra las letras de sueño fuera del cuerpo y del visor sólo al dormir', () => {
    const { rerender } = render(<SofliaAvatar state="sleeping" />);
    const cues = avatar().querySelector('.soflia-avatar__sleep-cues')!;
    expect(cues.querySelectorAll('span')).toHaveLength(3);
    expect(cues.closest('.soflia-avatar__rig')).toBeNull();
    expect(cues.closest('.soflia-avatar__expression')).toBeNull();
    rerender(<SofliaAvatar state="idle" />); expect(avatar().querySelector('.soflia-avatar__sleep-cues')).toBeNull();
  });
  it('conserva la pose al cambiar de expresión y enlaza el siguiente fotograma sin salto', () => {
    const { rerender } = render(<SofliaAvatar state="curious" />);
    advanceFrames(60);
    const before = { float: css('float'), sway: css('sway'), drift: css('drift') };
    rerender(<SofliaAvatar state="happy" />);
    expect(css('float')).toBe(before.float); expect(css('sway')).toBe(before.sway); expect(css('drift')).toBe(before.drift);
    advance();
    expect(Math.abs(css('float') - before.float)).toBeLessThan(.5);
    expect(Math.abs(css('sway') - before.sway)).toBeLessThan(.5);
    expect(pending.size).toBe(1);
  });
  it('agrupa eventos rápidos del puntero en una lectura de geometría por fotograma', () => {
    render(<SofliaAvatar />);
    const bounds = vi.mocked(HTMLElement.prototype.getBoundingClientRect); bounds.mockClear();
    fireEvent.pointerMove(window, { clientX: 220, clientY: 102 });
    fireEvent.pointerMove(window, { clientX: 230, clientY: 102 });
    fireEvent.pointerMove(window, { clientX: 240, clientY: 102 });
    expect(bounds).not.toHaveBeenCalled();
    advance(); expect(bounds).toHaveBeenCalledTimes(1);
  });
  it.each(AVATAR_EXPRESSIONS)('mantiene el gesto de %s sin cursor, voz ni acción', expression => {
    render(<SofliaAvatar state={expression} />);
    advanceFrames(20); const before = css('float');
    advanceFrames(30); expect(css('float')).not.toBe(before);
    expect(css('energy')).toBe(0); expect(pending.size).toBe(1);
  });
  it('asiente arriba y abajo por varios ciclos y confirma sin palomita', () => {
    render(<SofliaAvatar state="acknowledging" />);
    expect(avatar().querySelector('.avatar-face__ack-badge')).toBeNull();
    const positions: number[] = [];
    for (let index = 0; index < 330; index++) {
      advance(); positions.push(css('face-lift'));
      expect(css('sway')).toBe(0); expect(css('drift')).toBe(0);
      expect(Math.abs(css('float'))).toBeLessThan(1);
    }
    expect(Math.max(...positions.slice(170))).toBeGreaterThan(4);
    expect(Math.min(...positions.slice(170))).toBeLessThan(-4);
  });
  it('usa pantalla plana y símbolos propios para los catorce estados, sin parches de ojos rasterizados', () => {
    const { rerender } = render(<SofliaAvatar />);
    const shapes = new Set<string>();
    for (const state of AVATAR_EXPRESSIONS) {
      rerender(<SofliaAvatar state={state} />);
      shapes.add(avatar().querySelector('.avatar-face')!.innerHTML);
      expect(avatar().querySelectorAll('img')).toHaveLength(2);
      expect(avatar().querySelector('.soflia-avatar__eyelid')).toBeNull();
    }
    expect(shapes.size).toBe(14);
  });
  it('mueve sólo la mirada suavemente desde fuera del componente y retorna al alejarse', () => {
    render(<SofliaAvatar />);
    fireEvent.pointerMove(window, { clientX: 250, clientY: 102 }); advanceFrames(20);
    expect(css('gaze-x')).toBeGreaterThan(1.2); expect(css('gaze-x')).toBeLessThanOrEqual(2.7);
    const previous = css('gaze-x');
    fireEvent.pointerMove(window, { clientX: 1000, clientY: 102 }); advance();
    expect(css('gaze-x')).toBeLessThan(previous); expect(css('gaze-x')).toBeGreaterThan(0);
    advanceFrames(100); expect(css('gaze-x')).toBeCloseTo(0, 3);
    expect(avatar().querySelector('canvas')).toBeNull();
  });
  it('recibe amplitud real por ref sin re-render y funciona sin audio', () => {
    const audio = { current: 0 };
    const { rerender } = render(<SofliaAvatar state="speaking" audioLevel={audio} />);
    advanceFrames(15); expect(css('energy')).toBe(0);
    audio.current = .8; advanceFrames(30); expect(css('energy')).toBeCloseTo(.8, 2);
    audio.current = NaN; advanceFrames(40); expect(css('energy')).toBeCloseTo(0, 2);
    rerender(<SofliaAvatar state="idle" audioLevel={audio} />); audio.current = 1;
    advanceFrames(30); expect(css('energy')).toBe(0);
  });
  it('mueve el rostro y distribuye la onda según registro y bandas reales', () => {
    const level = { current: .7 }; const tone = { current: .15 };
    const bands = { current: new Float32Array([.8, .8, .6, .1, .1, 0, 0, 0]) };
    render(<SofliaAvatar state="listening" audioLevel={level} audioFeatures={{ tone, bands }} />);
    advanceFrames(55);
    const lowTilt = css('face-tilt');
    expect(css('wave-0')).toBeGreaterThan(css('wave-4'));
    tone.current = .9; bands.current = new Float32Array([0, 0, .1, .1, .2, .7, .8, .9]);
    advanceFrames(45);
    expect(css('wave-4')).toBeGreaterThan(css('wave-0'));
    expect(css('face-tilt')).toBeGreaterThan(lowTilt);
    expect(css('tone')).toBeGreaterThan(.85);
  });
  it('articula una boca amplia por audio, cambia forma y cierra al pausar', () => {
    const level = { current: .9 }; const tone = { current: .15 };
    const bands = { current: new Float32Array([.8, .8, .6, .2, .1, 0, 0, 0]) };
    render(<SofliaAvatar state="speaking" audioLevel={level} audioFeatures={{ tone, bands }} />);
    advanceFrames(45);
    const mouth = avatar().querySelector('.avatar-face__mouth')!;
    const rounded = mouth.getAttribute('d');
    expect(css('mouth-open')).toBeGreaterThan(.8);
    tone.current = .9; bands.current = new Float32Array([0, 0, .1, .5, .8, .8, .8, .8]);
    advanceFrames(45); expect(mouth.getAttribute('d')).not.toBe(rounded);
    level.current = 0; advanceFrames(90); expect(css('mouth-open')).toBeLessThan(.01);
  });
  it('recalcula el rostro cuando un ancestro cambia de posición o transformación', () => {
    render(<SofliaAvatar />);
    vi.mocked(HTMLElement.prototype.getBoundingClientRect).mockReturnValue({ left: 500, top: 300, width: 200, height: 200, x: 500, y: 300, right: 700, bottom: 500, toJSON: () => ({}) });
    fireEvent.pointerMove(window, { clientX: 750, clientY: 402 }); advanceFrames(30);
    expect(css('gaze-x')).toBeGreaterThan(1);
  });
  it('ejecuta parpadeo, asentimiento y reset y cancela gestos ante prioridad', () => {
    const ref = createRef<SofliaAvatarHandle>();
    const { rerender } = render(<SofliaAvatar ref={ref} />);
    act(() => { ref.current!.blink(); ref.current!.nod(); ref.current!.setGazeTarget(1, -1); });
    advance(); advance(64);
    expect(css('blink')).toBeLessThan(.5); expect(css('nod')).not.toBe(0);
    act(() => ref.current!.reset()); advance(); expect(css('blink')).toBe(1);
    rerender(<SofliaAvatar ref={ref} state="warning" />);
    act(() => { ref.current!.setExpression('happy'); ref.current!.blink(); ref.current!.nod(); }); advanceFrames(20);
    expect(avatar()).toHaveAttribute('data-expression', 'warning'); expect(css('nod')).toBe(0); expect(css('gaze-x')).toBe(0);
    rerender(<SofliaAvatar ref={ref} state="idle" />);
    act(() => ref.current!.setExpression('curious')); expect(avatar()).toHaveAttribute('data-expression', 'curious');
    act(() => ref.current!.reset()); expect(avatar()).toHaveAttribute('data-expression', 'idle');
    advanceFrames(30); expect(css('gaze-x')).toBe(0);
  });
  it('no recupera una expresión imperativa antigua después de otra fase', () => {
    const ref = createRef<SofliaAvatarHandle>();
    const { rerender } = render(<SofliaAvatar ref={ref} />);
    act(() => ref.current!.setExpression('happy'));
    rerender(<SofliaAvatar ref={ref} state="thinking" />); rerender(<SofliaAvatar ref={ref} />);
    expect(avatar()).toHaveAttribute('data-expression', 'idle');
  });
  it('mantiene la reactividad de voz cuando la ventana flotante pierde foco', () => {
    render(<SofliaAvatar state="speaking" audioLevel={{ current: .7 }} />);
    fireEvent.blur(window); advanceFrames(30);
    expect(css('energy')).toBeCloseTo(.7, 2); expect(pending.size).toBe(1);
  });
  it('pausa por movimiento reducido, invisibilidad y preferencia explícita; mantiene voz sin foco', () => {
    const { rerender } = render(<SofliaAvatar />); expect(pending.size).toBe(1);
    act(() => { reduced = true; mediaChange(); }); expect(pending.size).toBe(0); expect(avatar()).toHaveAttribute('data-running', 'false');
    act(() => { reduced = false; mediaChange(); }); expect(pending.size).toBe(1);
    act(() => intersection([{ isIntersecting: false }] as IntersectionObserverEntry[], {} as IntersectionObserver)); expect(pending.size).toBe(0);
    act(() => intersection([{ isIntersecting: true }] as IntersectionObserverEntry[], {} as IntersectionObserver)); expect(pending.size).toBe(1);
    fireEvent.blur(window); expect(pending.size).toBe(1); fireEvent.focus(window); expect(pending.size).toBe(1);
    act(() => { hidden = true; document.dispatchEvent(new Event('visibilitychange')); }); expect(pending.size).toBe(0);
    act(() => { hidden = false; document.dispatchEvent(new Event('visibilitychange')); }); expect(pending.size).toBe(1);
    rerender(<SofliaAvatar motionEnabled={false} />); expect(pending.size).toBe(0);
  });
  it('StrictMode conserva un solo bucle y desmontar libera listeners y observers', () => {
    const remove = vi.spyOn(window, 'removeEventListener');
    const { unmount } = render(<StrictMode><SofliaAvatar /></StrictMode>);
    expect(pending.size).toBe(1); advance(); expect(pending.size).toBe(1);
    unmount(); expect(pending.size).toBe(0); expect(disconnected).toHaveBeenCalled(); expect(removedMedia).toHaveBeenCalled();
    expect(remove).toHaveBeenCalledWith('pointermove', expect.any(Function));
  });
  it('respeta el guard de rendimiento central de Academy', async () => {
    render(<SofliaAvatar />); expect(pending.size).toBe(1);
    await act(async () => { document.documentElement.dataset.reduceMotion = 'true'; });
    expect(pending.size).toBe(0); expect(avatar()).toHaveAttribute('data-running', 'false');
    await act(async () => { delete document.documentElement.dataset.reduceMotion; });
    expect(pending.size).toBe(1);
  });

});
