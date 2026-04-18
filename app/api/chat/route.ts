import { NextResponse } from 'next/server'
import { buildPrompt } from '@/lib/context-builder'
import { decryptApiKey } from '@/lib/encryption'
import { createServerSideClient } from '@/lib/supabase-server'
import { Branch, FileAttachment, Message, ResponseMode } from '@/types'

export async function POST(req: Request) {
  try {
    const supabase = await createServerSideClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      chatId,
      userMessage,
      branches,
      filesByBranch,
      history,
      model,
      responseMode,
      branchId,
    }: {
      chatId: string
      userMessage: string
      branches: Branch[]
      filesByBranch: Record<string, FileAttachment[]>
      history: Message[]
      model: string
      responseMode: ResponseMode
      branchId: string
    } = body

    const { data: keyRow } = await supabase
      .from('api_keys')
      .select('encrypted_key, provider')
      .eq('user_id', user.id)
      .eq('provider', getProvider(model))
      .single()

    if (!keyRow) {
      return NextResponse.json(
        {
          error:
            'No API key found for this model. Add your API key in settings.',
        },
        { status: 400 }
      )
    }

    const apiKey = decryptApiKey(keyRow.encrypted_key)

    const chat = {
      id: chatId,
      branchId: branchId ?? '',
      model,
      responseMode,
      name: '',
      starred: false,
      createdAt: '',
      updatedAt: '',
      userId: user.id,
    }

    const prompt = buildPrompt({
      chat,
      branches,
      filesByBranch,
      history,
      userMessage,
    })

    const stream = await callAI(model, apiKey, prompt.system, prompt.messages)

    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  } catch (err) {
    console.error('[chat] error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

function getProvider(model: string): string {
  if (model.startsWith('claude')) return 'anthropic'
  if (model.startsWith('gpt')) return 'openai'
  if (model.startsWith('gemini')) return 'google'
  return 'anthropic'
}

async function callAI(
  model: string,
  apiKey: string,
  system: string,
  messages: { role: 'user' | 'assistant'; content: string }[]
): Promise<ReadableStream> {
  if (model.startsWith('claude')) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        system,
        messages,
        stream: true,
      }),
    })

    if (!response.ok) {
      const err = await response.json()
      throw new Error(err.error?.message ?? 'Anthropic API error')
    }

    return anthropicStreamToText(response.body!)
  }

  if (model.startsWith('gpt')) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'system', content: system }, ...messages],
        stream: true,
      }),
    })

    if (!response.ok) {
      const err = await response.json()
      throw new Error(err.error?.message ?? 'OpenAI API error')
    }

    return openAIStreamToText(response.body!)
  }

  throw new Error(`Unsupported model: ${model}`)
}

function anthropicStreamToText(body: ReadableStream): ReadableStream {
  const decoder = new TextDecoder()
  const encoder = new TextEncoder()

  return new ReadableStream({
    async start(controller) {
      const reader = body.getReader()
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split('\n')
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              if (data === '[DONE]') continue
              try {
                const parsed = JSON.parse(data)
                if (parsed.type === 'content_block_delta') {
                  const text = parsed.delta?.text ?? ''
                  if (text) controller.enqueue(encoder.encode(text))
                }
              } catch {}
            }
          }
        }
      } finally {
        controller.close()
        reader.releaseLock()
      }
    },
  })
}

function openAIStreamToText(body: ReadableStream): ReadableStream {
  const decoder = new TextDecoder()
  const encoder = new TextEncoder()

  return new ReadableStream({
    async start(controller) {
      const reader = body.getReader()
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split('\n')
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              if (data === '[DONE]') continue
              try {
                const parsed = JSON.parse(data)
                const text = parsed.choices?.[0]?.delta?.content ?? ''
                if (text) controller.enqueue(encoder.encode(text))
              } catch {}
            }
          }
        }
      } finally {
        controller.close()
        reader.releaseLock()
      }
    },
  })
}