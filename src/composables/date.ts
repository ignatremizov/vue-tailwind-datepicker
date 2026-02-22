import type { Dayjs } from 'dayjs'
import type { DatePickerDay } from '~/types'
import 'dayjs/plugin/isBetween'
import 'dayjs/plugin/localeData'

interface LocalDateTimeParts {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
}

interface LocalDateTimeValidationResult {
  isValid: boolean
  isDstNonexistent: boolean
  isAmbiguous: boolean
  resolvedDate: Date | null
}

export default function useDate() {
  const useMatchesLocalDateParts = (
    localDate: Date,
    { year, month, day, hour, minute, second }: LocalDateTimeParts,
  ) => {
    return (
      localDate.getFullYear() === year
      && localDate.getMonth() === month - 1
      && localDate.getDate() === day
      && localDate.getHours() === hour
      && localDate.getMinutes() === minute
      && localDate.getSeconds() === second
    )
  }

  const useValidateLocalDateTime = ({
    year,
    month,
    day,
    hour,
    minute,
    second,
  }: LocalDateTimeParts): LocalDateTimeValidationResult => {
    const resolvedDate = new Date(year, month - 1, day, hour, minute, second, 0)
    const matchesInput = useMatchesLocalDateParts(resolvedDate, {
      year,
      month,
      day,
      hour,
      minute,
      second,
    })

    if (!matchesInput) {
      return {
        isValid: false,
        isDstNonexistent: true,
        isAmbiguous: false,
        resolvedDate: null,
      }
    }

    const maxHoursToSearch = 3
    const stepMinutes = 15
    let isAmbiguous = false

    for (
      let minutesAhead = stepMinutes;
      minutesAhead <= maxHoursToSearch * 60;
      minutesAhead += stepMinutes
    ) {
      const candidate = new Date(resolvedDate.getTime() + minutesAhead * 60 * 1000)
      const matchesLocalParts = useMatchesLocalDateParts(candidate, {
        year,
        month,
        day,
        hour,
        minute,
        second,
      })
      if (
        matchesLocalParts
        && candidate.getTimezoneOffset() !== resolvedDate.getTimezoneOffset()
      ) {
        isAmbiguous = true
        break
      }
    }

    return {
      isValid: true,
      isDstNonexistent: false,
      isAmbiguous,
      resolvedDate,
    }
  }

  const useValidateDayjsLocalDateTime = (
    date: Dayjs,
  ): LocalDateTimeValidationResult => {
    return useValidateLocalDateTime({
      year: date.year(),
      month: date.month() + 1,
      day: date.date(),
      hour: date.hour(),
      minute: date.minute(),
      second: date.second(),
    })
  }

  const usePreviousDate = (date: Dayjs) => {
    const display = []
    const firstDay = date.localeData().firstDayOfWeek()
    for (let i = 0; i <= date.date(0 - firstDay).day(); i++)
      display.push(date.date(0).subtract(i, 'day'))

    return display.sort((a, b) => a.date() - b.date())
  }

  const useCurrentDate = (date: Dayjs) => {
    return Array.from(
      {
        length: date.daysInMonth(),
      },
      (v, k) => date.date(k + 1),
    )
  }

  const useNextDate = (date: Dayjs) => {
    const display = []
    for (
      let i = 1;
      i <= 42 - (usePreviousDate(date).length + date.daysInMonth());
      i++
    )
      display.push(date.date(i).month(date.month()).add(1, 'month'))

    return display
  }

  const useDisableDate = (
    date: Dayjs,
    { disableDate }: { disableDate: boolean | ((date: Date) => boolean) },
  ) => {
    if (typeof disableDate === 'function')
      return disableDate(date.toDate())
    else return false
  }

  const useBetweenRange = (
    date: DatePickerDay,
    { previous, next }: { previous: Dayjs, next: Dayjs },
  ) => {
    const pattern = previous.isAfter(next, 'date') ? '(]' : '[)'

    return !!(date.isBetween(previous, next, 'date', pattern) && !date.off)
  }

  const useToValueFromString = (
    date: Dayjs,
    { formatter }: { formatter: { date: string, month: string } },
  ) => {
    return date.format(formatter.date)
  }

  const useToValueFromArray = (
    { previous, next }: { previous: Dayjs, next: Dayjs },
    {
      formatter,
      separator,
    }: { formatter: { date: string, month: string }, separator: string },
  ) => {
    return `${previous.format(formatter.date)}${separator}${next.format(formatter.date)}`
  }
  return {
    useValidateLocalDateTime,
    useValidateDayjsLocalDateTime,
    usePreviousDate,
    useCurrentDate,
    useNextDate,
    useDisableDate,
    useBetweenRange,
    useToValueFromString,
    useToValueFromArray,
  }
}
