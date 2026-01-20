import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

async function fix() {
  const { createAdminSupabaseClient } = await import('../src/lib/supabase')
  const supabase = createAdminSupabaseClient()

  const { error } = await supabase
    .from('blog_posts')
    .update({ slug: 'ai-design-tools-reshaping-remote-work-in-2026' })
    .eq('id', 'b06319f5-70f3-40b8-9bc7-b4cc5fd819b2')

  if (error) {
    console.error(error)
  } else {
    console.log('Slug fixed!')
  }
}

fix()
