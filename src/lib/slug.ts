// Generate SEO-friendly slugs for jobs

export function generateJobSlug(title: string, company: string, id: string): string {
  const slugify = (str: string) =>
    str
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim()
      .slice(0, 40) // Limit length

  const titleSlug = slugify(title)
  const companySlug = slugify(company)

  // Include full UUID for reliable lookup, keeps URL SEO-friendly
  return `${titleSlug}-at-${companySlug}-${id}`
}

export function extractIdFromSlug(slug: string): string | null {
  // Extract the full UUID from the end of the slug
  // Format: title-at-company-uuid (uuid is 36 chars with dashes)

  // If the slug itself is a UUID, return it
  if (/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(slug)) {
    return slug
  }

  // Extract the last 36 characters which should be the UUID
  if (slug.length > 36) {
    const possibleUuid = slug.slice(-36)
    if (/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(possibleUuid)) {
      return possibleUuid
    }
  }

  return null
}
