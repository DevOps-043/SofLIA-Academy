import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useAvatarPlaybackAudio } from '../useAvatarPlaybackAudio';
const audio = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock('@/core/services/tts/client/ios-audio-unlock', () => ({ getSharedAudioElement: audio.get }));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); audio.get.mockReset(); });

describe('observación del TTS existente', () => {
  it('no pide micrófono ni cambia el reproductor y libera sólo sus recursos', async () => {
    let frame: FrameRequestCallback | undefined;
    vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => { frame = callback; return 1; }));
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    const captureMic = vi.fn(); Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia: captureMic } });
    const track = { stop: vi.fn() }; const stream = { getTracks: () => [track], getAudioTracks: () => [track] };
    const playing = { captureStream: vi.fn(() => stream), play: vi.fn(), pause: vi.fn(), onended: 'original' };
    audio.get.mockReturnValue(playing);
    const analyser = { fftSize: 2048, frequencyBinCount: 1024, disconnect: vi.fn(),
      getByteTimeDomainData(bytes: Uint8Array) { for (let index = 0; index < bytes.length; index++) bytes[index] = Math.round(128 + Math.sin(index * Math.PI * 2 * 320 / 48000) * 32); },
      getByteFrequencyData(bytes: Uint8Array) { bytes.fill(12); bytes[14] = 220; } };
    const node = { connect: vi.fn(), disconnect: vi.fn() };
    const context = { state: 'running', sampleRate: 48000, close: vi.fn(async () => {}), createMediaStreamSource: vi.fn(() => node), createAnalyser: vi.fn(() => analyser) };
    vi.stubGlobal('AudioContext', function () { return context; });
    const { result, unmount } = renderHook(() => useAvatarPlaybackAudio(true));
    await waitFor(() => expect(result.current.available).toBe(true));
    act(() => frame!(100)); expect(result.current.level.current).toBeGreaterThan(0);
    expect(result.current.features.pitchConfidence.current).toBeGreaterThan(.7);
    expect(captureMic).not.toHaveBeenCalled(); expect(playing.play).not.toHaveBeenCalled(); expect(playing.pause).not.toHaveBeenCalled();
    expect(playing.onended).toBe('original'); unmount();
    expect(node.disconnect).toHaveBeenCalled(); expect(track.stop).toHaveBeenCalled(); expect(context.close).toHaveBeenCalled(); expect(result.current.level.current).toBe(0);
  });
  it('sin captureStream mantiene disponible la reproducción original', () => {
    const player = { play: vi.fn(), pause: vi.fn() }; audio.get.mockReturnValue(player);
    const context = vi.fn(); vi.stubGlobal('AudioContext', context);
    const { result } = renderHook(() => useAvatarPlaybackAudio(true));
    expect(result.current.available).toBe(false); expect(context).not.toHaveBeenCalled(); expect(player.pause).not.toHaveBeenCalled();
  });
  it('una superficie sin voz no crea recursos de audio', () => {
    renderHook(() => useAvatarPlaybackAudio(false)); expect(audio.get).not.toHaveBeenCalled();
  });
});
