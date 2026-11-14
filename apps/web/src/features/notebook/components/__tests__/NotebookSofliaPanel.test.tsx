import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NotebookSofliaPanel } from '../NotebookSofliaPanel'

const api = vi.hoisted(() => ({ ask: vi.fn() }))
vi.mock('../../services/notebook.client.service', () => ({ askNotebookAssistant: api.ask }))
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }))
vi.mock('@/features/business-panel/hooks/useBusinessPanelTheme', () => ({ useBusinessPanelTheme: () => ({}) }))
vi.mock('../NoteContentView', () => ({ NoteContentView: () => <div /> }))
vi.mock('../NoteEnrichmentPanel', () => ({ NoteEnrichmentPanel: () => null }))
vi.mock('@/core/components/SofliaAvatar/useAvatarPlaybackAudio', () => ({ useAvatarPlaybackAudio: () => ({ available: false }) }))

beforeEach(() => { Object.defineProperty(HTMLElement.prototype, 'scrollTo', { configurable: true, value: vi.fn() }) })
afterEach(() => { cleanup(); api.ask.mockReset() })
const defaults = { orgSlug: 'organizacion-a', noteId: 'nota-a', showAnalysis: false, onError: vi.fn() }
function send() {
  fireEvent.change(screen.getByPlaceholderText('soflia.chat.inputPlaceholder'), { target: { value: 'Ayúdame con mi apunte' } })
  fireEvent.click(screen.getByRole('button', { name: 'soflia.chat.send' }))
}
const expression = () => document.querySelector('.soflia-avatar')?.getAttribute('data-expression')

describe('personaje del cuaderno', () => {
  it('espera aprobación y celebra sólo después de aplicar la propuesta', async () => {
    api.ask.mockResolvedValue({ reply: 'Una propuesta para revisar.', proposedContent: '<p>Propuesta</p>' })
    const apply = vi.fn()
    render(<NotebookSofliaPanel {...defaults} onApplyEdit={apply} />)
    expect(document.querySelectorAll('header .soflia-avatar')).toHaveLength(1)
    send()
    await waitFor(() => expect(expression()).toBe('warning'))
    expect(document.querySelectorAll('.soflia-avatar')).toHaveLength(1)
    expect(apply).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'soflia.edit.apply' }))
    expect(apply).toHaveBeenCalledWith('<p>Propuesta</p>')
    await waitFor(() => expect(expression()).toBe('success'))
  })

  it('descarta respuestas tardías al cambiar de apunte', async () => {
    let resolve!: (result: { reply: string }) => void
    api.ask.mockReturnValue(new Promise(done => { resolve = done }))
    const { rerender } = render(<NotebookSofliaPanel {...defaults} />)
    send()
    expect(expression()).toBe('thinking')
    rerender(<NotebookSofliaPanel {...defaults} noteId="nota-b" />)
    await act(async () => { resolve({ reply: 'Respuesta del apunte anterior' }) })
    expect(screen.queryByText('Respuesta del apunte anterior')).toBeNull()
    expect(expression()).toBe('happy')
    expect(screen.getByPlaceholderText('soflia.chat.inputPlaceholder')).toHaveValue('')
  })

  it('muestra preocupación al fallar y no marca una edición como aplicada', async () => {
    api.ask.mockRejectedValue(new Error('Respuesta no disponible'))
    const onError = vi.fn()
    render(<NotebookSofliaPanel {...defaults} onError={onError} />)
    send()
    await waitFor(() => expect(expression()).toBe('concerned'))
    expect(onError).toHaveBeenCalledWith('Respuesta no disponible')
    expect(screen.queryByText('soflia.edit.applied')).toBeNull()
  })
})
