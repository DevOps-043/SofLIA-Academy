#!/usr/bin/env node

const { ROOT, WORKSPACES } = require('./count-lines/config')
const { collectStats, summarizeStats } = require('./count-lines/file-stats')
const { printGroupBreakdowns } = require('./count-lines/breakdown-report')
const {
  printExtensionTable,
  printTopExtensions,
} = require('./count-lines/extension-report')
const { formatNumber, printSection } = require('./count-lines/report-utils')
const { printWorkspaceReport } = require('./count-lines/workspace-report')

function printSummary(totals, elapsedSeconds) {
  printSection('Summary')
  console.log(`  Root:               ${ROOT}`)
  console.log(`  Files scanned:      ${formatNumber(totals.files)}`)
  console.log(`  Total lines:        ${formatNumber(totals.total)}`)
  console.log(`  Lines of code:      ${formatNumber(totals.code)}`)
  console.log(`  Blank lines:        ${formatNumber(totals.blank)}`)
  console.log(`  Scan time:          ${elapsedSeconds}s`)
}

function main() {
  const startedAt = Date.now()

  console.log('')
  console.log('SofLIA-Academy - Lines of Code Report')
  console.log('Scanning project files...')

  const stats = collectStats(ROOT)
  const totals = summarizeStats(stats)
  const elapsedSeconds = ((Date.now() - startedAt) / 1000).toFixed(2)

  printExtensionTable(stats, totals)
  printTopExtensions(stats, totals)
  printSummary(totals, elapsedSeconds)
  printGroupBreakdowns(stats)
  printWorkspaceReport(WORKSPACES)
  console.log('')
}

main()
