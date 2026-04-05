import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey || apiKey === 'your_api_key_here') {
      return NextResponse.json(
        {
          error:
            'ANTHROPIC_API_KEY is not configured. Open .env.local and add your key, then restart the server.',
        },
        { status: 503 }
      )
    }

    // Extract text from the file
    let documentText = ''
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      try {
        const pdfParse = (await import('pdf-parse')).default
        const data = await pdfParse(buffer)
        documentText = data.text
      } catch {
        documentText = `[PDF: ${file.name} — text extraction failed, file may be image-based]`
      }
    } else if (file.type.startsWith('text/')) {
      documentText = buffer.toString('utf-8')
    } else if (file.type.startsWith('image/')) {
      // For images we'll pass it as base64 to Claude's vision API
      const base64 = buffer.toString('base64')
      documentText = await parseImageWithClaude(base64, file.type, apiKey)
    } else {
      documentText = buffer.toString('utf-8')
    }

    // Parse with Claude
    const { parseDocumentWithAI } = await import('@/lib/aiParser')
    const result = await parseDocumentWithAI(documentText, apiKey)

    return NextResponse.json(result)
  } catch (err: unknown) {
    console.error('[parse-document]', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

async function parseImageWithClaude(
  base64: string,
  mediaType: string,
  apiKey: string
): Promise<string> {
  const Anthropic = (await import('@anthropic-ai/sdk')).default
  const client = new Anthropic({ apiKey })

  const response = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
              data: base64,
            },
          },
          {
            type: 'text',
            text: 'Please transcribe all text and numbers you see in this real estate document image. Include all financial figures, property details, rent roll data, and any other relevant information.',
          },
        ],
      },
    ],
  })

  return response.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { type: 'text'; text: string }).text)
    .join('\n')
}
