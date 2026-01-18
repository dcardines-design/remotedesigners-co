// Emails with complimentary premium membership
export const COMP_MEMBER_EMAILS: string[] = [
]

export function isCompMember(email: string | null | undefined): boolean {
  if (!email) return false
  return COMP_MEMBER_EMAILS.includes(email.toLowerCase())
}
