import dayjs, { type Dayjs } from 'dayjs'
import type { SelectorYearInputTokenState, YearNumberingMode } from '../types'

export const DIRECT_YEAR_MIN = -99999
export const DIRECT_YEAR_MAX = 99999

const SIGNED_YEAR_TOKEN_PATTERN = /^-?\d{1,5}$/
const SIGNED_YEAR_MODEL_DATE_PATTERN = /^([+-]?\d{1,5})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/
const DEFAULT_MODEL_DATE_FORMAT = 'YYYY-MM-DD HH:mm:ss'

function isWithinDirectYearBounds(year: number) {
  return year >= DIRECT_YEAR_MIN && year <= DIRECT_YEAR_MAX
}

function clampToDirectYearBounds(year: number) {
  if (year < DIRECT_YEAR_MIN)
    return DIRECT_YEAR_MIN
  if (year > DIRECT_YEAR_MAX)
    return DIRECT_YEAR_MAX
  return year
}

export function normalizeSignedYearToken(rawText: string) {
  const trimmed = rawText.trim()
  if (!trimmed)
    return ''

  const hasLeadingMinus = trimmed.startsWith('-')
  const numericPortion = (hasLeadingMinus ? trimmed.slice(1) : trimmed).replace(/\D+/g, '')
  if (!numericPortion)
    return hasLeadingMinus ? '-' : ''

  return hasLeadingMinus ? `-${numericPortion}` : numericPortion
}

export function parseSignedYearToken(
  normalizedText: string,
  yearNumberingMode: YearNumberingMode,
) {
  if (!SIGNED_YEAR_TOKEN_PATTERN.test(normalizedText))
    return null

  const parsedYear = Number.parseInt(normalizedText, 10)
  if (!Number.isSafeInteger(parsedYear))
    return null
  if (!isWithinDirectYearBounds(parsedYear))
    return null
  if (yearNumberingMode === 'historical' && parsedYear === 0)
    return null

  return parsedYear
}

export function resolveDirectYearInputToken(
  rawText: string,
  yearNumberingMode: YearNumberingMode,
): SelectorYearInputTokenState {
  const normalizedText = normalizeSignedYearToken(rawText)
  const parsedYear = parseSignedYearToken(normalizedText, yearNumberingMode)

  return {
    rawText,
    normalizedText,
    parsedYear,
    isValidToken: parsedYear !== null,
  }
}

export function isPartialSignedYearToken(normalizedText: string) {
  return normalizedText === '' || normalizedText === '-'
}

export function formatSignedYearToken(year: number) {
  return String(year)
}

function parseSignedYearModelDateToken(rawText: string) {
  const matched = rawText.match(SIGNED_YEAR_MODEL_DATE_PATTERN)
  if (!matched)
    return null

  const [
    ,
    yearToken,
    monthToken,
    dayToken,
    hourToken,
    minuteToken,
    secondToken,
  ] = matched

  const parsedYear = Number.parseInt(yearToken, 10)
  const parsedMonth = Number.parseInt(monthToken, 10)
  const parsedDay = Number.parseInt(dayToken, 10)
  const parsedHour = Number.parseInt(hourToken, 10)
  const parsedMinute = Number.parseInt(minuteToken, 10)
  const parsedSecond = Number.parseInt(secondToken, 10)

  if (!Number.isSafeInteger(parsedYear) || !isWithinDirectYearBounds(parsedYear))
    return null
  if (parsedMonth < 1 || parsedMonth > 12)
    return null
  if (parsedHour < 0 || parsedHour > 23)
    return null
  if (parsedMinute < 0 || parsedMinute > 59)
    return null
  if (parsedSecond < 0 || parsedSecond > 59)
    return null

  const base = dayjs(
    `2000-${monthToken}-${dayToken} ${hourToken}:${minuteToken}:${secondToken}`,
    DEFAULT_MODEL_DATE_FORMAT,
    true,
  )
  if (!base.isValid())
    return null

  const candidate = base.year(parsedYear)
  if (!candidate.isValid())
    return null

  if (candidate.month() + 1 !== parsedMonth)
    return null
  if (candidate.date() !== parsedDay)
    return null
  if (candidate.hour() !== parsedHour)
    return null
  if (candidate.minute() !== parsedMinute)
    return null
  if (candidate.second() !== parsedSecond)
    return null

  return candidate
}

export function parseModelDateWithDirectYear(
  value: unknown,
  dateFormat: string,
) {
  if (dayjs.isDayjs(value))
    return value.isValid() ? value : null

  if (value instanceof Date) {
    const parsedDate = dayjs(value)
    return parsedDate.isValid() ? parsedDate : null
  }

  if (typeof value !== 'string' || value.length === 0)
    return null

  if (dateFormat === DEFAULT_MODEL_DATE_FORMAT) {
    const parsedSignedDate = parseSignedYearModelDateToken(value)
    if (parsedSignedDate)
      return parsedSignedDate
  }

  const parsedDate = dayjs(value, dateFormat, true)
  return parsedDate.isValid() ? parsedDate : null
}

export function formatModelDateWithDirectYear(
  value: Dayjs,
  dateFormat: string,
) {
  if (dateFormat !== DEFAULT_MODEL_DATE_FORMAT)
    return value.format(dateFormat)

  const boundedYear = clampToDirectYearBounds(value.year())
  const normalizedValue = boundedYear === value.year() ? value : value.year(boundedYear)
  const yearToken = String(normalizedValue.year())
  const monthToken = String(normalizedValue.month() + 1).padStart(2, '0')
  const dayToken = String(normalizedValue.date()).padStart(2, '0')
  const hourToken = String(normalizedValue.hour()).padStart(2, '0')
  const minuteToken = String(normalizedValue.minute()).padStart(2, '0')
  const secondToken = String(normalizedValue.second()).padStart(2, '0')

  return `${yearToken}-${monthToken}-${dayToken} ${hourToken}:${minuteToken}:${secondToken}`
}
