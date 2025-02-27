import { useCallback, useEffect, useState } from "react"

function WeatherApp() {
     // Estados para termo de busca, dados do clima atual, previsão, loading e erro
     const [searchTerm, setSearchTerm] = useState('Guarulhos');
     const [currentWeather, setCurrentWeather] = useState(null);
     const [forecastData, setForecastData] = useState(null);
     const [loading, setLoading] = useState(false);
     const [error, setError] = useState(null);

     const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;

     // Função para buscar dados do clima e da previsão
     const fetchWeather = useCallback(async () => {
          if (!searchTerm) return;
          setLoading(true);
          setError(null);

          try {
               // Chamada para o Clima atual
               const currentResponse = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${searchTerm}&appid=${API_KEY}&units=metric&lang=pt`);               

               if (!currentResponse.ok) 
                    throw new Error('Erro ao buscar dados do clima atual.');
               const currentData = await currentResponse.json();
               setCurrentWeather(currentData);

               // Chamada para a previsão (5 Day/3 Hour Forecast)
               const forecastResponse = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${searchTerm}&appid=${API_KEY}&units=metric&lang=pt`);

               if (!forecastResponse.ok) 
                    throw new Error('Erro ao buscar dados da previsão.');
               const forecastData = await forecastResponse.json();               
               setForecastData(forecastData);
          } catch (error) {
               setError(error.message);
          } finally {
               setLoading(false);
          }
     }, [searchTerm, API_KEY]);

     // Buscar os dados assim que o componente monta ou quando o termo de busca mudar
     useEffect(() => {
          fetchWeather();
     }, [fetchWeather]);

     return (
          <div className="p-8 font-sans text-center bg-sky-200">
               <h3 className="text-3xl font-bold mb-4">Previsão do Tempo</h3>

               {/* Campo de busca responsivo */}
               <div className="mb-4 flex flex-col sm:flex-row justify-center items-center mx-auto">
                    <input
                         type="text"
                         value={searchTerm}
                         onChange={e => setSearchTerm(e.target.value)}
                         placeholder="Digite o nome da cidade"
                         className="p-2 border border-gray-300 rounded-t sm:rounded-l sm:rounded-t-none mb-2 sm:mb-0 w-full sm:w-96 focus:outline-none"
                    />

                    <button
                         onClick={fetchWeather}
                         className="bg-blue-800 text-white px-4 py-2 w-full sm:w-96 rounded-b sm:rounded-r sm:rounded-b-none hover:bg-blue-900"
                    >
                         Buscar
                    </button>
               </div>

               {/* Exibição de loading e erro */}
               {loading && <p className="text-gray-700">Carregando...</p>}
               {error && <p className="text-gray-500">{error}</p>}

               {/* Exibição de clima atual */}
               {currentWeather && (
                    <div className="mt-6">
                         <h2 className="text-2xl font-semibold">{currentWeather.name}</h2>
                         <img
                              className="mx-auto"
                              src={`http://openweathermap.org/img/wn/${currentWeather.weather[0].icon}@2x.png`}
                              alt={currentWeather.weather[0].description}
                         />
                         <h1>{currentWeather.main.temp.toFixed(0)}°C</h1>
                         <p>{currentWeather.weather[0].description}</p>
          
                    </div>
               )}               
               

               {/* Exibição da previsão para os próximos dias */}
               {forecastData?.list?.length > 0 && currentWeather && (
                    <div className="mt-6">
                         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                              {(() => {
                                   // Define a data atual baseada no clima atual (usando currentWeather.dt)
                                   const currentDate = new Date(currentWeather.dt * 1000)
                                        .toISOString()
                                        .slice(0, 10);

                                   //  Agrupa os itens por data (excluindo o dia atual)
                                   const groupedData = forecastData.list.reduce((acc, item) => {
                                        const [date] = item.dt_txt.split(' ');
                                        if (date === currentDate) return acc; // Ignora o dia atual
                                        if (!acc[date]) acc[date] = [];
                                        acc[date].push(item);
                                        return acc;
                                   }, {});

                                   // Para cada data, calcula a temperatura máxima e mínima
                                   // e seleciona o item representativo (mais próximo das 12h)
                                   const dailyForecasts = Object.entries(groupedData).map(
                                        ([date, items]) => {
                                             const maxTemp = Math.max(...items.map((i) => i.main.temp_max));
                                             const minTemp = Math.min(...items.map((i) => i.main.temp_min));

                                             // Seleciona o item cuja hora esteja mais próxima de 12h
                                             const representative = items.reduce((prev, curr) => {
                                                  const getHour = (forecast) =>
                                                       parseInt(forecast.dt_txt.split(' ')[1].split(':')[0], 10);
                                                  return Math.abs(getHour(curr) - 12) <
                                                       Math.abs(getHour(prev) - 12)
                                                       ? curr
                                                       : prev;
                                             });
                                             return { date, maxTemp, minTemp, representative };
                                        }
                                   );

                                   // Ordena as datas e pega os próximos 5 dias
                                   const sortedForecasts = dailyForecasts
                                        .sort((a, b) => new Date(a.date) - new Date(b.date))
                                        .slice(0, 5);

                                   return sortedForecasts.map(
                                        ({ date, maxTemp, minTemp, representative }) => (
                                             <div
                                                  key={date}
                                                  className="p-4 border border-gray-200 rounded shadow"
                                             >
                                                  <p>{new Date(date).toLocaleDateString()}</p>

                                                  <img
                                                       className="mx-auto"
                                                       src={`http://openweathermap.org/img/wn/${representative.weather[0].icon}@2x.png`}
                                                       alt={representative.weather[0].description}
                                                  />

                                                  <p>{representative.weather[0].description}</p>
                                                  <p>
                                                       Máx: {Math.round(maxTemp)}°C 
                                                       &nbsp; 
                                                       Min: {Math.round(minTemp)}°C
                                                  </p>
                                             </div>
                                        )
                                   );
                              })()}
                         </div>
                    </div>
               )}
          </div>
     );
};

export default WeatherApp
