import type { Macro, MacroSettingNames } from "./types";

export const CAN_CARE: Macro[] = ["calories", "protein", "carbs", "fat", "saturated_fat", "sodium"];
export const CAN_CARE_NICE: { [key in Macro]: string } = {
  calories: "Calories",
  protein: "Protein",
  carbs: "Carbs",
  fat: "Fat",
  saturated_fat: "Saturated Fat",
  sodium: "Sodium"
}
export const CAN_CARE_UNITS: { [key in Macro]: string } = {
  calories: "kcal",
  protein: "g",
  carbs: "g",
  fat: "g",
  saturated_fat: "g",
  sodium: "mg"
}
export const CAN_CARE_SETTINGS_NAME: { [key in Macro]: MacroSettingNames } = {
  calories: "goal_calories",
  protein: "goal_protein",
  carbs: "goal_carbs",
  fat: "goal_fat",
  saturated_fat: "max_saturated_fat",
  sodium: "max_sodium"
}
export const FUNC_CAN_CARE_SETTINGS_NAME = (macro: Macro) => CAN_CARE_SETTINGS_NAME[macro]