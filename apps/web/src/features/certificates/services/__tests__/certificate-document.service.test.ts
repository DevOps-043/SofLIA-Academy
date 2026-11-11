import { describe, expect, it } from 'vitest'
import {
  buildCertificateDocumentModel,
  buildCertificateFileName,
  buildCertificateSnapshots,
  shouldRebuildSnapshots,
} from '@/features/certificates/services/certificate-document.service'

describe('certificate-document.service', () => {
  it('builds immutable snapshots with SofLIA platform branding and issuer program text', () => {
    const { brandingSnapshot, documentSnapshot } = buildCertificateSnapshots({
      organizationId: 'org-1',
      organizationName: 'Board Ready',
      organizationLogoUrl: 'https://cdn.example.com/board-ready.png',
      organizationPrimaryColor: 'var(--color-legacy-102a43)',
      organizationAccentColor: 'var(--color-legacy-2cb1bc)',
      organizationSecondaryColor: 'var(--color-legacy-d9e2ec)',
      templateId: 'template-1',
      templateDesignConfig: null,
      learnerName: 'Israel Martínez',
      courseTitle: 'IA para líderes',
      instructorName: 'Ana Sofía',
      instructorSignatureUrl: 'https://cdn.example.com/signature.png',
      instructorSignatureName: 'Ana Sofía',
      issuedAt: '2026-04-11T18:00:00.000Z',
    })

    expect(brandingSnapshot.platform.name).toBe('SofLIA Academy')
    expect(brandingSnapshot.platform.logoUrl).toContain('/icono.png')
    expect(brandingSnapshot.issuer.name).toBe('Board Ready')
    expect(documentSnapshot.programText).toBe(
      'Forma parte del programa de capacitación de Board Ready',
    )
    expect(brandingSnapshot.legacyMode).toBe(false)
  })

  it('creates a document model with a public verification url and sanitized file name', () => {
    const { brandingSnapshot, documentSnapshot } = buildCertificateSnapshots({
      organizationId: null,
      organizationName: null,
      organizationLogoUrl: null,
      organizationPrimaryColor: null,
      organizationAccentColor: null,
      organizationSecondaryColor: null,
      templateId: null,
      templateDesignConfig: null,
      learnerName: 'Israel Martínez',
      courseTitle: 'IA para líderes: ChatGPT y evidencia',
      instructorName: 'Ana Sofía',
      instructorSignatureUrl: null,
      instructorSignatureName: null,
      issuedAt: '2026-04-11T18:00:00.000Z',
    })

    const model = buildCertificateDocumentModel({
      certificateId: 'certificate-1',
      certificateHash: 'hash-1',
      certificateUrl: 'https://storage.example.com/certificate-1.pdf',
      issuedAt: '2026-04-11T18:00:00.000Z',
      expiresAt: null,
      courseId: 'course-1',
      courseSlug: 'ia-lideres',
      enrollmentId: 'enrollment-1',
      brandingSnapshot,
      documentSnapshot,
    })

    expect(model.verificationUrl).toContain('/certificates/verify/hash-1')
    expect(model.fileName).toBe('ia_para_lideres_chatgpt_y_evidencia_certificado.pdf')
  })

  it('requests a rebuild when legacy snapshots are missing the required SofLIA copy', () => {
    const { brandingSnapshot, documentSnapshot } = buildCertificateSnapshots({
      organizationId: 'org-1',
      organizationName: 'Pulse Hub',
      organizationLogoUrl: null,
      organizationPrimaryColor: null,
      organizationAccentColor: null,
      organizationSecondaryColor: null,
      templateId: null,
      templateDesignConfig: null,
      learnerName: 'Israel Martínez',
      courseTitle: 'Curso',
      instructorName: 'Ana Sofía',
      instructorSignatureUrl: null,
      instructorSignatureName: null,
      issuedAt: '2026-04-11T18:00:00.000Z',
    })

    expect(shouldRebuildSnapshots(brandingSnapshot, documentSnapshot)).toBe(false)
    expect(shouldRebuildSnapshots(null, documentSnapshot)).toBe(true)
    expect(
      shouldRebuildSnapshots(brandingSnapshot, {
        ...documentSnapshot,
        programText: 'Texto legacy sin empresa',
      }),
    ).toBe(true)
  })

  it('normalizes accented titles when building the download file name', () => {
    expect(buildCertificateFileName('Método Challenger: Acción & Éxito')).toBe(
      'metodo_challenger_accion_exito_certificado.pdf',
    )
  })
})
