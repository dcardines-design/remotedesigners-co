export interface UserProfile {
  fullName: string
  email: string
  phone?: string
  location?: string
  linkedinUrl?: string
  portfolioUrl?: string
  githubUrl?: string
  yearsOfExperience?: number
  currentTitle?: string
  currentCompany?: string
  education?: string
  skills?: string[]
  languages?: string[]
  workAuthorization?: string
  salaryExpectation?: string
  availableStartDate?: string
  willingToRelocate?: boolean
  remotePreference?: 'remote' | 'hybrid' | 'onsite' | 'flexible'
}

export async function generateFieldResponse(
  fieldLabel: string,
  fieldType: string,
  userProfile: UserProfile,
  jobContext: { title: string; company: string; description: string }
): Promise<string> {
  // TODO: Use AI to generate contextual responses for application fields
  // This is a stub
  return ''
}

export async function answerCustomQuestion(
  question: string,
  userProfile: UserProfile,
  jobContext: { title: string; company: string; description: string }
): Promise<string> {
  // TODO: Use AI to answer custom application questions
  // This is a stub
  return ''
}
