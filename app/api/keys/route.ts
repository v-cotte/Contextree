import { NextResponse } from 'next/server'
import { createServerSideClient } from '@/lib/supabase-server'
import { encryptApiKey, decryptApiKey } from '@/lib/encryption'

export async function POST(req: Request) {
  try {
    const supabase = await createServerSideClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { provider, key } = await req.json()
    if (!provider || !key) {
      return NextResponse.json({ error: 'Missing provider or key' }, { status: 400 })
    }

    const encryptedKey = encryptApiKey(key)

    const { error } = await supabase.from('api_keys').upsert(
      {
        user_id: user.id,
        provider,
        encrypted_key: encryptedKey,
        label: provider,
      },
      { onConflict: 'user_id,provider' }
    )

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[keys POST]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: Request) {
  try {
    const supabase = await createServerSideClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { provider } = await req.json()

    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('user_id', user.id)
      .eq('provider', provider)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[keys DELETE]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}