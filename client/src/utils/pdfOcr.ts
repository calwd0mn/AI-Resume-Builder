/**
 * 从 PDF 提取文本：优先直接取字，失败或内容过少时用 OCR（支持扫描版简历）
 */
import pdfToText from 'react-pdftotext'
import * as pdfjsLib from 'pdfjs-dist'
import { createWorker } from 'tesseract.js'

const MIN_TEXT_LENGTH = 80 // 低于此长度视为扫描版，走 OCR

// PDF.js 需在浏览器中指定 worker（Vite 下用 CDN 或 public 下的 worker）
if (typeof window !== 'undefined') {
  const pdfjsWorker = (pdfjsLib as unknown as { GlobalWorkerOptions: { workerSrc: string } }).GlobalWorkerOptions
  if (!pdfjsWorker.workerSrc) {
    pdfjsWorker.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${(pdfjsLib as unknown as { version: string }).version}/pdf.worker.min.mjs`
  }
}

/**
 * 用 OCR 从 PDF 各页画布识别文字（用于扫描版 PDF）
 */
async function extractTextByOcr(pdfFile: File): Promise<string> {
  const arrayBuffer = await pdfFile.arrayBuffer()
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
  const pdf = await loadingTask.promise
  const numPages = pdf.numPages
  const scale = 2
  const texts: string[] = []

  // 支持英文与简体中文简历
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
 * 从 PDF 提取全文。先尝试直接取字，若为空或过短则用 OCR。
 * @param onOcrStart 在开始 OCR 时调用（可用于显示“正在识别…”提示）
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
