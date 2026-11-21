const calendarStatePrefix = "instructor-calendar.";

export function buildCalendarOAuthState(nonce: string): string {
  return calendarStatePrefix + nonce;
}

export function isCalendarOAuthState(state: string | null): boolean {
  return state?.startsWith(calendarStatePrefix) === true;
}
