import { createRoot } from 'react-dom/client';
import React, { useEffect, useRef, useState } from 'react';
import i18n from 'i18next';
import { initReactI18next, useTranslation } from 'react-i18next';
import { SofliaChatProvider, SofliaChatAvatar, SofliaComposerPresence } from '@/core/components/SofliaAvatar/SofliaChatProvider';
import { SofliaAvatar } from '@/core/components/SofliaAvatar/SofliaAvatar';
import { AVATAR_EXPRESSIONS, type AvatarExpression } from '@/core/components/SofliaAvatar/avatar-model';
import { getSharedAudioElement } from '@/core/services/tts/client/ios-audio-unlock';
import { PanelHeader } from '@/core/components/LiaSidePanel/PanelHeader';
import { MessagesDisplay } from '@/core/components/LiaSidePanel/MessagesDisplay';
import { InputArea } from '@/core/components/LiaSidePanel/InputArea';
import { CourseLiaHeader } from '@/features/courses/components/CourseLia/components/CourseLiaHeader';
import { CourseLiaMessages } from '@/features/courses/components/CourseLia/components/CourseLiaMessages';
import { CourseLiaInput } from '@/features/courses/components/CourseLia/components/CourseLiaInput';
import { NotebookSofliaPanel } from '@/features/notebook/components/NotebookSofliaPanel';
import { DESIGN_HEX_COLOR as colors } from '@/core/theme/color-tokens';
import panelStyles from '@/core/components/LiaSidePanel/LiaSidePanel.module.css';
import courseStyles from '@/features/courses/components/CourseLia/CourseLiaPanel.module.css';
import commonEs from '../../../apps/web/public/locales/es/common.json';
import commonEn from '../../../apps/web/public/locales/en/common.json';
import commonPt from '../../../apps/web/public/locales/pt/common.json';
import learn from '../../../apps/web/public/locales/es/learn.json';
import notebook from '../../../apps/web/public/locales/es/notebook.json';
import '../../../apps/web/src/app/globals.css';
import '../../../apps/web/src/app/styles/globals/index.css';
import './preview.css';
void i18n.use(initReactI18next).init({ lng: 'es', fallbackLng: 'es', interpolation: { escapeValue: false }, resources: { es: { common: commonEs, learn, notebook }, en: { common: commonEn, learn, notebook }, pt: { common: commonPt, learn, notebook } } });
const noop = () => {};

function Panel({ course, dark, mode, history, audioSpeaking }: { course?: boolean; dark: boolean; mode: AvatarExpression; history: boolean; audioSpeaking: boolean }) {
  const { t } = useTranslation('common'); const [input, setInput] = useState(''); const field = useRef<HTMLTextAreaElement>(null);
  const end = useRef<HTMLDivElement>(null); const container = useRef<HTMLDivElement>(null); const options = useRef<HTMLDivElement>(null);
  const messages = history ? [{ id: '1', role: 'user' as const, content: '¿Cómo puedo aplicar lo que aprendí?', timestamp: new Date(0) }, { id: '2', role: 'assistant' as const, content: 'Podemos empezar con un ejemplo de tu trabajo y construir una solución paso a paso.', timestamp: new Date(0) }] : [];
  const loading = mode === 'thinking' || mode === 'focused';
  const theme = { panelBg: dark ? colors.bgDark : colors.bgLight, headerBg: dark ? colors.bgDark : colors.bgLight, borderColor: dark ? colors.gray800 : colors.gray200, messageBubbleAssistant: dark ? colors.gray800 : colors.gray50, messageBubbleUser: colors.primary, textPrimary: dark ? colors.white : colors.primary, textSecondary: dark ? colors.gray200 : colors.gray500, inputBg: dark ? colors.gray800 : colors.white, inputBorder: dark ? colors.gray800 : colors.gray200, accentColor: colors.accent, primaryAction: colors.primary };
  const variables = Object.fromEntries(Object.entries({ 'panel-bg': theme.panelBg, 'header-bg': theme.headerBg, border: theme.borderColor, accent: theme.accentColor, text: theme.textPrimary, muted: theme.textSecondary, 'user-bubble': theme.messageBubbleUser, 'assistant-bubble': theme.messageBubbleAssistant, 'on-user': colors.white, 'input-bg': theme.inputBg, 'input-border': theme.inputBorder }).map(([key, value]) => ['--lia-' + key, value]));
  const courseVariables = { '--course-lia-panel': theme.panelBg, '--course-lia-border': theme.borderColor, '--course-lia-accent': theme.accentColor, '--course-lia-text': theme.textPrimary, '--course-lia-muted': theme.textSecondary, '--course-lia-input': theme.inputBg, '--course-lia-input-border': theme.inputBorder, '--course-lia-assistant-bubble': theme.messageBubbleAssistant, '--course-lia-user-bubble': theme.messageBubbleUser, '--course-lia-primary': colors.primary };
  const result = ['success','warning','curious','confused','happy','acknowledging','sleeping','surprised','concerned'].includes(mode) ? { key: mode, expression: mode } : undefined;
  return <section data-qa-surface={course ? 'course' : 'general'}>
    <p className="qa-heading">{course ? 'Dentro del curso' : 'Chat general'}</p>
    <SofliaChatProvider scope={course ? 'course' : 'general'} draft={input} loading={loading} speaking={!course && audioSpeaking} listening={mode === 'listening'} result={result}>
      <div className={`${course ? courseStyles.panel : panelStyles.panel} qa-frame`} style={{ ...variables, ...courseVariables } as React.CSSProperties}>
        {course ? <CourseLiaHeader isSpeaking={audioSpeaking} isVoiceEnabled={false} isVoiceTogglePending={false} onClearHistory={noop} onClose={noop} onToggleVoice={noop} /> : <PanelHeader t={t} themeColors={theme} isLightTheme={!dark} isSpeaking={audioSpeaking} isVoiceEnabled={false} toggleVoiceEnabled={noop} isVoiceTogglePending={false} showHistory={false} closeHistory={noop} setShowHistory={noop} isOptionsMenuOpen={false} setIsOptionsMenuOpen={noop} optionsMenuRef={options} setIsPersonalizationOpen={noop} clearHistory={noop} messages={messages} closePanel={noop} setIsAvatarExpanded={noop} />}
        {course ? <CourseLiaMessages copiedMessageId={null} editInputRef={field} editingMessageId={null} editingValue="" isDarkMode={dark} isLoading={loading} lessonTitle="De la idea a la práctica" messages={messages} messagesEndRef={end} onCancelEditing={noop} onCopyMessage={noop} onEditKeyDown={noop} onLinkClick={noop} onStartEditing={noop} onSubmitEditedMessage={noop} setEditingValue={noop} stop={noop} themeColors={theme} /> : <MessagesDisplay messages={messages} isLoading={loading} typewriterReveal={{ messageId: null, length: 0, isTyping: false }} currentTip="Tus ideas tienen un lugar para empezar." themeColors={theme} isLightTheme={!dark} isDarkMode={dark} handleLinkClick={noop} quickActions={[]} handleQuickAction={noop} messagesEndRef={end} chatContainerRef={container} handleChatScroll={noop} />}
        {history && <SofliaComposerPresence />}
        {course ? <CourseLiaInput inputRef={field} inputValue={input} isInteractionBlocked={false} isLightTheme={!dark} isListening={false} isMobile={false} onInputChange={setInput} onKeyDown={noop} onPrimaryAction={noop} primaryActionLabel="Enviar" primaryActionMode="send" setVoiceError={noop} themeColors={theme} voiceError={null} /> : <InputArea t={t} themeColors={theme} isLightTheme={!dark} inputValue={input} setInputValue={setInput} inputRef={field} isDictating={false} isDictationEnabled={false} isVoiceEnabled={false} isLiveVoiceConnecting={false} isProcessingDictation={false} interimTranscript="" finalTranscript="" stopDictation={noop} toggleDictation={noop} toggleLiveVoice={noop} handleSendMessage={noop} isResponding={loading} />}
      </div>
    </SofliaChatProvider>
  </section>;
}
function App() {
  const [dark, setDark] = useState(true); const [mode, setMode] = useState<AvatarExpression>('idle'); const [history, setHistory] = useState(false); const [audioSpeaking, setAudioSpeaking] = useState(false);
  useEffect(() => { getSharedAudioElement(); }, []);
  useEffect(() => { document.documentElement.classList.toggle('dark', dark); document.documentElement.classList.toggle('light', !dark); }, [dark]);
  const playSample = async () => {
    const rate = 24000; const duration = 3; const buffer = new ArrayBuffer(44 + rate * duration * 2); const view = new DataView(buffer);
    const word = (at: number, value: string) => [...value].forEach((char, i) => view.setUint8(at + i, char.charCodeAt(0)));
    word(0, 'RIFF'); view.setUint32(4, buffer.byteLength - 8, true); word(8, 'WAVE'); word(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true); view.setUint32(24, rate, true); view.setUint32(28, rate * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true); word(36, 'data'); view.setUint32(40, buffer.byteLength - 44, true);
    for (let n = 0; n < rate * duration; n++) view.setInt16(44 + n * 2, Math.sin(n * Math.PI * 2 * 320 / rate) * (Math.sin(n / rate * 12) > -.3 ? .2 : .01) * 32767, true);
    const audio = getSharedAudioElement()!; const url = URL.createObjectURL(new Blob([buffer], { type: 'audio/wav' })); audio.src = url; audio.onended = () => { setAudioSpeaking(false); URL.revokeObjectURL(url); }; await audio.play(); setAudioSpeaking(true);
  };
  return <main><header className="qa-controls"><strong>SofLIA Academy · QA local</strong><label><input type="checkbox" checked={dark} onChange={event => setDark(event.target.checked)} /> Tema oscuro</label><label><input type="checkbox" checked={history} onChange={event => setHistory(event.target.checked)} /> Con conversación</label><select aria-label="Escenario simulado" value={mode} onChange={event => setMode(event.target.value as AvatarExpression)}>{AVATAR_EXPRESSIONS.map(expression => <option key={expression} value={expression}>{expression}</option>)}</select><button onClick={() => void playSample()}>Audio local de prueba</button><button onClick={() => void i18n.changeLanguage(i18n.language === 'es' ? 'en' : i18n.language === 'en' ? 'pt' : 'es')}>Cambiar idioma</button></header>
    <div className="qa-grid"><Panel dark={dark} mode={mode} history={history} audioSpeaking={audioSpeaking} /><Panel course dark={dark} mode={mode} history={history} audioSpeaking={false} /><section data-qa-surface="notebook"><p className="qa-heading">Cuaderno de aprendizaje</p><NotebookSofliaPanel orgSlug="qa-local" noteId="nota-local" showAnalysis={false} onApplyEdit={noop} onError={noop} /></section></div>
    <div className="qa-expressions">{AVATAR_EXPRESSIONS.map(expression => <div key={expression}><div style={{ width: 160, height: 160 }}><SofliaAvatar state={expression} /></div><span>{expression}</span></div>)}</div>
  </main>;
}
createRoot(document.getElementById('root')!).render(<App />);
