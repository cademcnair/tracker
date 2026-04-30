import type { Day } from "./types";

export function today() {
  const date = new Date();
  return (date.getFullYear()*10000)+((date.getMonth() + 1)*100)+(date.getDate())
}

export function find_today(days: Day[]) {
  return days.find(d => d.date == today());
}