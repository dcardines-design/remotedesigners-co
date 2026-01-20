import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

async function check() {
  const { createAdminSupabaseClient } = await import('../src/lib/supabase')
  const supabase = createAdminSupabaseClient()

  const { data } = await supabase
    .from('blog_posts')
    .select('title, slug, featured_image, word_count, category')
    .eq('id', 'b06319f5-70f3-40b8-9bc7-b4cc5fd819b2')
    .single()

  console.log(JSON.stringify(data, null, 2))
}

check()
