import React, { useState, useEffect } from 'react';
import './App.css';

const apiKey = 'f4cb26babcc88db818d6dbd1bab2217a';
const apiUrl = 'https://api.openweathermap.org/data/2.5/weather';
const forecastUrl = 'https://api.openweathermap.org/data/2.5/forecast';

function App() {
    const [city, setCity] = useState('');
    const [cities, setCities] = useState([]);
    const [weatherData, setWeatherData] = useState({});
    const [forecastData, setForecastData] = useState({});
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isCelsius, setIsCelsius] = useState(true);

    useEffect(() => {
        const savedCities = JSON.parse(localStorage.getItem('cities')) || [];
        setCities(savedCities);
        savedCities.forEach(cityName => fetchWeather(cityName));
    }, []);

    useEffect(() => {
        localStorage.setItem('cities', JSON.stringify(cities));
    }, [cities]);

    useEffect(() => {
        const interval = setInterval(() => {
            cities.forEach(cityName => fetchWeather(cityName));
        }, 300000); 
        return () => clearInterval(interval);
    }, [cities]);

    const fetchWeather = async (cityName) => {
        setLoading(true);
        setError('');
        try {
            const response = await fetch(`${apiUrl}?q=${cityName}&appid=${apiKey}&units=metric`);
            const forecastResponse = await fetch(`${forecastUrl}?q=${cityName}&appid=${apiKey}&units=metric`);
            if (!response.ok || !forecastResponse.ok) throw new Error('City not found');

            const data = await response.json();
            const forecast = await forecastResponse.json();
            const timestamp = new Date().toLocaleString();

            setWeatherData(prevData => ({
                ...prevData,
                [cityName]: { data, timestamp }
            }));

            setForecastData(prevForecastData => ({
                ...prevForecastData,
                [cityName]: forecast.list.slice(0, 5).map((item, index) => ({
                    date: new Date(new Date().setDate(new Date().getDate() + index)).toLocaleDateString(),
                    temp: item.main.temp,
                    condition: item.weather[0].main
                }))
            }));

            setError('');
        } catch (err) {
            setError('City not found. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        if (city && !cities.includes(city)) {
            setCities([...cities, city]);
            fetchWeather(city);
            setCity('');
        }
    };

    const handleRemoveCity = (cityName) => {
        setCities(cities.filter(c => c !== cityName));
        setWeatherData(prevData => {
            const newData = { ...prevData };
            delete newData[cityName];
            return newData;
        });
        setForecastData(prevForecastData => {
            const newData = { ...prevForecastData };
            delete newData[cityName];
            return newData;
        });
    };

    const toggleTemperatureUnit = () => {
        setIsCelsius(!isCelsius);
    };

    const getTemperature = (tempCelsius) => {
        return isCelsius ? `${Math.round(tempCelsius)}°C` : `${Math.round(tempCelsius * 9/5 + 32)}°F`;
    };

    const getWeatherIcon = (condition) => {
        switch (condition) {
            case 'Clouds':
                return '/images/clouds.png';
            case 'Clear':
                return '/images/clear.png';
            case 'Rain':
                return '/images/rain.png';
            case 'Drizzle':
                return '/images/drizzle.png';
            case 'Mist':
                return '/images/mist.png';
            default:
                return '/images/clear.png';
        }
    };

    const renderForecast = (cityName) => {
        return forecastData[cityName]?.map((item, index) => (
            <div key={index} className="forecast-item">
                <p>{item.date}</p>
                <p>{getTemperature(item.temp)}</p>
                <img src={getWeatherIcon(item.condition)} alt={item.condition} className="forecast-icon" />
            </div>
        ));
    };

    return (
        <div className="app">
            <div className="search">
                <input
                    type="text"
                    placeholder="Enter City Name"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                />
                <button onClick={handleSearch} disabled={loading}>
                    {loading ? 'Loading...' : <img src="/images/search.png" alt="Search" />}
                </button>
            </div>

            {error && <div className="error"><p>{error}</p></div>}

            <div className="dashboard">
                {cities.map(cityName => (
                    weatherData[cityName] && (
                        <div key={cityName} className="card">
                            <div className="weather">
                                {loading ? (
                                    <p>Loading...</p>
                                ) : (
                                    <>
                                        <img
                                            src={getWeatherIcon(weatherData[cityName].data.weather[0].main)}
                                            alt="Weather Icon"
                                            className="weather-icon"
                                        />
                                        <h1 className="temp">{getTemperature(weatherData[cityName].data.main.temp)}</h1>
                                        <h2 className="city">{weatherData[cityName].data.name}</h2>
                                        <p className="condition">{weatherData[cityName].data.weather[0].main}</p>
                                        <div className="details">
                                            <div className="col">
                                                <img src="/images/humidity.png" alt="Humidity" />
                                                <div>
                                                    <p className="humidity">{weatherData[cityName].data.main.humidity}%</p>
                                                    <p>Humidity</p>
                                                </div>
                                            </div>
                                            <div className="col">
                                                <img src="/images/wind.png" alt="Wind" />
                                                <div>
                                                    <p className="wind">{weatherData[cityName].data.wind.speed} Km/hr</p>
                                                    <p>Wind Speed</p>
                                                </div>
                                            </div>
                                        </div>
                                        <p className="timestamp">Updated at: {weatherData[cityName].timestamp}</p>
                                        <div className="button-wrapper">
                                            <button className="toggle-unit" onClick={toggleTemperatureUnit}>
                                                Switch to {isCelsius ? 'Fahrenheit' : 'Celsius'}
                                            </button>
                                            <button className="remove-city" onClick={() => handleRemoveCity(cityName)}>
                                                Remove City
                                            </button>
                                        </div>
                                        <div className="forecast">
                                            <h3>5-Day Forecast</h3>
                                            <div className="forecast-container">{renderForecast(cityName)}</div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )
                ))}
            </div>
        </div>
    );
}

export default App;
