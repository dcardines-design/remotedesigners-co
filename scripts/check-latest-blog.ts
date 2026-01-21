import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

async function check() {
  const { createAdminSupabaseClient } = await import('../src/lib/supabase')
  const supabase = createAdminSupabaseClient()

  const { data } = await supabase
    .from('blog_posts')
    .select('title, slug, content, word_count')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (data) {
    console.log('Title:', data.title)
    console.log('Slug:', data.slug)
    console.log('Word count:', data.word_count)
    console.log('\n--- Content Preview (first 2000 chars) ---\n')
    console.log(data.content.substring(0, 2000))
  }
}

check()
