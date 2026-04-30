export type Macro = "calories" | "protein" | "carbs" | "fat" | "saturated_fat" | "sodium";
export type StoreMethod = "client" | "server";

export interface Food {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs?: number;
  fat?: number;
  saturated_fat?: number;
  sodium?: number;
}

export interface Workout {
  name: string;
  exercises: string[];
}

export interface Exercise {
  id: string;
  name: string;
  notes?: string;
  sets: ExerciseSet[];
}

export interface ExerciseSet {
  reps: number;
  weight: number;
  repeats: number;
}

export interface Settings {
  cares_about: Macro[];
  goal_calories: number;
  goal_protein: number;
  goal_carbs?: number;
  goal_fat?: number;
  max_saturated_fat?: number;
  max_sodium?: number;
}

export interface Weight {
  date: number;
  weight: number;
}

export interface Day {
  weights: Weight[];
  workouts: Workout[];
  foods: Food[];
  date: number;
}

export interface User {
  user: string;
  pass: string;
  settings: Settings;
  store_method: StoreMethod;
  days: Day[];
  page: string;
}

export type Props = {
  db: User,
  SERVER: string,
  page: string,
  error: string,
  // save: () => void
}