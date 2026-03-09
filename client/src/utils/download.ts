export function downloadBlob(data: BlobPart, filename: string): void {
  try {
    const blob = new Blob([data], { type: 'application/octet-stream' })
    const url = window.URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename
    anchor.click()
    window.URL.revokeObjectURL(url)
  } catch (error) {
    throw new Error(
      `Failed to download file "${filename}": ${error instanceof Error ? error.message : String(error)}`
    )
  }
}
