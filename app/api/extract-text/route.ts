import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    if (file.type === 'application/pdf') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pdfParse = await import('pdf-parse') as any
      const fn = pdfParse.default ?? pdfParse
      const data = await fn(buffer)
      return NextResponse.json({ text: data.text })
    }

    if (
      file.type ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.name.endsWith('.docx')
    ) {
      const mammoth = await import('mammoth')
      const result = await mammoth.extractRawText({ buffer })
      return NextResponse.json({ text: result.value })
    }

    const text = buffer.toString('utf-8')
    return NextResponse.json({ text })
  } catch (err) {
    console.error('Text extraction failed:', err)
    return NextResponse.json(
      { error: 'Failed to extract text' },
      { status: 500 }
    )
  }
}