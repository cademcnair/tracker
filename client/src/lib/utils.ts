import type { Day, Macro, Unit, MacroSettingName, Food, Workout, User, Exercise } from "./types"

export function format_date (date: Date) {
  return date.getFullYear() * 10000 + date.getMonth() * 100 + date.getDate()
}

export function today () {
  if (location.search == "") {
    const date = new Date()
    return format_date(date)
  } else {
    return Number(location.search.replace("?", ""))
  }
}

export function find_today (days: Day[]) {
  return days.find(day => day.date === today())
}

export function capitalize (line: string) {
  return line.split("").map((i, d) => (d == 0) ? i.toUpperCase() : i).join("")
}

export function round (num: number, digits: number) {
  return Math.round(num * 10 ** digits) / 10 ** digits
}

export const clone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj))

export type FindTotalsReport = { [k in Macro]: {total: number, foods: [string, number, number, string, number][]}};
export function find_totals(foods: [Food, number][]): FindTotalsReport {
  let report = {} as FindTotalsReport
  for (let i = 0; i < MACROS.length; ++i) {
    let macro = MACROS[i]
    report[macro] = {
      total: foods.map(i => i[0][macro] * i[1]).reduce((a, b) => a+b, 0),
      foods: foods.map((i, d) => [i[0].name, round(i[0][macro] * i[1], 2), d, i[0].id, i[1]])
    }
  }
  return report
}

export const MACROS: Macro[] = ["calories", "protein", "carbs", "fat", "saturated_fat", "sodium"]
export const NICE_MACROS: { [k in Macro]: [string, string, Unit] } = {
  calories: ["Calories", "Calories (kcal)", "kcal"],
  protein: ["Protein", "Protein (g)", "g"],
  carbs: ["Carbs", "Carbs (g)", "g"],
  saturated_fat: ["Saturated Fats", "Saturated Fats (g)", "g"],
  sodium: ["Sodium", "Sodium (mg)", "mg"],
  fat: ["Fat", "Fat (g)", "g"]
}
export const MACRO_SETTING: { [k in Macro]: MacroSettingName} = {
  calories: "goal_calories",
  protein: "goal_protein",
  carbs: "goal_carbs",
  fat: "goal_fat",
  saturated_fat: "max_saturated_fat",
  sodium: "max_sodium"
}

export const READONLY = 0;
export const EDIT_PROACTIVE = 1;
export const EDIT_PASSIVE = 2;
export const EDIT_COMPLEX_PROACTIVE = 3;
export const EDIT_COMPLEX_PASSIVE = 4;
export const str = JSON.stringify;

export function make_workout(w: Workout<false>, db: User): Workout<true> {
  let ans: Workout<true> = {
    completed: false,
    name: w.name,
    exercises: w.exercises.map(i => [i, clone(db.exercises.find(ii => ii.id == i)) as Exercise, []]),
    notes: w.notes,
    color: w.color
  };
  return ans;
}

export const month: any = {
  "00": "Jan",
  "01": "Feb",
  "02": "Mar",
  "03": "Apr",
  "04": "May",
  "05": "Jun",
  "06": "Jul",
  "07": "Aug",
  "08": "Sep",
  "09": "Oct",
  "10": "Nov",
  "11": "Dec"
}
export const make_day_fancy: (d: string) => string =
  (d) => (d.startsWith("0") ? d.replace("0", "") : d) + (d.startsWith("1") ? "th" : d.endsWith("1") ? "st" : d.endsWith("2") ? "nd" : d.endsWith("3") ? "rd" : "th")
export function make_fancy(d: number): string {
  return `${month[String(d).slice(4, 6)]} ${make_day_fancy(String(d).slice(6, 8))}, ${String(d).slice(0, 4)}`
}
export function make_date_into_date_object(d: number): Date {
  return new Date(Number(String(d).slice(0, 4)), Number(String(d).slice(4, 6)), Number(String(d).slice(6, 8)))
}
export function median(arr: number[]): number {
  return clone(arr).sort((a, b) => a - b)[Math.floor(arr.length / 2)]
}

// from https://weeknumber.com/how-to/javascript
export function get_week_number_from_date(date: Date): number {
  date.setHours(0, 0, 0, 0);
  // Thursday in current week decides the year.
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  // January 4 is always in week 1.
  var week1 = new Date(date.getFullYear(), 0, 4);
  // Adjust to Thursday in week 1 and count number of weeks from date to week1.
  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
}