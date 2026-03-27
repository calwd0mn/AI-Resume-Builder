/**
 */
import pdfToText from 'react-pdftotext'

const MIN_TEXT_LENGTH = 80

let pdfWorkerConfigured = false

type PdfRenderTask = { promise: Promise<void> }
type PdfViewport = { width: number; height: number }
type PdfPage = {
  getViewport: (opts: { scale: number }) => PdfViewport
  render: (opts: { canvasContext: CanvasRenderingContext2D; viewport: PdfViewport }) => PdfRenderTask
}
type PdfDocument = { numPages: number; getPage: (pageNum: number) => Promise<PdfPage> }
type PdfjsLib = {
  GlobalWorkerOptions: { workerSrc: string }
  version: string
  getDocument: (src: { data: ArrayBuffer }) => { promise: Promise<PdfDocument> }
}

async function getPdfjsLib() {
  const pdfjsLib = await import('pdfjs-dist')
  const typedPdfjsLib = pdfjsLib as unknown as PdfjsLib

  if (typeof window !== 'undefined' && !pdfWorkerConfigured) {
    if (!typedPdfjsLib.GlobalWorkerOptions.workerSrc) {
      typedPdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${typedPdfjsLib.version}/pdf.worker.min.mjs`
    }
    pdfWorkerConfigured = true
  }

  return typedPdfjsLib
}

/**
 */
async function extractTextByOcr(pdfFile: File): Promise<string> {
  const [{ createWorker }, pdfjsLib] = await Promise.all([
    import('tesseract.js'),
    getPdfjsLib(),
  ])
  const arrayBuffer = await pdfFile.arrayBuffer()
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
  const pdf = await loadingTask.promise
  const numPages = pdf.numPages
  const scale = 2
  const texts: string[] = []

  const worker = await createWorker(['eng', 'chi_sim'])

  try {
    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i)
      const viewport = page.getViewport({ scale })
      const canvas = document.createElement('canvas')
      canvas.width = viewport.width
      canvas.height = viewport.height
      const ctx = canvas.getContext('2d')
      if (!ctx) continue
      await page.render({
        canvasContext: ctx as unknown as CanvasRenderingContext2D,
        viewport,
      }).promise
      const dataUrl = canvas.toDataURL('image/png')
      const { data } = await worker.recognize(dataUrl)
      if (data?.text?.trim()) texts.push(data.text.trim())
    }
  } finally {
    await worker.terminate()
  }

  return texts.join('\n\n').trim()
}

export type ExtractResult = { text: string; usedOcr: boolean }

/**
 */
export async function extractTextFromPdfWithOcrFallback(
  pdfFile: File,
  onOcrStart?: () => void
): Promise<ExtractResult> {
  let text = ''
  try {
    text = (await pdfToText(pdfFile)).trim()
  } catch {
    text = ''
  }

  if (text.length >= MIN_TEXT_LENGTH) {
    return { text, usedOcr: false }
  }

  onOcrStart?.()
  const ocrText = await extractTextByOcr(pdfFile)
  return { text: ocrText, usedOcr: true }
}
