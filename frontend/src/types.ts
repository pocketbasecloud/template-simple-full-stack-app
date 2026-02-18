import type { RecordModel } from "pocketbase";

export interface Todo extends RecordModel {
  text: string;
  completed: boolean;
  user: string;
}

export interface WeatherCity {
  city: string;
  country: string;
  temperature_c: number;
  windspeed_kmh: number;
  weather_description: string;
}
