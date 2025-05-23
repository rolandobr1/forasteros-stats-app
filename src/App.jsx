import React, { useState, useEffect, useRef, useCallback } from 'react';

// Main App component
const App = () => {
  // State for initial game time duration (in seconds)
  const [initialGameTime, setInitialGameTime] = useState(720); // Default to 12 minutes (720 seconds)
  // State for current game time countdown (in seconds)
  const [gameTime, setGameTime] = useState(initialGameTime);
  const [isRunning, setIsRunning] = useState(false);
  const timerRef = useRef(null); // Ref to store the interval ID

  // State for quarters
  const [numQuarters, setNumQuarters] = useState(4); // Default to 4 quarters
  const [currentQuarter, setCurrentQuarter] = useState(1);

  // Helper function to create default players
  const createDefaultPlayers = (teamPrefix) => {
    return Array.from({ length: 5 }).map((_, index) => ({
      id: crypto.randomUUID(),
      name: `Jugador ${index + 1} ${teamPrefix}`,
      score: 0,
      fouls: 0,
      steals: 0,
      assists: 0,
      blocks: 0,
      rebounds: 0
    }));
  };

  // State for teams and players
  const [teams, setTeams] = useState([
    {
      id: 'teamA',
      name: 'Equipo A',
      score: 0,
      fouls: 0,
      steals: 0,
      assists: 0,
      blocks: 0,
      rebounds: 0,
      players: createDefaultPlayers('A') // Default 5 players for Team A
    },
    {
      id: 'teamB',
      name: 'Equipo B',
      score: 0,
      fouls: 0,
      steals: 0,
      assists: 0,
      blocks: 0,
      rebounds: 0,
      players: createDefaultPlayers('B') // Default 5 players for Team B
    }
  ]);

  // State for saved games
  const [savedGames, setSavedGames] = useState([]);
  const [selectedGameToLoad, setSelectedGameToLoad] = useState('');

  // Load saved games from localStorage on initial render
  useEffect(() => {
    try {
      const storedGames = localStorage.getItem('forasteros_stats_games');
      if (storedGames) {
        setSavedGames(JSON.parse(storedGames));
      }
    } catch (error) {
      console.error("Error loading games from localStorage:", error);
    }
  }, []);

  // Save games to localStorage whenever savedGames state changes
  useEffect(() => {
    try {
      localStorage.setItem('forasteros_stats_games', JSON.stringify(savedGames));
    } catch (error) {
      console.error("Error saving games to localStorage:", error);
    }
  }, [savedGames]);

  // Effect to manage the game timer
  useEffect(() => {
    if (isRunning && gameTime > 0) {
      timerRef.current = setInterval(() => {
        setGameTime((prevTime) => prevTime - 1);
      }, 1000);
    } else if (gameTime === 0) {
      clearInterval(timerRef.current);
      setIsRunning(false);
      // If time runs out and it's not the last quarter, prepare for next quarter
      if (currentQuarter < numQuarters) {
        // Optionally, you could show a "Quarter End" message here
      } else {
        // Game Over
        // Optionally, you could show a "Game Over" message here
      }
    }

    // Cleanup interval on component unmount or when isRunning changes
    return () => clearInterval(timerRef.current);
  }, [isRunning, gameTime, currentQuarter, numQuarters]);

  // Effect to reset gameTime when initialGameTime or currentQuarter changes
  useEffect(() => {
    setGameTime(initialGameTime);
  }, [initialGameTime, currentQuarter]); // Depend on currentQuarter to reset time for new quarter

  // Function to format time for display (MM:SS)
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Handlers for team name change
  const handleTeamNameChange = (teamId, newName) => {
    setTeams(prevTeams =>
      prevTeams.map(team =>
        team.id === teamId ? { ...team, name: newName } : team
      )
    );
  };

  // Handler for player name change
  const handlePlayerNameChange = (teamId, playerId, newName) => {
    setTeams(prevTeams =>
      prevTeams.map(team =>
        team.id === teamId
          ? {
              ...team,
              players: team.players.map(player =>
                player.id === playerId ? { ...player, name: newName } : player
              )
            }
          : team
      )
    );
  };

  // Function to add a new player to a team
  const addPlayer = (teamId) => {
    setTeams(prevTeams =>
      prevTeams.map(team =>
        team.id === teamId
          ? {
              ...team,
              players: [
                ...team.players,
                {
                  id: crypto.randomUUID(),
                  name: `Jugador ${team.players.length + 1} ${team.id === 'teamA' ? 'A' : 'B'}`,
                  score: 0,
                  fouls: 0,
                  steals: 0,
                  assists: 0,
                  blocks: 0,
                  rebounds: 0
                }
              ]
            }
          : team
      )
    );
  };

  // Function to remove a player from a team
  const removePlayer = (teamId, playerId) => {
    setTeams(prevTeams =>
      prevTeams.map(team => {
        if (team.id === teamId) {
          const playerToRemove = team.players.find(p => p.id === playerId);
          if (playerToRemove) {
            // Subtract player's stats from team totals
            return {
              ...team,
              score: team.score - playerToRemove.score,
              fouls: team.fouls - playerToRemove.fouls,
              steals: team.steals - playerToRemove.steals,
              assists: team.assists - playerToRemove.assists,
              blocks: team.blocks - playerToRemove.blocks,
              rebounds: team.rebounds - playerToRemove.rebounds,
              players: team.players.filter(player => player.id !== playerId)
            };
          }
        }
        return team;
      })
    );
  };

  // Function to update any player's stat and the corresponding team total
  const updatePlayerStat = (teamId, playerId, statType, value) => {
    setTeams(prevTeams =>
      prevTeams.map(team => {
        if (team.id === teamId) {
          return {
            ...team,
            [statType]: team[statType] + value, // Update team total for the stat
            players: team.players.map(player =>
              player.id === playerId ? { ...player, [statType]: player[statType] + value } : player
            )
          };
        }
        return team;
      })
    );
  };

  // Timer control functions
  const startTimer = () => setIsRunning(true);
  const pauseTimer = () => setIsRunning(false);
  const resetCurrentQuarterTime = () => { // Renamed for clarity
    clearInterval(timerRef.current);
    setIsRunning(false);
    setGameTime(initialGameTime); // Reset to the currently set initial game time
  };

  // Handle game duration input change
  const handleDurationChange = (e) => {
    const minutes = parseInt(e.target.value || '0');
    setInitialGameTime(minutes * 60);
    // Automatically reset the timer to the new duration when it changes
    clearInterval(timerRef.current);
    setIsRunning(false);
    setGameTime(minutes * 60);
  };

  // Handle number of quarters change
  const handleNumQuartersChange = (e) => {
    const quarters = parseInt(e.target.value || '1');
    setNumQuarters(quarters);
    // If current quarter exceeds new total quarters, reset to last quarter
    if (currentQuarter > quarters && quarters > 0) {
      setCurrentQuarter(quarters);
    } else if (quarters === 0) { // Prevent 0 quarters
      setNumQuarters(1);
      setCurrentQuarter(1);
    }
  };

  // Advance to the next quarter
  const nextQuarter = () => {
    if (currentQuarter < numQuarters) {
      setCurrentQuarter(prevQuarter => prevQuarter + 1);
      clearInterval(timerRef.current);
      setIsRunning(false);
      setGameTime(initialGameTime); // Reset time for the new quarter
    }
  };

  // Reset all stats including players and new stats
  const resetGame = () => {
    setTeams(prevTeams =>
      prevTeams.map(team => ({
        ...team,
        score: 0,
        fouls: 0,
        steals: 0,
        assists: 0,
        blocks: 0,
        rebounds: 0,
        players: team.players.map(player => ({
          ...player,
          score: 0,
          fouls: 0,
          steals: 0,
          assists: 0,
          blocks: 0,
          rebounds: 0
        }))
      }))
    );
    // Reset timer and quarters
    clearInterval(timerRef.current);
    setIsRunning(false);
    setGameTime(initialGameTime);
    setCurrentQuarter(1);
  };

  // Function to save the current game
  const saveCurrentGame = () => {
    const gameId = crypto.randomUUID();
    const gameDate = new Date().toLocaleString();
    const newGame = {
      id: gameId,
      date: gameDate,
      teams: teams,
      initialGameTime: initialGameTime,
      numQuarters: numQuarters,
      currentQuarter: currentQuarter,
    };
    setSavedGames(prevGames => [...prevGames, newGame]);
    alert('Partido guardado exitosamente!'); // Using alert for simplicity, could be a modal
  };

  // Function to load a selected game
  const loadSelectedGame = () => {
    const gameToLoad = savedGames.find(game => game.id === selectedGameToLoad);
    if (gameToLoad) {
      setTeams(gameToLoad.teams);
      setInitialGameTime(gameToLoad.initialGameTime);
      setGameTime(gameToLoad.initialGameTime); // Reset current time to initial time of loaded game
      setNumQuarters(gameToLoad.numQuarters);
      setCurrentQuarter(gameToLoad.currentQuarter);
      setIsRunning(false); // Pause timer on load
      clearInterval(timerRef.current);
      alert('Partido cargado exitosamente!');
    } else {
      alert('Por favor, selecciona un partido para cargar.');
    }
  };

  // Function to delete a selected game
  const deleteSelectedGame = () => {
    if (selectedGameToLoad) {
      setSavedGames(prevGames => prevGames.filter(game => game.id !== selectedGameToLoad));
      setSelectedGameToLoad(''); // Clear selection
      alert('Partido eliminado exitosamente!');
    } else {
      alert('Por favor, selecciona un partido para eliminar.');
    }
  };

  // Function to export current game data to CSV
  const exportGameToCsv = useCallback(() => {
    if (!teams || teams.length === 0) {
      alert('No hay datos del partido para exportar.');
      return;
    }

    let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; // Add BOM for Excel compatibility with UTF-8
    const gameDate = new Date().toLocaleString();

    // Header for Team Totals
    const teamHeader = ["Tipo", "Nombre Equipo", "Puntos", "Faltas", "Robos", "Asistencias", "Tapones", "Rebotes", "Cuartos Totales", "Duracion Cuarto (min)"];
    csvContent += teamHeader.join(";") + "\r\n";

    // Team Totals Data
    teams.forEach(team => {
      const teamRow = [
        "Total Equipo",
        `"${team.name}"`,
        team.score,
        team.fouls,
        team.steals,
        team.assists,
        team.blocks,
        team.rebounds,
        numQuarters,
        Math.floor(initialGameTime / 60)
      ];
      csvContent += teamRow.join(";") + "\r\n";
    });

    csvContent += "\r\n"; // Add a blank line for separation

    // Header for Player Stats
    const playerHeader = ["Equipo", "Nombre Jugador", "Puntos", "Faltas", "Robos", "Asistencias", "Tapones", "Rebotes"];
    csvContent += playerHeader.join(";") + "\r\n";

    // Player Stats Data
    teams.forEach(team => {
      team.players.forEach(player => {
        const playerRow = [
          `"${team.name}"`,
          `"${player.name}"`,
          player.score,
          player.fouls,
          player.steals,
          player.assists,
          player.blocks,
          player.rebounds
        ];
        csvContent += playerRow.join(";") + "\r\n";
      });
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Forasteros_Stats_Partido_${gameDate.replace(/[/:]/g, '-')}.csv`);
    document.body.appendChild(link); // Required for Firefox
    link.click();
    document.body.removeChild(link); // Clean up
  }, [teams, numQuarters, initialGameTime]);


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-800 text-white font-inter p-4 flex flex-col items-center justify-center">
      <div className="bg-gray-900 bg-opacity-80 p-6 md:p-8 rounded-xl shadow-2xl w-full max-w-6xl border border-gray-700">
        <h1 className="text-3xl md:text-4xl font-extrabold text-center mb-6 text-yellow-400 drop-shadow-lg">
          Forasteros Stats
        </h1>

        {/* Game Timer and Quarters Section */}
        <div className="mb-8 text-center bg-gray-800 p-4 rounded-lg shadow-inner border border-gray-700">
          <h2 className="text-2xl md:text-3xl font-bold mb-2 text-purple-300">Tiempo de Juego</h2>
          <div className="text-5xl md:text-6xl font-mono font-extrabold text-green-400 mb-2 drop-shadow-md">
            {formatTime(gameTime)}
          </div>
          <div className="text-xl md:text-2xl font-semibold text-gray-300 mb-4">
            Cuarto: {currentQuarter} / {numQuarters}
          </div>
          <div className="flex flex-wrap justify-center gap-3 mb-4">
            <button
              onClick={startTimer}
              disabled={isRunning || gameTime === 0 || currentQuarter > numQuarters}
              className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-md transition duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Iniciar
            </button>
            <button
              onClick={pauseTimer}
              disabled={!isRunning}
              className="px-5 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold rounded-lg shadow-md transition duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Pausar
            </button>
            <button
              onClick={resetCurrentQuarterTime}
              className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-md transition duration-200 ease-in-out"
            >
              Reiniciar Tiempo
            </button>
            <button
              onClick={nextQuarter}
              disabled={currentQuarter >= numQuarters && gameTime === 0}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente Cuarto
            </button>
          </div>
          {/* Game Duration and Quarters Input */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-4">
            <div className="flex items-center gap-2">
              <label htmlFor="game-duration" className="text-lg text-gray-300">Duración (min):</label>
              <input
                type="number"
                id="game-duration"
                value={Math.floor(initialGameTime / 60)}
                onChange={handleDurationChange}
                min="0"
                className="w-20 bg-gray-700 text-white text-center p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="num-quarters" className="text-lg text-gray-300">Cuartos:</label>
              <input
                type="number"
                id="num-quarters"
                value={numQuarters}
                onChange={handleNumQuartersChange}
                min="1"
                className="w-20 bg-gray-700 text-white text-center p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Save/Load/Export Section */}
        <div className="mb-8 text-center bg-gray-800 p-4 rounded-lg shadow-inner border border-gray-700">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 text-yellow-300">Gestión de Partidos</h2>
          <div className="flex flex-wrap justify-center gap-3 mb-4">
            <button
              onClick={saveCurrentGame}
              className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg shadow-md transition duration-200 ease-in-out"
            >
              Guardar Partido Actual
            </button>
            <button
              onClick={exportGameToCsv}
              className="px-5 py-2 bg-green-700 hover:bg-green-800 text-white font-semibold rounded-lg shadow-md transition duration-200 ease-in-out"
            >
              Exportar a Excel
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
            <label htmlFor="saved-games-select" className="text-lg text-gray-300">Cargar Partido:</label>
            <select
              id="saved-games-select"
              value={selectedGameToLoad}
              onChange={(e) => setSelectedGameToLoad(e.target.value)}
              className="w-48 bg-gray-700 text-white p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">-- Seleccionar --</option>
              {savedGames.map(game => (
                <option key={game.id} value={game.id}>
                  {game.date} - {game.teams[0].name} vs {game.teams[1].name}
                </option>
              ))}
            </select>
            <button
              onClick={loadSelectedGame}
              disabled={!selectedGameToLoad}
              className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white font-semibold rounded-lg shadow-md transition duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cargar
            </button>
            <button
              onClick={deleteSelectedGame}
              disabled={!selectedGameToLoad}
              className="px-5 py-2 bg-red-700 hover:bg-red-800 text-white font-semibold rounded-lg shadow-md transition duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Eliminar
            </button>
          </div>
        </div>

        {/* Teams Statistics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {teams.map(team => (
            <div key={team.id} className="bg-gray-800 p-5 rounded-xl shadow-xl border border-gray-700 flex flex-col">
              {/* Team Name Input */}
              <input
                type="text"
                value={team.name}
                onChange={(e) => handleTeamNameChange(team.id, e.target.value)}
                className="w-full bg-gray-700 text-white text-2xl md:text-3xl font-bold text-center mb-4 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {/* Team Totals */}
              <div className="flex flex-wrap justify-around items-center mb-4 border-b border-gray-700 pb-4 gap-y-4">
                <div className="text-center w-1/2 sm:w-auto">
                  <h3 className="text-xl md:text-2xl font-semibold text-blue-300">Puntos Total</h3>
                  <div className="text-6xl md:text-7xl font-extrabold text-blue-400 drop-shadow-lg">
                    {team.score}
                  </div>
                </div>
                <div className="text-center w-1/2 sm:w-auto">
                  <h3 className="text-xl md:text-2xl font-semibold text-red-300">Faltas Total</h3>
                  <div className="text-4xl md:text-5xl font-extrabold text-red-400 drop-shadow-lg">
                    {team.fouls}
                  </div>
                </div>
                <div className="text-center w-1/2 sm:w-auto">
                  <h3 className="text-lg md:text-xl font-semibold text-green-300">Robos</h3>
                  <div className="text-3xl md:text-4xl font-extrabold text-green-400 drop-shadow-lg">
                    {team.steals}
                  </div>
                </div>
                <div className="text-center w-1/2 sm:w-auto">
                  <h3 className="text-lg md:text-xl font-semibold text-orange-300">Asistencias</h3>
                  <div className="text-3xl md:text-4xl font-extrabold text-orange-400 drop-shadow-lg">
                    {team.assists}
                  </div>
                </div>
                <div className="text-center w-1/2 sm:w-auto">
                  <h3 className="text-lg md:text-xl font-semibold text-cyan-300">Tapones</h3>
                  <div className="text-3xl md:text-4xl font-extrabold text-cyan-400 drop-shadow-lg">
                    {team.blocks}
                  </div>
                </div>
                <div className="text-center w-1/2 sm:w-auto">
                  <h3 className="text-lg md:text-xl font-semibold text-pink-300">Rebotes</h3>
                  <div className="text-3xl md:text-4xl font-extrabold text-pink-400 drop-shadow-lg">
                    {team.rebounds}
                  </div>
                </div>
              </div>

              {/* Players Section */}
              <div className="flex-grow">
                <h3 className="text-xl md:text-2xl font-bold text-center mb-4 text-green-300">Jugadores</h3>
                {team.players.length === 0 && (
                  <p className="text-center text-gray-400 mb-4">Aún no hay jugadores en este equipo.</p>
                )}
                <div className="space-y-4">
                  {team.players.map(player => (
                    <div key={player.id} className="bg-gray-700 p-3 rounded-lg shadow-md flex flex-col sm:flex-row justify-between items-center gap-2"> {/* Reduced gap */}
                      {/* Player Name Input */}
                      <input
                        type="text"
                        value={player.name}
                        onChange={(e) => handlePlayerNameChange(team.id, player.id, e.target.value)}
                        className="text-lg font-semibold text-white w-full sm:w-auto text-center sm:text-left bg-gray-600 p-1 rounded-md focus:outline-none focus:ring-1 focus:ring-white min-w-0"
                      />
                      {/* Player Stats Display - Pts and Flt */}
                      <div className="flex flex-col sm:flex-row sm:space-x-4 w-full sm:w-auto justify-center text-center">
                        <div className="flex items-center justify-center">
                          <span className="text-sm text-blue-300">Pts:</span>
                          <span className="text-xl font-bold text-blue-400 ml-1">{player.score}</span>
                        </div>
                        <div className="flex items-center justify-center">
                          <span className="text-sm text-red-300">Flt:</span>
                          <span className="text-xl font-bold text-red-400 ml-1">{player.fouls}</span>
                        </div>
                      </div>
                      {/* Player Stat Update Buttons - All buttons remain, more compact layout */}
                      <div className="grid grid-cols-3 gap-1 md:flex md:flex-wrap justify-center w-full sm:w-auto"> {/* Changed to grid for small screens */}
                        <button
                          onClick={() => updatePlayerStat(team.id, player.id, 'score', 1)}
                          className="px-2 py-0.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold rounded-md transition duration-200"
                        >
                          +1
                        </button>
                        <button
                          onClick={() => updatePlayerStat(team.id, player.id, 'score', 2)}
                          className="px-2 py-0.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold rounded-md transition duration-200"
                        >
                          +2
                        </button>
                        <button
                          onClick={() => updatePlayerStat(team.id, player.id, 'score', 3)}
                          className="px-2 py-0.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold rounded-md transition duration-200"
                        >
                          +3
                        </button>
                        <button
                          onClick={() => updatePlayerStat(team.id, player.id, 'fouls', 1)}
                          className="px-2 py-0.5 bg-red-500 hover:bg-red-600 text-white text-sm font-bold rounded-md transition duration-200"
                        >
                          +F
                        </button>
                        <button
                          onClick={() => updatePlayerStat(team.id, player.id, 'assists', 1)}
                          className="px-2 py-0.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-md transition duration-200"
                        >
                          +A
                        </button>
                        <button
                          onClick={() => updatePlayerStat(team.id, player.id, 'rebounds', 1)}
                          className="px-2 py-0.5 bg-pink-500 hover:bg-pink-600 text-white text-sm font-bold rounded-md transition duration-200"
                        >
                          +Reb
                        </button>
                        <button
                          onClick={() => updatePlayerStat(team.id, player.id, 'steals', 1)}
                          className="px-2 py-0.5 bg-green-500 hover:bg-green-600 text-white text-sm font-bold rounded-md transition duration-200"
                        >
                          +R
                        </button>
                        <button
                          onClick={() => updatePlayerStat(team.id, player.id, 'blocks', 1)}
                          className="px-2 py-0.5 bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-bold rounded-md transition duration-200"
                        >
                          +T
                        </button>
                        <button
                          onClick={() => removePlayer(team.id, player.id)}
                          className="px-2 py-0.5 bg-gray-500 hover:bg-gray-600 text-white text-sm font-bold rounded-md transition duration-200"
                        >
                          X
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add Player Button */}
              <button
                onClick={() => addPlayer(team.id)}
                className="mt-6 px-5 py-2 bg-purple-500 hover:bg-purple-600 text-white font-semibold rounded-lg shadow-md transition duration-200 ease-in-out"
              >
                Añadir Jugador
              </button>
            </div>
          ))}
        </div>

        {/* Reset Game Button */}
        <div className="text-center mt-6">
          <button
            onClick={resetGame}
            className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-lg rounded-xl shadow-lg transition duration-200 ease-in-out transform hover:scale-105"
          >
            Reiniciar Partido Completo
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;
