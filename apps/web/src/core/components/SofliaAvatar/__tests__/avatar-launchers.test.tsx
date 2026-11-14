import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LiaFloatingButton } from '../../LiaSidePanel/LiaFloatingButton';
import { CourseLiaFloatingButton } from '@/features/courses/components/CourseLia/components/CourseLiaFloatingButton';

const state = vi.hoisted(() => ({ open: false, blocked: false, toggle: vi.fn(), toast: vi.fn() }));
vi.mock('@/core/contexts/LiaPanelContext', () => ({ useLiaPanel: () => ({ isOpen: state.open, togglePanel: state.toggle }) }));
vi.mock('@/lib/utils/motion', () => ({ useMotionSafe: () => ({ disableHeavy: true }) }));
vi.mock('@/features/courses/context/LiaCourseContext', () => ({ useLiaCourse: () => ({ isOpen: state.open, isInteractionBlocked: state.blocked, toggleLia: state.toggle, setLiaToastMessage: state.toast }) }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
beforeEach(() => { state.open = false; state.blocked = false; state.toggle.mockReset(); state.toast.mockReset(); });
afterEach(cleanup);

describe('accesos sin burbuja de SofLIA', () => {
  it('amplía el acceso general y mantiene la apertura por botón', () => {
    render(<LiaFloatingButton />);
    const button = screen.getByRole('button', { name: 'Abrir asistente SofLIA' });
    expect(button).toHaveStyle({ background: 'transparent', boxShadow: 'none' });
    expect(button.parentElement).toHaveStyle({ width: '96px', height: '96px' });
    fireEvent.click(button); expect(state.toggle).toHaveBeenCalledOnce();
  });
  it('el acceso del curso conserva el bloqueo de actividades con el nuevo diseño', () => {
    state.blocked = true;
    render(<CourseLiaFloatingButton />);
    const button = screen.getByRole('button', { name: 'lia.openAssistant' });
    expect(button).toHaveStyle({ background: 'transparent', boxShadow: 'none' });
    expect(button.parentElement).toHaveStyle({ width: '96px' });
    fireEvent.click(button);
    expect(state.toggle).not.toHaveBeenCalled(); expect(state.toast).toHaveBeenCalledWith('lia.warningDisabledActivities');
  });
});
