/* eslint-disable no-restricted-syntax -- @react-pdf/renderer no admite clases Tailwind
   ni CSS variables: el StyleSheet del PDF requiere colores hex literales. */
import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'

import type {
  ForensicAnalysis,
  ForensicAnalysisItem,
  ForensicRuling,
  UserForensicSummary,
} from '../user-forensics.types'

export interface ForensicReportPdfProps {
  analysis: ForensicAnalysis
  summary: UserForensicSummary
  userLabel: string
  userEmail: string | null
  generatedAtLabel: string
}

const COLORS = {
  primary: '#0A2540',
  accent: '#00A896',
  text: '#1E2329',
  muted: '#6C757D',
  border: '#E3E8EF',
  cumple: '#10B981',
  cumple_con_observaciones: '#F59E0B',
  no_cumple: '#EF4444',
  warnBg: '#FFF7ED',
  infoBg: '#F1F5F9',
}

const styles = StyleSheet.create({
  page: { paddingTop: 42, paddingBottom: 54, paddingHorizontal: 44, fontSize: 9.5, color: COLORS.text, fontFamily: 'Helvetica' },
  eyebrow: { fontSize: 8, letterSpacing: 1.5, color: COLORS.accent, textTransform: 'uppercase', fontFamily: 'Helvetica-Bold' },
  title: { fontSize: 20, color: COLORS.primary, fontFamily: 'Helvetica-Bold', marginTop: 2 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 6, marginBottom: 14 },
  metaItem: { fontSize: 8.5, color: COLORS.muted },
  verdictBox: { borderRadius: 6, padding: 12, marginBottom: 16, borderWidth: 1 },
  verdictLabel: { fontSize: 8, letterSpacing: 1, textTransform: 'uppercase', color: '#FFFFFF', fontFamily: 'Helvetica-Bold' },
  verdictRuling: { fontSize: 16, color: '#FFFFFF', fontFamily: 'Helvetica-Bold', marginTop: 2 },
  verdictRationale: { fontSize: 9, color: '#FFFFFF', marginTop: 6, lineHeight: 1.4 },
  sectionTitle: { fontSize: 11, color: COLORS.primary, fontFamily: 'Helvetica-Bold', marginTop: 14, marginBottom: 6, paddingBottom: 3, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  paragraph: { fontSize: 9.5, lineHeight: 1.5, color: COLORS.text, marginBottom: 4 },
  item: { marginBottom: 5, paddingLeft: 8, borderLeftWidth: 2, borderLeftColor: COLORS.border },
  itemDanger: { borderLeftColor: COLORS.no_cumple },
  itemWarning: { borderLeftColor: COLORS.cumple_con_observaciones },
  itemTitle: { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: COLORS.text },
  itemDetail: { fontSize: 9, color: COLORS.muted, lineHeight: 1.4, marginTop: 1 },
  bullet: { fontSize: 9.5, marginBottom: 3, lineHeight: 1.4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  cell: { width: '31%', borderWidth: 1, borderColor: COLORS.border, borderRadius: 4, padding: 7 },
  cellLabel: { fontSize: 7.5, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  cellValue: { fontSize: 9, color: COLORS.text, fontFamily: 'Helvetica-Bold', marginTop: 2, lineHeight: 1.3 },
  footer: { position: 'absolute', bottom: 26, left: 44, right: 44, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 6, fontSize: 7.5, color: COLORS.muted },
})

const RULING_LABEL: Record<ForensicRuling, string> = {
  cumple: 'CUMPLE',
  cumple_con_observaciones: 'CUMPLE CON OBSERVACIONES',
  no_cumple: 'NO CUMPLE',
}

function itemStyle(severity?: ForensicAnalysisItem['severity']) {
  if (severity === 'danger') return [styles.item, styles.itemDanger]
  if (severity === 'warning') return [styles.item, styles.itemWarning]
  return styles.item
}

function ItemList({ items }: { items: ForensicAnalysisItem[] }) {
  if (items.length === 0) return <Text style={styles.itemDetail}>—</Text>
  return (
    <View>
      {items.map((item, index) => (
        <View key={index} style={itemStyle(item.severity)} wrap={false}>
          <Text style={styles.itemTitle}>{item.title}</Text>
          <Text style={styles.itemDetail}>{item.detail}</Text>
        </View>
      ))}
    </View>
  )
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.cell}>
      <Text style={styles.cellLabel}>{label}</Text>
      <Text style={styles.cellValue}>{value}</Text>
    </View>
  )
}

export function ForensicReportPdfDocument({
  analysis,
  summary,
  userLabel,
  userEmail,
  generatedAtLabel,
}: ForensicReportPdfProps) {
  const agg = summary.aggregates
  const ruling = analysis.verdict.ruling

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.eyebrow}>SofLIA Academy · Auditoría forense</Text>
        <Text style={styles.title}>Dictamen Pericial y Forense</Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaItem}>Usuario: {userLabel}</Text>
          {userEmail ? <Text style={styles.metaItem}>Email: {userEmail}</Text> : null}
          <Text style={styles.metaItem}>
            Organización: {summary.identity.organizationNames.length ? summary.identity.organizationNames.join(', ') : '—'}
          </Text>
          <Text style={styles.metaItem}>Generado: {generatedAtLabel}</Text>
        </View>

        <View
          style={[styles.verdictBox, { backgroundColor: COLORS[ruling], borderColor: COLORS[ruling] }]}
          wrap={false}
        >
          <Text style={styles.verdictLabel}>Dictamen · Confianza {analysis.verdict.confidence}</Text>
          <Text style={styles.verdictRuling}>{RULING_LABEL[ruling]}</Text>
          <Text style={styles.verdictRationale}>{analysis.verdict.rationale}</Text>
        </View>

        <Text style={styles.sectionTitle}>Resumen ejecutivo</Text>
        <Text style={styles.paragraph}>{analysis.executiveSummary}</Text>

        <Text style={styles.sectionTitle}>Análisis de conducta</Text>
        <Text style={styles.paragraph}>{analysis.behaviorAnalysis}</Text>

        <Text style={styles.sectionTitle}>Registros de la auditoría</Text>
        <View style={styles.grid}>
          <Cell label="Eventos totales" value={String(summary.totalEvents)} />
          <Cell label="Primera actividad" value={summary.firstActivityAtUtc ? `${summary.firstActivityAtUtc.slice(0, 16).replace('T', ' ')} UTC` : '—'} />
          <Cell label="Última actividad real" value={summary.derivedLastActivityAtUtc ? `${summary.derivedLastActivityAtUtc.slice(0, 16).replace('T', ' ')} UTC` : '—'} />
          <Cell label="Accesos / IPs / dispositivos" value={`${agg.access.totalLogins} / ${agg.access.distinctIps} / ${agg.access.distinctDevices}`} />
          <Cell label="Cursos (inscrito / completado)" value={`${agg.courses.enrolled} / ${agg.courses.completed}`} />
          <Cell label="Certificados" value={String(agg.courses.certificatesIssued)} />
          <Cell label="Lecciones (inició / completó)" value={`${agg.lessons.started} / ${agg.lessons.completed}`} />
          <Cell label="Minutos de video reproducidos" value={`${agg.lessons.totalVideoMinutes} min`} />
          <Cell label="Videos vistos / acelerados / sin ver" value={`${agg.lessons.videosWatchedFull} / ${agg.lessons.videosSpedUp} / ${agg.lessons.videosBarelyWatched}`} />
          <Cell label="Velocidad máx. de video" value={agg.lessons.maxPlaybackRate ? `${agg.lessons.maxPlaybackRate}x` : '—'} />
          <Cell label="Diálogos SofLIA (hechos / disponibles)" value={`${agg.dialogues.total} / ${agg.dialogues.available}`} />
          <Cell label="Diálogos (completados / abandonados)" value={`${agg.dialogues.completed} / ${agg.dialogues.abandoned}`} />
          <Cell label="Diálogos: puntaje promedio" value={agg.dialogues.averageScore !== null ? String(agg.dialogues.averageScore) : '—'} />
          <Cell label="Quiz: intentos / máx en uno" value={`${agg.quizzes.totalAttempts} / ${agg.quizzes.maxAttemptsOnSingleQuiz}`} />
          <Cell label="Accesos (total / concurrentes)" value={`${agg.access.totalLogins} / ${agg.access.concurrentSessions}`} />
          <Cell label="Actividades (enviadas / validadas)" value={`${agg.activities.submitted} / ${agg.activities.validated}`} />
        </View>

        <Text style={styles.sectionTitle}>Hallazgos</Text>
        <ItemList items={analysis.findings} />

        <Text style={styles.sectionTitle}>Riesgos y complicaciones</Text>
        <ItemList items={analysis.risks} />

        <Text style={styles.sectionTitle}>Indicios de mal uso</Text>
        <ItemList items={analysis.misuseIndicators} />

        <Text style={styles.sectionTitle}>Recomendaciones</Text>
        {analysis.recommendations.length ? (
          analysis.recommendations.map((rec, index) => (
            <Text key={index} style={styles.bullet}>
              • {rec}
            </Text>
          ))
        ) : (
          <Text style={styles.itemDetail}>—</Text>
        )}

        <Text style={styles.footer} fixed>
          Documento generado automáticamente por SofLIA Academy. Marcas de tiempo en UTC.
          {analysis.fallbackUsed ? ' Análisis determinista de respaldo (IA no disponible).' : ''} Confidencial · uso interno de auditoría.
        </Text>
      </Page>
    </Document>
  )
}
