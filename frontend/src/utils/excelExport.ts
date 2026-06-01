import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

interface ExportColumn {
  header: string
  key: string
  width?: number
}

export const exportToExcel = <T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn[],
  filename: string
) => {
  // Transform data to match column headers
  const exportData = data.map((item) => {
    const row: Record<string, unknown> = {}
    columns.forEach((col) => {
      row[col.header] = item[col.key] ?? ''
    })
    return row
  })

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(exportData)

  // Set column widths
  const colWidths = columns.map((col) => ({ wch: col.width || 15 }))
  worksheet['!cols'] = colWidths

  // Create workbook
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1')

  // Generate buffer
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })

  // Save file
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  saveAs(blob, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`)
}

// Helper to format date for export
export const formatDateForExport = (dateString: string | undefined): string => {
  if (!dateString) return ''
  return new Date(dateString).toISOString().substring(0, 10)
}
