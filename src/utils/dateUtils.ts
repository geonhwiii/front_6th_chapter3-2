import { Event } from '../types.ts';

/**
 * 주어진 년도와 월의 일수를 반환합니다.
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * 주어진 날짜가 속한 주의 모든 날짜를 반환합니다.
 */
export function getWeekDates(date: Date): Date[] {
  const day = date.getDay();
  const diff = date.getDate() - day;
  const sunday = new Date(date.setDate(diff));
  const weekDates = [];
  for (let i = 0; i < 7; i++) {
    const nextDate = new Date(sunday);
    nextDate.setDate(sunday.getDate() + i);
    weekDates.push(nextDate);
  }
  return weekDates;
}

export function getWeeksAtMonth(currentDate: Date) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month + 1);
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const weeks = [];

  const initWeek = () => Array(7).fill(null);

  let week: Array<number | null> = initWeek();

  for (let i = 0; i < firstDayOfMonth; i++) {
    week[i] = null;
  }

  for (const day of days) {
    const dayIndex = (firstDayOfMonth + day - 1) % 7;
    week[dayIndex] = day;
    if (dayIndex === 6 || day === daysInMonth) {
      weeks.push(week);
      week = initWeek();
    }
  }

  return weeks;
}

export function getEventsForDay(events: Event[], date: number): Event[] {
  return events.filter((event) => new Date(event.date).getDate() === date);
}

export function formatWeek(targetDate: Date) {
  const dayOfWeek = targetDate.getDay();
  const diffToThursday = 4 - dayOfWeek;
  const thursday = new Date(targetDate);
  thursday.setDate(targetDate.getDate() + diffToThursday);

  const year = thursday.getFullYear();
  const month = thursday.getMonth() + 1;

  const firstDayOfMonth = new Date(thursday.getFullYear(), thursday.getMonth(), 1);

  const firstThursday = new Date(firstDayOfMonth);
  firstThursday.setDate(1 + ((4 - firstDayOfMonth.getDay() + 7) % 7));

  const weekNumber: number =
    Math.floor((thursday.getTime() - firstThursday.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;

  return `${year}년 ${month}월 ${weekNumber}주`;
}

/**
 * 주어진 날짜의 월 정보를 "YYYY년 M월" 형식으로 반환합니다.
 */
export function formatMonth(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  return `${year}년 ${month}월`;
}

const stripTime = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/**
 * 주어진 날짜가 특정 범위 내에 있는지 확인합니다.
 */
export function isDateInRange(date: Date, rangeStart: Date, rangeEnd: Date): boolean {
  const normalizedDate = stripTime(date);
  const normalizedStart = stripTime(rangeStart);
  const normalizedEnd = stripTime(rangeEnd);

  return normalizedDate >= normalizedStart && normalizedDate <= normalizedEnd;
}

export function fillZero(value: number, size = 2) {
  return String(value).padStart(size, '0');
}

export function formatDate(currentDate: Date, day?: number) {
  return [
    currentDate.getFullYear(),
    fillZero(currentDate.getMonth() + 1),
    fillZero(day ?? currentDate.getDate()),
  ].join('-');
}

export function generateRepeatDates(event: Event, endDate: Date): string[] {
  const dates: string[] = [event.date];

  // event.repeat.endDate가 있으면 더 이른 날짜를 사용
  const effectiveEndDate = event.repeat.endDate 
    ? new Date(Math.min(new Date(event.repeat.endDate).getTime(), endDate.getTime()))
    : endDate;

  if (event.repeat.type === 'monthly') {
    const startDate = new Date(event.date);
    const originalDay = startDate.getDate();
    let currentDate = new Date(startDate);

    while (currentDate <= effectiveEndDate) {
      currentDate.setMonth(currentDate.getMonth() + event.repeat.interval);
      currentDate.setDate(1);

      const lastDayOfMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth() + 1);

      if (originalDay <= lastDayOfMonth) {
        currentDate.setDate(originalDay);

        if (currentDate <= effectiveEndDate) {
          const dateString = formatDate(currentDate);
          dates.push(dateString);
        }
      }
    }
  } else if (event.repeat.type === 'yearly') {
    const startDate = new Date(event.date);
    const originalMonth = startDate.getMonth();
    const originalDay = startDate.getDate();
    let currentYear = startDate.getFullYear();

    while (true) {
      currentYear += event.repeat.interval;

      const candidateDate = new Date(currentYear, originalMonth, 1);
      if (candidateDate > effectiveEndDate) break;

      const lastDayOfMonth = getDaysInMonth(currentYear, originalMonth + 1);

      if (originalDay <= lastDayOfMonth) {
        candidateDate.setDate(originalDay);

        if (candidateDate <= effectiveEndDate) {
          const dateString = formatDate(candidateDate);
          dates.push(dateString);
        }
      }
    }
  }

  return dates;
}
