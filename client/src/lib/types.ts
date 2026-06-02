export type Macro = "calories" | "protein" | "carbs" | "fat" | "saturated_fat" | "sodium";
export type StoreMethod = "client" | "server";
export type Unit = "g" | "kcal" | "mg";

export interface Food {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  saturated_fat: number;
  sodium: number;
}

// completed = true; template = false
export interface Workout<T extends boolean> {
  name: string;
  exercises: (T extends true ? [string, ExerciseSet[]] : string)[];
  notes: string;
  color: string;
}

export interface Exercise {
  id: string;
  name: string;
  notes: string;
  sets: ExerciseSet[];
  rest: number;
  leftright: boolean;
  repsonly: boolean;
  normalreps: number;
  sincelastimprovement: number;
}

export interface ExerciseSet {
  reps: number;
  weight: number;
}

export type MacroSettingName = "goal_calories" | "goal_protein" | "goal_carbs" | "goal_fat" | "max_saturated_fat" | "max_sodium"
export interface Settings {
  cares_about: Macro[];
  goal_calories: number;
  goal_protein: number;
  goal_carbs: number;
  goal_fat: number;
  max_saturated_fat: number;
  max_sodium: number;
}

export interface Weight {
  date: number;
  weight: number;
}

export interface Day {
  weights: Weight[];
  workouts: Workout<true>[];
  foods: [Food, number][];
  date: number;
}

export interface User {
  user: string;
  pass: string;
  settings: Settings;
  store_method: StoreMethod;
  days: Day[];
  page: string;
  foods: Food[];
  exercises: Exercise[];
  workouts: Workout<false>[];
  weights: Weight[];
}

export type Props = {
  db: User,
  SERVER: string,
  page: string,
  error: string,
}