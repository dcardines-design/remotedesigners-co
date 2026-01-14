import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

export interface ResumeData {
  fullName: string
  email: string
  phone?: string
  location?: string
  portfolioUrl?: string
  linkedinUrl?: string
  summary?: string
  skills: string[]
  experiences: {
    company: string
    title: string
    location?: string
    startDate: string
    endDate?: string
    isCurrent: boolean
    description?: string
    highlights: string[]
  }[]
  education: {
    institution: string
    degree: string
    fieldOfStudy?: string
    startDate?: string
    endDate?: string
    gpa?: string
  }[]
}

export interface CoverLetterData {
  fullName: string
  email: string
  phone?: string
  date: string
  companyName: string
  hiringManagerName?: string
  jobTitle: string
  content: string
}

const PAGE_WIDTH = 612 // Letter size
const PAGE_HEIGHT = 792
const MARGIN = 50
const LINE_HEIGHT = 14
const SECTION_GAP = 20

export async function generateResumePDF(data: ResumeData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])

  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  let y = PAGE_HEIGHT - MARGIN
  const contentWidth = PAGE_WIDTH - (MARGIN * 2)

  const checkNewPage = () => {
    if (y < MARGIN + 50) {
      page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
      y = PAGE_HEIGHT - MARGIN
    }
  }

  const drawText = (text: string, options: {
    font?: typeof helvetica
    size?: number
    color?: { r: number; g: number; b: number }
    maxWidth?: number
    center?: boolean
  } = {}) => {
    const { font = helvetica, size = 10, color = { r: 0, g: 0, b: 0 }, maxWidth = contentWidth, center = false } = options

    const words = text.split(' ')
    let line = ''

    for (const word of words) {
      const testLine = line ? `${line} ${word}` : word
      const width = font.widthOfTextAtSize(testLine, size)

      if (width > maxWidth && line) {
        checkNewPage()
        const x = center ? (PAGE_WIDTH - font.widthOfTextAtSize(line, size)) / 2 : MARGIN
        page.drawText(line, { x, y, size, font, color: rgb(color.r, color.g, color.b) })
        y -= LINE_HEIGHT
        line = word
      } else {
        line = testLine
      }
    }

    if (line) {
      checkNewPage()
      const x = center ? (PAGE_WIDTH - font.widthOfTextAtSize(line, size)) / 2 : MARGIN
      page.drawText(line, { x, y, size, font, color: rgb(color.r, color.g, color.b) })
      y -= LINE_HEIGHT
    }
  }

  // Header - Name
  drawText(data.fullName, { font: helveticaBold, size: 24, center: true })
  y -= 5

  // Contact info
  const contactParts = [data.email]
  if (data.phone) contactParts.push(data.phone)
  if (data.location) contactParts.push(data.location)
  drawText(contactParts.join(' | '), { size: 10, center: true, color: { r: 0.3, g: 0.3, b: 0.3 } })

  // Links
  const linkParts = []
  if (data.portfolioUrl) linkParts.push(data.portfolioUrl)
  if (data.linkedinUrl) linkParts.push(data.linkedinUrl)
  if (linkParts.length > 0) {
    drawText(linkParts.join(' | '), { size: 9, center: true, color: { r: 0.2, g: 0.4, b: 0.8 } })
  }

  y -= SECTION_GAP

  // Summary
  if (data.summary) {
    drawText('SUMMARY', { font: helveticaBold, size: 12 })
    y -= 3
    page.drawLine({
      start: { x: MARGIN, y: y + 5 },
      end: { x: PAGE_WIDTH - MARGIN, y: y + 5 },
      thickness: 0.5,
      color: rgb(0.7, 0.7, 0.7)
    })
    y -= 5
    drawText(data.summary, { size: 10, color: { r: 0.2, g: 0.2, b: 0.2 } })
    y -= SECTION_GAP
  }

  // Skills
  if (data.skills.length > 0) {
    drawText('SKILLS', { font: helveticaBold, size: 12 })
    y -= 3
    page.drawLine({
      start: { x: MARGIN, y: y + 5 },
      end: { x: PAGE_WIDTH - MARGIN, y: y + 5 },
      thickness: 0.5,
      color: rgb(0.7, 0.7, 0.7)
    })
    y -= 5
    drawText(data.skills.join(' • '), { size: 10, color: { r: 0.2, g: 0.2, b: 0.2 } })
    y -= SECTION_GAP
  }

  // Experience
  if (data.experiences.length > 0) {
    drawText('EXPERIENCE', { font: helveticaBold, size: 12 })
    y -= 3
    page.drawLine({
      start: { x: MARGIN, y: y + 5 },
      end: { x: PAGE_WIDTH - MARGIN, y: y + 5 },
      thickness: 0.5,
      color: rgb(0.7, 0.7, 0.7)
    })
    y -= 8

    for (const exp of data.experiences) {
      checkNewPage()

      // Title and company
      drawText(`${exp.title} at ${exp.company}`, { font: helveticaBold, size: 11 })

      // Date and location
      const dateStr = exp.isCurrent
        ? `${exp.startDate} - Present`
        : `${exp.startDate} - ${exp.endDate || ''}`
      const locStr = exp.location ? ` | ${exp.location}` : ''
      drawText(`${dateStr}${locStr}`, { size: 9, color: { r: 0.4, g: 0.4, b: 0.4 } })

      // Description
      if (exp.description) {
        y -= 3
        drawText(exp.description, { size: 10, color: { r: 0.2, g: 0.2, b: 0.2 } })
      }

      // Highlights
      for (const highlight of exp.highlights) {
        y -= 2
        drawText(`• ${highlight}`, { size: 10, color: { r: 0.2, g: 0.2, b: 0.2 } })
      }

      y -= 10
    }
    y -= 5
  }

  // Education
  if (data.education.length > 0) {
    checkNewPage()
    drawText('EDUCATION', { font: helveticaBold, size: 12 })
    y -= 3
    page.drawLine({
      start: { x: MARGIN, y: y + 5 },
      end: { x: PAGE_WIDTH - MARGIN, y: y + 5 },
      thickness: 0.5,
      color: rgb(0.7, 0.7, 0.7)
    })
    y -= 8

    for (const edu of data.education) {
      checkNewPage()

      const degreeStr = edu.fieldOfStudy
        ? `${edu.degree} in ${edu.fieldOfStudy}`
        : edu.degree
      drawText(degreeStr, { font: helveticaBold, size: 11 })
      drawText(edu.institution, { size: 10 })

      const dateParts = []
      if (edu.startDate || edu.endDate) {
        dateParts.push(`${edu.startDate || ''} - ${edu.endDate || 'Present'}`)
      }
      if (edu.gpa) {
        dateParts.push(`GPA: ${edu.gpa}`)
      }
      if (dateParts.length > 0) {
        drawText(dateParts.join(' | '), { size: 9, color: { r: 0.4, g: 0.4, b: 0.4 } })
      }

      y -= 10
    }
  }

  return pdfDoc.save()
}

export async function generateCoverLetterPDF(data: CoverLetterData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])

  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  let y = PAGE_HEIGHT - MARGIN
  const contentWidth = PAGE_WIDTH - (MARGIN * 2)

  const drawText = (text: string, options: {
    font?: typeof helvetica
    size?: number
    color?: { r: number; g: number; b: number }
  } = {}) => {
    const { font = helvetica, size = 11, color = { r: 0, g: 0, b: 0 } } = options

    const words = text.split(' ')
    let line = ''

    for (const word of words) {
      const testLine = line ? `${line} ${word}` : word
      const width = font.widthOfTextAtSize(testLine, size)

      if (width > contentWidth && line) {
        page.drawText(line, { x: MARGIN, y, size, font, color: rgb(color.r, color.g, color.b) })
        y -= LINE_HEIGHT + 2
        line = word
      } else {
        line = testLine
      }
    }

    if (line) {
      page.drawText(line, { x: MARGIN, y, size, font, color: rgb(color.r, color.g, color.b) })
      y -= LINE_HEIGHT + 2
    }
  }

  // Header - Your info
  drawText(data.fullName, { font: helveticaBold, size: 14 })
  drawText(data.email, { size: 10, color: { r: 0.3, g: 0.3, b: 0.3 } })
  if (data.phone) {
    drawText(data.phone, { size: 10, color: { r: 0.3, g: 0.3, b: 0.3 } })
  }

  y -= SECTION_GAP

  // Date
  drawText(data.date, { size: 10 })

  y -= SECTION_GAP

  // Recipient
  if (data.hiringManagerName) {
    drawText(`Dear ${data.hiringManagerName},`, { size: 11 })
  } else {
    drawText(`Dear Hiring Manager,`, { size: 11 })
  }

  y -= 10

  // Content - split by paragraphs
  const paragraphs = data.content.split('\n\n')
  for (const paragraph of paragraphs) {
    if (paragraph.trim()) {
      drawText(paragraph.trim(), { size: 11 })
      y -= 10
    }
  }

  y -= 10

  // Closing
  drawText('Sincerely,', { size: 11 })
  y -= 20
  drawText(data.fullName, { font: helveticaBold, size: 11 })

  return pdfDoc.save()
}

// Convert PDF bytes to base64 data URL
export function pdfToDataUrl(pdfBytes: Uint8Array): string {
  const base64 = Buffer.from(pdfBytes).toString('base64')
  return `data:application/pdf;base64,${base64}`
}

// Convert PDF bytes to Blob (for file upload)
export function pdfToBlob(pdfBytes: Uint8Array): Blob {
  return new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' })
}
