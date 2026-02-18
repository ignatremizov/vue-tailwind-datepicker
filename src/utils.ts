import type { InjectionKey } from 'vue'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import { inject } from 'vue'

export function injectStrict<T>(key: InjectionKey<T>, fallback?: T) {
  const resolved = inject(key, fallback)

  if (!resolved)
    throw new Error(`Could not resolve ${key.description}`)

  return resolved
}

export const localesMap = Object.fromEntries(
  Object.entries(import.meta.glob('../node_modules/dayjs/esm/locale/*.js', { import: 'default' })).map(
    ([path, loadLocale]) => [path.match(/([\w-]*)\.js$/)?.[1], loadLocale],
  ),
) as Record<string, () => Promise<ILocale>>

dayjs.extend(customParseFormat)

const FORMATTER_24_HOUR_PATTERN = /HH:mm(?::ss)?/
const FORMATTER_12_HOUR_PATTERN = /(h{1,2}):mm(?::ss)?\s*([Aa])/
const DEFAULT_TIME_PARSE_FORMATS = [
  'HH:mm:ss',
  'H:mm:ss',
  'HH:mm',
  'H:mm',
  'h:mm:ss A',
  'hh:mm:ss A',
  'h:mm A',
  'hh:mm A',
  'h:mm:ss a',
  'hh:mm:ss a',
  'h:mm a',
  'hh:mm a',
]

export interface FormatterTimeTokenAnalysis {
  hasTimeTokens: boolean
  isValid: boolean
  uses12Hour: boolean
  usesSeconds: boolean
  hourToken: 'HH' | 'h' | 'hh' | null
  meridiemToken: 'A' | 'a' | null
  normalizedTimeFormat: string | null
}

interface FormatterTokenMatch {
  index: number
  uses12Hour: boolean
  usesSeconds: boolean
  hourToken: 'HH' | 'h' | 'hh'
  meridiemToken: 'A' | 'a' | null
}

export function maskDayjsEscapedLiterals(formatterDate: string) {
  return formatterDate.replace(/\[[^\]]*]/g, literal => ' '.repeat(literal.length))
}

function getFormatterTokenMatch(formatterDate: string): FormatterTokenMatch | null {
  const formatWithoutEscapedLiterals = maskDayjsEscapedLiterals(formatterDate)
  const twelveHourMatch = FORMATTER_12_HOUR_PATTERN.exec(formatWithoutEscapedLiterals)
  const twentyFourHourMatch = FORMATTER_24_HOUR_PATTERN.exec(formatWithoutEscapedLiterals)
  const matches: FormatterTokenMatch[] = []

  if (twelveHourMatch?.index !== undefined) {
    matches.push({
      index: twelveHourMatch.index,
      uses12Hour: true,
      usesSeconds: twelveHourMatch[0].includes(':ss'),
      hourToken: (twelveHourMatch[1] as 'h' | 'hh'),
      meridiemToken: twelveHourMatch[2] as 'A' | 'a',
    })
  }

  if (twentyFourHourMatch?.index !== undefined) {
    matches.push({
      index: twentyFourHourMatch.index,
      uses12Hour: false,
      usesSeconds: twentyFourHourMatch[0].includes(':ss'),
      hourToken: 'HH',
      meridiemToken: null,
    })
  }

  if (matches.length === 0)
    return null

  matches.sort((left, right) => left.index - right.index)
  return matches[0]
}

export function analyzeFormatterTimeTokens(formatterDate: string): FormatterTimeTokenAnalysis {
  const match = getFormatterTokenMatch(formatterDate)

  if (!match) {
    return {
      hasTimeTokens: false,
      isValid: false,
      uses12Hour: false,
      usesSeconds: false,
      hourToken: null,
      meridiemToken: null,
      normalizedTimeFormat: null,
    }
  }

  const baseFormat = `${match.hourToken}:mm${match.usesSeconds ? ':ss' : ''}`
  const normalizedTimeFormat = match.meridiemToken
    ? `${baseFormat} ${match.meridiemToken}`
    : baseFormat

  return {
    hasTimeTokens: true,
    isValid: true,
    uses12Hour: match.uses12Hour,
    usesSeconds: match.usesSeconds,
    hourToken: match.hourToken,
    meridiemToken: match.meridiemToken,
    normalizedTimeFormat,
  }
}

export function normalizeDefaultTimeInput(
  defaultTime: string | null | undefined,
  formatterDate: string,
): string | null {
  if (defaultTime === undefined || defaultTime === null)
    return null

  const trimmedTime = defaultTime.trim()
  if (!trimmedTime)
    return null

  const formatterTokens = analyzeFormatterTimeTokens(formatterDate)
  if (!formatterTokens.isValid || !formatterTokens.normalizedTimeFormat)
    return null

  const parsedTime = dayjs(trimmedTime, DEFAULT_TIME_PARSE_FORMATS, true)
  if (!parsedTime.isValid())
    return null

  return parsedTime.format(formatterTokens.normalizedTimeFormat)
}
