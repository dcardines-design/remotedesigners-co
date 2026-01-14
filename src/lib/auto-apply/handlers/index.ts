import { Page } from 'playwright'
import { ATSHandler } from './base'
import { GreenhouseHandler } from './greenhouse'
import { LeverHandler } from './lever'
import { GenericHandler } from './generic'
import { detectATS, ATSType } from '../ats-detector'

export * from './base'
export * from './greenhouse'
export * from './lever'
export * from './generic'

const handlers: Record<string, new () => ATSHandler> = {
  greenhouse: GreenhouseHandler,
  lever: LeverHandler,
  generic: GenericHandler,
}

export async function getHandler(page: Page): Promise<{
  handler: ATSHandler
  type: ATSType
  confidence: number
}> {
  const detection = await detectATS(page)

  // Try specific handler first
  const HandlerClass = handlers[detection.type]
  if (HandlerClass && detection.type !== 'generic') {
    const handler = new HandlerClass()
    const confirmed = await handler.detect(page)
    if (confirmed) {
      return {
        handler,
        type: detection.type,
        confidence: detection.confidence
      }
    }
  }

  // Fall back to generic
  return {
    handler: new GenericHandler(),
    type: 'generic',
    confidence: detection.confidence
  }
}

export function createHandler(type: ATSType): ATSHandler {
  const HandlerClass = handlers[type] || GenericHandler
  return new HandlerClass()
}
