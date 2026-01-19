import { NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase'

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const source = searchParams.get('source')

  if (!source) {
    return NextResponse.json({ error: 'source parameter required' }, { status: 400 })
  }

  try {
    const supabase = createAdminSupabaseClient()

    const { data, error } = await supabase
      .from('jobs')
      .delete()
      .eq('source', source)
      .select('id')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      deleted: data?.length || 0,
      source
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
