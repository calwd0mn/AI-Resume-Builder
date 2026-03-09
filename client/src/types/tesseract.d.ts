declare module 'tesseract.js' {
  export function createWorker(
    lang?: string | string[],
    oem?: number,
    config?: { logger?: (m: unknown) => void }
  ): Promise<{
    recognize: (image: string) => Promise<{ data: { text: string } }>
    terminate: () => Promise<void>
  }>
}
