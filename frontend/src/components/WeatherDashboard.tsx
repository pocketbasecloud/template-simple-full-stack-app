import { useEffect, useState } from "react";
import type { WeatherCity } from "../types";
import { BACKEND_URL } from "../lib/config";

export default function WeatherDashboard() {
  const [cities, setCities] = useState<WeatherCity[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/weather`)
      .then((r) => r.json())
      .then((data) => setCities(data.cities))
      .catch(() => setError("Failed to load weather data"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="card"><p>Loading weather...</p></div>;
  if (error) return <div className="card"><p className="error">{error}</p></div>;

  return (
    <div className="weather-section">
      <h3>World Weather</h3>
      <div className="weather-grid">
        {cities.map((c) => (
          <div key={c.city} className="weather-card">
            <div className="weather-city">{c.city}, {c.country}</div>
            <div className="weather-temp">{c.temperature_c}°C</div>
            <div className="weather-desc">{c.weather_description}</div>
            <div className="weather-wind">{c.windspeed_kmh} km/h</div>
          </div>
        ))}
      </div>
    </div>
  );
}
