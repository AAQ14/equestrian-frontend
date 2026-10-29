// Small helpers to show backend values nicely.

// "2026-11-14" -> "Sat, 14 Nov 2026"
export function formatDate(isoDate) {
  if (!isoDate) return '—';
  return new Date(`${isoDate.slice(0, 10)}T00:00:00`).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// "2026-10-29T08:15:30" -> "29 Oct 2026, 08:15"
export function formatDateTime(isoDateTime) {
  if (!isoDateTime) return '—';
  return new Date(isoDateTime).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// "09:30:00" -> "09:30"
export function formatTime(time) {
  return time ? time.slice(0, 5) : '—';
}

// 25 -> "BHD 25.00"
export function formatPrice(price) {
  return `BHD ${Number(price || 0).toFixed(2)}`;
}

// "SHOW_JUMPING" -> "Show jumping"
export function formatEnum(value) {
  if (!value) return '';
  const text = value.toLowerCase().replace(/_/g, ' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// Turns a "HH:mm" input value into "HH:mm:ss" for LocalTime on the backend.
export function toApiTime(value) {
  return value && value.length === 5 ? `${value}:00` : value;
}

// Today as "YYYY-MM-DD", used as the min value of date inputs.
export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

// Enum lists from the backend, used by filters and forms.
export const SKILL_LEVELS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];
export const SESSION_STATUSES = ['AVAILABLE', 'FULL', 'CANCELLED', 'COMPLETED'];
export const BOOKING_STATUSES = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'];
export const TOURNAMENT_TYPES = [
  'SHOW_JUMPING', 'EVENTING', 'DRESSAGE', 'SHOWING', 'POLO', 'RACING', 'VAULTING', 'REINING', 'ENDURANCE',
];
export const SPECIALIZATIONS = ['DRESSAGE', 'SHOW_JUMPING', 'RACING', 'ENDURANCE', 'GENERAL'];
export const HORSE_STATUSES = ['AVAILABLE', 'UNAVAILABLE', 'IN_TRAINING', 'RESTING', 'RETIRED'];
export const GENDERS = ['STALLION', 'MARE'];
export const USER_STATUSES = ['PENDING', 'ACTIVE', 'INACTIVE'];

// The instructor API does not return the user's email or id, so we find the signed-in
// instructor's profile by matching first and last name with the login response.
export function findMyInstructor(instructors, user) {
  const same = (a, b) => (a || '').trim().toLowerCase() === (b || '').trim().toLowerCase();
  return instructors.find((i) => same(i.firstName, user.firstName) && same(i.lastName, user.lastName)) || null;
}
