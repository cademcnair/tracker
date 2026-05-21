import type { Day, Macro, Unit, MacroSettingName, Food } from "./types"

export function today () {
  const date = new Date()
  return date.getFullYear() * 10000 + date.getMonth() * 100 + date.getDate()
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