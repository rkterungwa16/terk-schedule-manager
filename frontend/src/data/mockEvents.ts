import type { CalendarEvent } from "../types/calendar.types";

/**
 * Each seed carries its own real `date` — the actual first/only occurrence
 * — rather than an offset computed relative to whenever the app happens to
 * load. Recurrence (see utils/recurrence.ts) is still what decides which
 * *other* days a repeating event also shows up on; only the template's own
 * anchor date is fixed here.
 */
interface MockEventSeed {
  eventName: string;
  categoryId: string;
  date: Date;
  startTime: string;
  endTime: string;
  recurrence: CalendarEvent["recurrence"];
}

const SEEDS: MockEventSeed[] = [
  {
    eventName: "Lunch Meeting w/ Mark",
    categoryId: "work",
    date: new Date(2026, 7, 21),
    startTime: "12:00",
    endTime: "13:00",
    recurrence: "none",
  },
  {
    eventName: "Interview - Jr. Web Developer",
    categoryId: "work",
    date: new Date(2026, 7, 26),
    startTime: "10:00",
    endTime: "11:00",
    recurrence: "none",
  },
  {
    eventName: "Weekly Team Standup",
    categoryId: "work",
    date: new Date(2026, 6, 27),
    startTime: "09:00",
    endTime: "09:15",
    recurrence: "weekly",
  },
  {
    eventName: "Demo New App to the Board",
    categoryId: "work",
    date: new Date(2026, 6, 8),
    startTime: "14:00",
    endTime: "15:00",
    recurrence: "monthly",
  },

  {
    eventName: "Game vs Portland",
    categoryId: "sports",
    date: new Date(2026, 7, 28),
    startTime: "19:00",
    endTime: "21:00",
    recurrence: "none",
  },
  {
    eventName: "Weekly Soccer Practice",
    categoryId: "sports",
    date: new Date(2026, 7, 1),
    startTime: "17:00",
    endTime: "18:30",
    recurrence: "weekly",
  },

  {
    eventName: "School Play",
    categoryId: "kids",
    date: new Date(2026, 7, 31),
    startTime: "18:00",
    endTime: "19:30",
    recurrence: "none",
  },
  {
    eventName: "Parent/Teacher Conference",
    categoryId: "kids",
    date: new Date(2026, 6, 3),
    startTime: "16:00",
    endTime: "16:30",
    recurrence: "monthly",
  },
  {
    eventName: "Morning Walk",
    categoryId: "kids",
    date: new Date(2026, 7, 13),
    startTime: "07:00",
    endTime: "07:30",
    recurrence: "daily",
  },

  {
    eventName: "Free Tamale Night",
    categoryId: "other",
    date: new Date(2026, 7, 25),
    startTime: "18:00",
    endTime: "20:00",
    recurrence: "none",
  },
  {
    eventName: "Bowling Team",
    categoryId: "other",
    date: new Date(2026, 7, 2),
    startTime: "19:00",
    endTime: "21:00",
    recurrence: "weekly",
  },
  {
    eventName: "Company Anniversary",
    categoryId: "other",
    date: new Date(2026, 4, 15),
    startTime: "12:00",
    endTime: "13:00",
    recurrence: "yearly",
  },
];

export const MOCK_EVENTS: CalendarEvent[] = SEEDS.map((seed, index) => ({
  id: `mock-${index}`,
  eventName: seed.eventName,
  categoryId: seed.categoryId,
  date: seed.date,
  startTime: seed.startTime,
  endTime: seed.endTime,
  recurrence: seed.recurrence,
}));
