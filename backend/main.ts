const CITIES = [
  { name: "New York", country: "US", lat: 40.7128, lon: -74.006 },
  { name: "London", country: "UK", lat: 51.5074, lon: -0.1278 },
  { name: "Tokyo", country: "JP", lat: 35.6762, lon: 139.6503 },
  { name: "Paris", country: "FR", lat: 48.8566, lon: 2.3522 },
  { name: "Sydney", country: "AU", lat: -33.8688, lon: 151.2093 },
  { name: "Dubai", country: "AE", lat: 25.2048, lon: 55.2708 },
  { name: "Singapore", country: "SG", lat: 1.3521, lon: 103.8198 },
  { name: "São Paulo", country: "BR", lat: -23.5505, lon: -46.6333 },
  { name: "Mumbai", country: "IN", lat: 19.076, lon: 72.8777 },
  { name: "Cairo", country: "EG", lat: 30.0444, lon: 31.2357 },
];

interface WeatherResult {
  city: string;
  country: string;
  temperature_c: number;
  windspeed_kmh: number;
  weather_description: string;
}

const WMO_CODES: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Foggy",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  71: "Slight snow",
  73: "Moderate snow",
  75: "Heavy snow",
  80: "Slight rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",
  95: "Thunderstorm",
  96: "Thunderstorm with slight hail",
  99: "Thunderstorm with heavy hail",
};

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

async function fetchWeather(): Promise<WeatherResult[]> {
  const lats = CITIES.map((c) => c.lat).join(",");
  const lons = CITIES.map((c) => c.lon).join(",");

  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&current=temperature_2m,weather_code,wind_speed_10m`;

  const res = await fetch(url);
  const data = await res.json();

  return data.map(
    (
      entry: {
        current: {
          temperature_2m: number;
          wind_speed_10m: number;
          weather_code: number;
        };
      },
      i: number,
    ) => ({
      city: CITIES[i].name,
      country: CITIES[i].country,
      temperature_c: entry.current.temperature_2m,
      windspeed_kmh: entry.current.wind_speed_10m,
      weather_description: WMO_CODES[entry.current.weather_code] ?? "Unknown",
    }),
  );
}

Deno.serve({ port: Number(Deno.env.get("PORT")) }, async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const url = new URL(req.url);

  if (url.pathname === "/api/weather") {
    try {
      const weather = await fetchWeather();
      return new Response(JSON.stringify({ cities: weather }), {
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      });
    } catch (err) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch weather data" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...CORS_HEADERS },
        },
      );
    }
  }

  return new Response("Hello from PocketBase Cloud!", {
    headers: CORS_HEADERS,
  });
});
