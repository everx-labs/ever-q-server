import { configParams } from '../../server/config'
import { ConfigParam } from '../../server/config-param'

function toString(value: unknown): string {
  return value === null || value === undefined ? '' : `${value}`
}

export function formatTable(
  table: unknown[][],
  options?: {
    headerSeparator?: boolean
    multilineSeparator?: boolean
    multilineIndent?: string
  },
): string {
  const headerSeparator = options?.headerSeparator ?? false
  const multilineSeparator = options?.multilineSeparator ?? false
  const multilineIndent = options?.multilineIndent ?? '  '
  const rows: string[][][] = table.map(row =>
    row.map(cell => toString(cell).split('\n')),
  )
  const widths: number[] = []
  const isEmpty: boolean[] = []
  const updateWidth = (cell: string[], i: number, rowIndex: number) => {
    while (widths.length <= i) {
      widths.push(0)
      isEmpty.push(true)
    }
    for (const line of cell) {
      const width = line.length
      widths[i] = Math.max(widths[i], width)
      const isHeader = headerSeparator && rowIndex === 0
      if (!isHeader && width > 0) {
        isEmpty[i] = false
      }
    }
  }
  rows.forEach((row, ri) =>
    row.forEach((cell, vi) => updateWidth(cell, vi, ri)),
  )
  const formatValue = (value: string, ci: number) => value.padEnd(widths[ci])
  const formatRowLine = (rowLine: string[]) =>
    rowLine
      .map(formatValue)
      .filter((_, i) => !isEmpty[i])
      .join('  ')
      .trimEnd()
  const formatCellLine = (cell: string[], line: number) => {
    if (line >= cell.length) {
      return ''
    }
    return `${line > 0 ? multilineIndent : ''}${cell[line]}`
  }
  const lines: string[] = []
  const hasMultilines = rows.find(r => r.find(c => c.length > 0)) !== undefined
  const firstDataRowIndex = headerSeparator ? 1 : 0

  rows.forEach((row, rowIndex) => {
    for (let line = 0; row.find(x => line < x.length); line += 1) {
      if (
        multilineSeparator &&
        hasMultilines &&
        rowIndex > firstDataRowIndex &&
        line === 0
      ) {
        lines.push('')
      }
      lines.push(formatRowLine(row.map(x => formatCellLine(x, line))))
    }
  })
  if (headerSeparator) {
    const separator = formatRowLine(widths.map(x => '-'.repeat(x)))
    lines.splice(1, 0, separator)
  }
  return lines.join('\n')
}

const rows = [['Option', 'ENV', 'Default', 'Description']]
for (const param of ConfigParam.getAll(configParams)) {
  rows.push([
    `--${param.option}${param.deprecated ? ' (DEPRECATED)' : ''}`,
    param.env,
    `${param.defaultValueAsString()}`,
    param.description,
  ])
}

console.log(
  formatTable(rows, {
    headerSeparator: true,
    multilineIndent: '',
  }),
)
