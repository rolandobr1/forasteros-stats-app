import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Replace with your actual API key
const API_KEY = "YOUR_API_KEY"; // <<-- RECUERDA REEMPLAZAR CON TU CLAVE API
if (API_KEY === "YOUR_API_KEY" || !API_KEY) {
    console.warn("ADVERTENCIA: Por favor, reemplaza 'YOUR_API_KEY' con tu clave API de Google Gemini.");
}

// Inicializa el modelo de IA de Google
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

// Componente de diálogo de alerta personalizado
const AlertDialog = ({ message, onClose }) => {
    if (!message) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[100]">
            <div className="bg-gray-800 p-6 rounded-lg shadow-xl max-w-sm w-full text-center border border-gray-700">
                <p className="text-white text-lg mb-4">{message}</p>
                <button
                    onClick={onClose}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-200"
                >
                    Entendido
                </button>
            </div>
        </div>
    );
};

// Componente principal de la aplicación
function App() {
    const [page, setPage] = useState('home'); // 'home', 'setupGame', 'game', 'history', 'roster'
    const [timer, setTimer] = useState(0);
    const [initialGameTime, setInitialGameTime] = useState(600); // Default 10 minutes (600 seconds)
    const [isRunning, setIsRunning] = useState(false);
    // showPlayerStatsModal ahora almacena un objeto { playerId, teamId }
    const [showPlayerStatsModal, setShowPlayerStatsModal] = useState(null); 
    const [teamA, setTeamA] = useState({ name: 'Local', players: [], lastAction: null }); // Añadido lastAction
    const [teamB, setTeamB] = useState({ name: 'Visitante', players: [], lastAction: null }); // Añadido lastAction
    const [history, setHistory] = useState(() => {
        // Cargar historial de localStorage
        const savedHistory = localStorage.getItem('forasterosHistory');
        return savedHistory ? JSON.parse(savedHistory) : [];
    });
    const [rosterPlayers, setRosterPlayers] = useState(() => {
        // Cargar plantilla de localStorage
        const savedRoster = localStorage.getItem('forasterosRoster');
        return savedRoster ? JSON.parse(savedRoster) : [];
    });
    const [showRosterSelectionModalForTeam, setShowRosterSelectionModalForTeam] = useState(null); // 'Local' o 'Visitante' para el modal de selección
    
    // Estado para el AlertDialog
    const [alertMessage, setAlertMessage] = useState('');
    const [timeUpMessage, setTimeUpMessage] = useState(''); // Mensaje para cuando el tiempo se agota

    const intervalRef = useRef(null);

    // Efecto para el temporizador
    useEffect(() => {
        if (isRunning) {
            intervalRef.current = setInterval(() => {
                setTimer(prevTime => {
                    if (prevTime <= 1) { // Stop at 0
                        clearInterval(intervalRef.current);
                        setIsRunning(false);
                        setTimeUpMessage("¡Tiempo Finalizado!");
                        return 0;
                    }
                    return prevTime - 1;
                });
            }, 1000);
        } else {
            clearInterval(intervalRef.current);
        }
        return () => clearInterval(intervalRef.current);
    }, [isRunning]);

    // Efecto para guardar historial en localStorage
    useEffect(() => {
        localStorage.setItem('forasterosHistory', JSON.stringify(history));
    }, [history]);

    // Efecto para guardar plantilla en localStorage
    useEffect(() => {
        localStorage.setItem('forasterosRoster', JSON.stringify(rosterPlayers));
    }, [rosterPlayers]);

    // Formato del temporizador
    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    // Función para añadir un jugador a la plantilla (Gestión de plantilla)
    const addRosterPlayer = (playerData) => {
        setRosterPlayers(prev => {
            // Asegurarse de que el número de camiseta sea único
            const isJerseyTaken = prev.some(p => p.jersey === playerData.jersey);
            if (isJerseyTaken) {
                setAlertMessage(`El número de camiseta ${playerData.jersey} ya está en uso.`);
                return prev;
            }
            return [...prev, { id: crypto.randomUUID(), ...playerData }]; // Usar crypto.randomUUID()
        });
    };

    // Función para actualizar un jugador de la plantilla
    const updateRosterPlayer = (playerId, newData) => {
        setRosterPlayers(prev => prev.map(p => p.id === playerId ? { ...p, ...newData } : p));
    };

    // Función para eliminar un jugador de la plantilla
    const removeRosterPlayer = (playerId) => {
        setRosterPlayers(prev => prev.filter(p => p.id !== playerId));
    };

    // Función para añadir un jugador del roster a un equipo de juego
    const addPlayerToTeamFromRoster = (teamId, rosterPlayer) => {
        const newPlayer = {
            id: crypto.randomUUID(), // Nuevo ID único para la instancia del juego
            name: rosterPlayer.name,
            jersey: rosterPlayer.jersey,
            score: 0,
            rebounds: 0,
            assists: 0,
            steals: 0,
            blocks: 0,
            turnovers: 0,
            fouls: 0,
            made2pt: 0,
            missed2pt: 0,
            made3pt: 0,
            missed3pt: 0,
            madeFT: 0,
            missedFT: 0,
        };

        const currentTeamPlayers = getTeam(teamId).players;
        // Evitar añadir el mismo jugador (por número de camiseta) dos veces al mismo equipo
        if (currentTeamPlayers.some(p => p.jersey === newPlayer.jersey)) {
            setAlertMessage(`El jugador con el número ${newPlayer.jersey} ya está en este equipo.`);
            return;
        }

        if (teamId === teamA.name) {
            setTeamA(prev => ({ ...prev, players: [...prev.players, newPlayer] }));
        } else {
            setTeamB(prev => ({ ...prev, players: [...prev.players, newPlayer] }));
        }
        setShowRosterSelectionModalForTeam(null); // Cerrar modal después de seleccionar
    };

    // Función para eliminar un jugador del equipo de juego
    const removePlayer = (teamId, playerId) => {
        if (teamId === teamA.name) {
            setTeamA(prev => ({ ...prev, players: prev.players.filter(p => p.id !== playerId) }));
        } else {
            setTeamB(prev => ({ ...prev, players: prev.players.filter(p => p.id !== playerId) }));
        }
    };

    // Obtener equipo por ID
    const getTeam = (teamId) => (teamId === teamA.name ? teamA : teamB);

    // Manejar el cambio de nombre de jugador (en juego)
    const handlePlayerNameChange = (teamId, playerId, newName) => {
        const updateTeam = (prevTeam) => ({
            ...prevTeam,
            players: prevTeam.players.map(p =>
                p.id === playerId ? { ...p, name: newName } : p
            ),
        });
        if (teamId === teamA.name) {
            setTeamA(updateTeam);
        } else {
            setTeamB(updateTeam);
        }
    };

    // Función para actualizar estadísticas y registrar la última acción por equipo
    const updatePlayerStat = (teamId, playerId, stat, value) => {
        const setTeamState = teamId === teamA.name ? setTeamA : setTeamB;
        const currentTeam = teamId === teamA.name ? teamA : teamB;

        const playerToUpdate = currentTeam.players.find(p => p.id === playerId);

        if (!playerToUpdate) {
            console.error(`Player with ID ${playerId} not found in team ${currentTeam.name}.`);
            return;
        }

        // Capturar el estado actual del jugador ANTES de la actualización
        const prevPlayerState = { ...playerToUpdate };

        setTeamState(prevTeam => {
            const updatedPlayers = prevTeam.players.map(player => {
                if (player.id === playerId) {
                    const newPlayer = { ...player };
                    switch (stat) {
                        case '2PM': newPlayer.made2pt += value; newPlayer.score += (value * 2); break;
                        case '2PTM': newPlayer.missed2pt += value; break;
                        case '3PM': newPlayer.made3pt += value; newPlayer.score += (value * 3); break;
                        case '3PTM': newPlayer.missed3pt += value; break;
                        case 'FTM': newPlayer.madeFT += value; newPlayer.score += value; break;
                        case 'FTT': newPlayer.missedFT += value; break;
                        case 'REB': newPlayer.rebounds += value; break;
                        case 'AST': newPlayer.assists += value; break;
                        case 'STL': newPlayer.steals += value; break;
                        case 'BLK': newPlayer.blocks += value; break;
                        case 'TOV': newPlayer.turnovers += value; break;
                        case 'FLT': newPlayer.fouls += value; break;
                        default: break;
                    }
                    return newPlayer;
                }
                return player;
            });
            return {
                ...prevTeam,
                players: updatedPlayers,
                lastAction: {
                    playerId: playerId,
                    stat: stat,
                    valueApplied: value,
                    prevPlayerState: prevPlayerState // Estado del jugador antes de esta acción
                }
            };
        });
    };

    // Función para deshacer la última acción de un equipo específico
    const handleTeamUndo = (teamId) => {
        const setTeamState = teamId === teamA.name ? setTeamA : setTeamB;
        const currentTeam = teamId === teamA.name ? teamA : teamB;

        if (!currentTeam.lastAction) return;

        const { playerId, prevPlayerState } = currentTeam.lastAction;

        setTeamState(prevTeam => ({
            ...prevTeam,
            players: prevTeam.players.map(player => {
                if (player.id === playerId) {
                    return prevPlayerState; // Revertir al estado previo del jugador
                }
                return player;
            }),
            lastAction: null // Limpiar la última acción después de deshacer
        }));
    };

    // Manejar el fin del partido
    const handleEndGame = () => {
        setIsRunning(false);
        const gameSummary = {
            id: crypto.randomUUID(), // Usar crypto.randomUUID()
            date: new Date().toLocaleString(),
            duration: formatTime(initialGameTime - timer), // Duración real del partido
            teamA: {
                name: teamA.name,
                score: teamA.players.reduce((acc, p) => acc + p.score, 0),
                players: teamA.players,
            },
            teamB: {
                name: teamB.name,
                score: teamB.players.reduce((acc, p) => acc + p.score, 0),
                players: teamB.players,
            },
        };
        setHistory(prev => [...prev, gameSummary]);
        setPage('history');
        resetGame(); // Resetea el juego para el siguiente partido
    };

    // Función para generar jugadores por defecto
    const generateDefaultPlayers = (teamName, count = 5) => {
        const players = [];
        for (let i = 1; i <= count; i++) {
            players.push({
                id: crypto.randomUUID(), // Asegura un ID único para cada jugador
                name: `${teamName} Jugador ${i}`,
                jersey: i, // Números de camiseta simples 1-5
                score: 0,
                rebounds: 0,
                assists: 0,
                steals: 0,
                blocks: 0,
                turnovers: 0,
                fouls: 0,
                made2pt: 0,
                missed2pt: 0,
                made3pt: 0,
                missed3pt: 0,
                madeFT: 0,
                missedFT: 0,
            });
        }
        return players;
    };

    // Resetear el estado del juego y añadir jugadores por defecto
    const resetGame = () => {
        setTimer(initialGameTime); // Set timer to initial configured time
        setIsRunning(false);
        setTeamA({ name: 'Local', players: generateDefaultPlayers('Local'), lastAction: null }); // Limpiar lastAction
        setTeamB({ name: 'Visitante', players: generateDefaultPlayers('Visitante'), lastAction: null }); // Limpiar lastAction
        setShowPlayerStatsModal(null);
        setShowRosterSelectionModalForTeam(null);
        setTimeUpMessage(''); // Limpiar mensaje de tiempo finalizado
    };

    // Componente para la página de inicio
    const HomePage = () => (
        <div className="flex flex-col items-center justify-center min-h-screen text-white p-4">
            <h1 className="text-4xl font-bold mb-4 text-forasteros-title">Forasteros Stats App</h1>
            <img
                src="https://i.imgur.com/Wn0F6h5.png"
                alt="Logo Forasteros BBC"
                className="w-48 h-48 mb-8 rounded-full shadow-lg"
            />
            <div className="flex flex-col space-y-4 w-full max-w-sm">
                <button
                    onClick={() => setPage('setupGame')} // Ir a la página de configuración
                    className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg text-lg transition transform hover:scale-105"
                >
                    Iniciar Nuevo Partido
                </button>
                <button
                    onClick={() => setPage('roster')}
                    className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg text-lg transition transform hover:scale-105"
                >
                    Gestionar Plantilla de Jugadores
                </button>
                <button
                    onClick={() => setPage('history')}
                    className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg text-lg transition transform hover:scale-105"
                >
                    Historial de Partidos
                </button>
            </div>
            <p className="mt-8 text-gray-400 text-sm">Desarrollado por Forasteros lb</p>
        </div>
    );

    // Nuevo componente para configurar el tiempo del juego
    const GameSetupPage = () => {
        const [minutes, setMinutes] = useState(10); // Default 10 minutes

        const handleStartGame = () => {
            if (minutes <= 0 || isNaN(minutes)) {
                setAlertMessage("Por favor, introduce un número de minutos válido y positivo.");
                return;
            }
            setInitialGameTime(minutes * 60); // Convert minutes to seconds
            setTimer(minutes * 60); // Set initial timer value
            resetGame(); // Reset players and other game states
            setPage('game'); // Navigate to game page
        };

        return (
            <div className="min-h-screen flex flex-col items-center justify-center text-white p-4">
                <h2 className="text-4xl font-bold mb-8 text-blue-400">Configurar Partido</h2>
                <div className="bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700 flex flex-col items-center space-y-6 max-w-sm w-full">
                    <label htmlFor="game-minutes" className="text-lg font-semibold text-gray-300">Duración del Partido (minutos):</label>
                    <input
                        id="game-minutes"
                        type="number"
                        value={minutes}
                        onChange={(e) => setMinutes(parseInt(e.target.value) || 0)}
                        min="1"
                        className="w-full p-3 rounded-md bg-gray-700 text-white text-center text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        onClick={handleStartGame}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg text-lg transition transform hover:scale-105 w-full"
                    >
                        Comenzar Partido
                    </button>
                    <button
                        onClick={() => setPage('home')}
                        className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg text-sm shadow-md transition duration-200 w-full"
                    >
                        &larr; Volver
                    </button>
                </div>
            </div>
        );
    };

    // Componente para la página de gestión de plantilla
    const RosterManagementPage = () => {
        const [newPlayerName, setNewPlayerName] = useState('');
        const [newPlayerJersey, setNewPlayerJersey] = useState('');
        const [editingPlayerId, setEditingPlayerId] = useState(null);
        const [editPlayerName, setEditPlayerName] = useState('');
        const [editPlayerJersey, setEditPlayerJersey] = useState('');

        const handleAddPlayer = (e) => {
            e.preventDefault();
            if (newPlayerName.trim() === '' || newPlayerJersey.trim() === '') {
                setAlertMessage('El nombre y número de camiseta no pueden estar vacíos.');
                return;
            }
            const jersey = parseInt(newPlayerJersey);
            if (isNaN(jersey) || jersey <= 0) {
                setAlertMessage('El número de camiseta debe ser un número positivo.');
                return;
            }
            if (rosterPlayers.some(p => p.jersey === jersey)) {
                setAlertMessage(`El número de camiseta ${jersey} ya está en uso.`);
                return;
            }
            addRosterPlayer({ name: newPlayerName.trim(), jersey });
            setNewPlayerName('');
            setNewPlayerJersey('');
        };

        const handleEditClick = (player) => {
            setEditingPlayerId(player.id);
            setEditPlayerName(player.name);
            setEditPlayerJersey(player.jersey.toString());
        };

        const handleUpdatePlayer = (e) => {
            e.preventDefault();
            if (editPlayerName.trim() === '' || editPlayerJersey.trim() === '') {
                setAlertMessage('El nombre y número de camiseta no pueden estar vacíos.');
                return;
            }
            const jersey = parseInt(editPlayerJersey);
            if (isNaN(jersey) || jersey <= 0) {
                setAlertMessage('El número de camiseta debe ser un número positivo.');
                return;
            }
            // Check for unique jersey only if it's changing and not the current player's jersey
            const isJerseyTakenByAnotherPlayer = rosterPlayers.some(p => p.jersey === jersey && p.id !== editingPlayerId);
            if (isJerseyTakenByAnotherPlayer) {
                setAlertMessage(`El número de camiseta ${jersey} ya está en uso por otro jugador.`);
                return;
            }

            updateRosterPlayer(editingPlayerId, { name: editPlayerName.trim(), jersey });
            setEditingPlayerId(null);
            setEditPlayerName('');
            setEditPlayerJersey('');
        };

        return (
            <div className="min-h-screen text-white p-4">
                <div className="flex justify-between items-center mb-6">
                    <button
                        onClick={() => setPage('home')}
                        className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg text-sm shadow-md transition duration-200"
                    >
                        &larr; Volver
                    </button>
                    <h2 className="text-3xl font-bold text-purple-400">Gestionar Plantilla</h2>
                </div>

                {/* Formulario para añadir nuevo jugador */}
                <div className="bg-gray-800 p-6 rounded-lg shadow-xl mb-6">
                    <h3 className="text-xl font-bold text-white mb-4">Añadir Nuevo Jugador</h3>
                    <form onSubmit={handleAddPlayer} className="flex flex-col sm:flex-row gap-4">
                        <input
                            type="text"
                            placeholder="Nombre del Jugador"
                            value={newPlayerName}
                            onChange={(e) => setNewPlayerName(e.target.value)}
                            className="flex-grow bg-gray-700 text-white p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <input
                            type="number"
                            placeholder="Número de Camiseta"
                            value={newPlayerJersey}
                            onChange={(e) => setNewPlayerJersey(e.target.value)}
                            className="w-28 bg-gray-700 text-white p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <button
                            type="submit"
                            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition duration-200"
                        >
                            Añadir
                        </button>
                    </form>
                </div>

                {/* Lista de jugadores en la plantilla */}
                <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
                    <h3 className="text-xl font-bold text-white mb-4">Jugadores en Plantilla</h3>
                    {rosterPlayers.length === 0 ? (
                        <p className="text-gray-400">No hay jugadores en la plantilla. ¡Añade algunos!</p>
                    ) : (
                        <div className="space-y-3">
                            {rosterPlayers.map(player => (
                                <div key={player.id} className="bg-gray-700 p-3 rounded-md flex flex-col sm:flex-row items-center justify-between gap-3">
                                    {editingPlayerId === player.id ? (
                                        <form onSubmit={handleUpdatePlayer} className="flex flex-col sm:flex-row gap-3 w-full">
                                            <input
                                                type="text"
                                                value={editPlayerName}
                                                onChange={(e) => setEditPlayerName(e.target.value)}
                                                className="flex-grow bg-gray-600 text-white p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <input
                                                type="number"
                                                value={editPlayerJersey}
                                                onChange={(e) => setEditPlayerJersey(e.target.value)}
                                                className="w-24 bg-gray-600 text-white p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <div className="flex gap-2">
                                                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 px-3 rounded-md">Guardar</button>
                                                <button type="button" onClick={() => setEditingPlayerId(null)} className="bg-gray-500 hover:bg-gray-600 text-white text-sm py-2 px-3 rounded-md">Cancelar</button>
                                            </div>
                                        </form>
                                    ) : (
                                        <>
                                            <span className="text-lg font-semibold">{player.name} <span className="text-gray-400">#{player.jersey}</span></span>
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleEditClick(player)}
                                                    className="bg-yellow-500 hover:bg-yellow-600 text-white text-sm py-2 px-3 rounded-md"
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    onClick={() => removeRosterPlayer(player.id)}
                                                    className="bg-red-500 hover:bg-red-600 text-white text-sm py-2 px-3 rounded-md"
                                                >
                                                    Eliminar
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    };


    // Componente para la página del juego
    const GamePage = () => {
        const currentTeamA = getTeam(teamA.name);
        const currentTeamB = getTeam(teamB.name);

        const currentScoreA = currentTeamA.players.reduce((acc, p) => acc + p.score, 0);
        const currentScoreB = currentTeamB.players.reduce((acc, p) => acc + p.score, 0);

        return (
            <div className="min-h-screen text-white p-4">
                <div className="flex flex-col items-center justify-between mb-6 sm:flex-row">
                    <button
                        onClick={() => setPage('home')}
                        className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg text-sm shadow-md transition duration-200 mb-4 sm:mb-0"
                    >
                        &larr; Volver
                    </button>
                    <h2 className="text-3xl font-bold text-blue-400 mb-4 sm:mb-0">Partido Actual</h2>
                    <div className="text-5xl font-extrabold bg-gray-800 py-3 px-6 rounded-lg shadow-inner text-center w-full sm:w-auto">
                        {formatTime(timer)}
                    </div>
                </div>

                {/* Controles del temporizador */}
                <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-6">
                    <button
                        onClick={() => setIsRunning(!isRunning)}
                        className={`py-2 px-6 rounded-lg font-bold text-lg shadow-lg transition duration-200 ${
                            isRunning ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'
                        }`}
                    >
                        {isRunning ? 'Pausar' : 'Iniciar'}
                    </button>
                    <button
                        onClick={resetGame}
                        className="bg-red-600 hover:bg-red-700 text-white py-2 px-6 rounded-lg font-bold text-lg shadow-lg transition duration-200"
                    >
                        Reiniciar
                    </button>
                    <button
                        onClick={handleEndGame}
                        className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-6 rounded-lg font-bold text-lg shadow-lg transition duration-200"
                    >
                        Finalizar Partido
                    </button>
                </div>

                {/* Mensaje de tiempo finalizado */}
                {timeUpMessage && (
                    <div className="text-center text-red-400 text-2xl font-bold mb-4 animate-pulse">
                        {timeUpMessage}
                    </div>
                )}

                {/* Marcador */}
                <div className="flex justify-around items-center bg-gray-800 p-4 rounded-lg shadow-xl mb-6">
                    <h3 className="text-2xl font-bold text-blue-300">{currentTeamA.name}: {currentScoreA}</h3>
                    <span className="text-3xl font-extrabold text-white mx-4">-</span>
                    <h3 className="text-2xl font-bold text-red-300">{currentTeamB.name}: {currentScoreB}</h3>
                </div>

                {/* Listas de jugadores de ambos equipos */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Equipo Local */}
                    <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-2xl font-bold text-blue-400">{teamA.name}</h3>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => handleTeamUndo(teamA.name)}
                                    disabled={!teamA.lastAction}
                                    className={`py-1 px-3 rounded-lg font-bold text-sm transition duration-200 ${
                                        teamA.lastAction ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                    }`}
                                >
                                    <span className="mr-1">↩️</span> Deshacer
                                </button>
                                <button
                                    onClick={() => setShowRosterSelectionModalForTeam(teamA.name)}
                                    className="bg-blue-500 hover:bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-xl font-bold shadow-md transition duration-200"
                                    title="Añadir Jugador de Plantilla"
                                >
                                    +
                                </button>
                            </div>
                        </div>
                        <div className="space-y-4">
                            {teamA.players.map(player => {
                                const fieldGoalMade = player.made2pt + player.made3pt;
                                const fieldGoalAttempts = (player.made2pt + player.missed2pt) + (player.made3pt + player.missed3pt);
                                const fieldGoalPercentageDisplay = fieldGoalAttempts > 0 ? ((fieldGoalMade / fieldGoalAttempts) * 100).toFixed(1) : '0.0';

                                return (
                                    <div
                                        key={player.id}
                                        // Pasar playerId y teamId al modal
                                        onClick={isRunning ? () => setShowPlayerStatsModal({ playerId: player.id, teamId: teamA.name }) : undefined}
                                        className={`
                                            bg-gray-600 p-3 rounded-lg shadow-md flex flex-col gap-2 transition duration-200 ease-in-out
                                            ${isRunning ? 'cursor-pointer hover:bg-gray-500' : 'cursor-default'}
                                            sm:flex-row sm:items-center sm:justify-between // Contenedor principal del jugador
                                        `}
                                    >
                                        {!isRunning && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removePlayer(teamA.name, player.id);
                                                }}
                                                className="rounded-full bg-red-500 hover:bg-red-600 text-white w-7 h-7 flex items-center justify-center text-sm font-bold transition duration-200 flex-shrink-0 shadow-sm"
                                                title="Eliminar Jugador del Partido"
                                            >
                                                -
                                            </button>
                                        )}

                                        <div className="
                                            flex flex-col items-center w-full gap-2
                                            sm:flex-row sm:justify-between sm:w-auto sm:flex-grow
                                        ">
                                            {/* Nombre y Número del Jugador */}
                                            <div className="flex items-center gap-1 w-full text-center sm:w-auto sm:text-left justify-center sm:justify-start">
                                                <span className="text-sm text-gray-300">#</span>
                                                <span className="text-base font-semibold text-white">{player.jersey}</span>
                                                <input
                                                    type="text"
                                                    value={player.name}
                                                    onChange={(e) => handlePlayerNameChange(teamA.name, player.id, e.target.value)}
                                                    readOnly={isRunning}
                                                    onClick={(e) => { e.stopPropagation(); }} // Stop propagation to prevent modal from opening when editing name
                                                    className={`
                                                        text-base font-semibold text-white w-full text-center bg-gray-700 p-1 rounded-md
                                                        focus:outline-none focus:ring-2 focus:ring-white min-w-0 flex-grow
                                                        ${isRunning ? 'cursor-pointer opacity-90' : ''}
                                                        sm:w-auto sm:text-left
                                                    `}
                                                />
                                            </div>

                                            {/* Estadísticas del Jugador: Puntos, Faltas, % Tiro Campo - REVISADO */}
                                            <div className="
                                                flex flex-row justify-around w-full gap-x-1 items-center
                                                sm:justify-center sm:space-x-3 sm:w-auto
                                            ">
                                                <div className="flex flex-col items-center justify-center min-w-[35px]">
                                                    <span className="text-xs text-blue-300 sm:text-sm">Pts:</span>
                                                    <span className="text-lg font-bold text-blue-400 sm:text-xl">{player.score}</span>
                                                </div>
                                                <div className="flex flex-col items-center justify-center min-w-[35px]">
                                                    <span className="text-xs text-red-300 sm:text-sm">Flt:</span>
                                                    <span className="text-lg font-bold text-red-400 sm:text-xl">{player.fouls}</span>
                                                </div>
                                                <div className="flex flex-col items-center justify-center min-w-[70px]">
                                                    <span className="text-xs text-purple-300 sm:text-sm">TC%:</span>
                                                    <span className="text-lg font-bold text-purple-400 sm:text-xl">{fieldGoalPercentageDisplay}%</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Equipo Visitante - Similar al Local */}
                    <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-2xl font-bold text-red-400">{teamB.name}</h3>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => handleTeamUndo(teamB.name)}
                                    disabled={!teamB.lastAction}
                                    className={`py-1 px-3 rounded-lg font-bold text-sm transition duration-200 ${
                                        teamB.lastAction ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                    }`}
                                >
                                    <span className="mr-1">↩️</span> Deshacer
                                </button>
                                <button
                                    onClick={() => setShowRosterSelectionModalForTeam(teamB.name)}
                                    className="bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-xl font-bold shadow-md transition duration-200"
                                    title="Añadir Jugador de Plantilla"
                                >
                                    +
                                </button>
                            </div>
                        </div>
                        <div className="space-y-4">
                            {teamB.players.map(player => {
                                const fieldGoalMade = player.made2pt + player.made3pt;
                                const fieldGoalAttempts = (player.made2pt + player.missed2pt) + (player.made3pt + player.missed3pt);
                                const fieldGoalPercentageDisplay = fieldGoalAttempts > 0 ? ((fieldGoalMade / fieldGoalAttempts) * 100).toFixed(1) : '0.0';

                                return (
                                    <div
                                        key={player.id}
                                        // Pasar playerId y teamId al modal
                                        onClick={isRunning ? () => setShowPlayerStatsModal({ playerId: player.id, teamId: teamB.name }) : undefined}
                                        className={`
                                            bg-gray-600 p-3 rounded-lg shadow-md flex flex-col gap-2 transition duration-200 ease-in-out
                                            ${isRunning ? 'cursor-pointer hover:bg-gray-500' : 'cursor-default'}
                                            sm:flex-row sm:items-center sm:justify-between // Contenedor principal del jugador
                                        `}
                                    >
                                        {!isRunning && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removePlayer(teamB.name, player.id);
                                                }}
                                                className="rounded-full bg-red-500 hover:bg-red-600 text-white w-7 h-7 flex items-center justify-center text-sm font-bold transition duration-200 flex-shrink-0 shadow-sm"
                                                title="Eliminar Jugador"
                                            >
                                                -
                                            </button>
                                        )}

                                        <div className="
                                            flex flex-col items-center w-full gap-2
                                            sm:flex-row sm:justify-between sm:w-auto sm:flex-grow
                                        ">
                                            {/* Nombre y Número del Jugador */}
                                            <div className="flex items-center gap-1 w-full text-center sm:w-auto sm:text-left justify-center sm:justify-start">
                                                <span className="text-sm text-gray-300">#</span>
                                                <span className="text-base font-semibold text-white">{player.jersey}</span>
                                                <input
                                                    type="text"
                                                    value={player.name}
                                                    onChange={(e) => handlePlayerNameChange(teamB.name, player.id, e.target.value)}
                                                    readOnly={isRunning}
                                                    onClick={(e) => { e.stopPropagation(); }} // Stop propagation to prevent modal from opening when editing name
                                                    className={`
                                                        text-base font-semibold text-white w-full text-center bg-gray-700 p-1 rounded-md
                                                        focus:outline-none focus:ring-2 focus:ring-white min-w-0 flex-grow
                                                        ${isRunning ? 'cursor-pointer opacity-90' : ''}
                                                        sm:w-auto sm:text-left
                                                    `}
                                                />
                                            </div>

                                            {/* Estadísticas del Jugador: Puntos, Faltas, % Tiro Campo - REVISADO */}
                                            <div className="
                                                flex flex-row justify-around w-full gap-x-1 items-center
                                                sm:justify-center sm:space-x-3 sm:w-auto
                                            ">
                                                <div className="flex flex-col items-center justify-center min-w-[35px]">
                                                    <span className="text-xs text-blue-300 sm:text-sm">Pts:</span>
                                                    <span className="text-lg font-bold text-blue-400 sm:text-xl">{player.score}</span>
                                                </div>
                                                <div className="flex flex-col items-center justify-center min-w-[35px]">
                                                    <span className="text-xs text-red-300 sm:text-sm">Flt:</span>
                                                    <span className="text-lg font-bold text-red-400 sm:text-xl">{player.fouls}</span>
                                                </div>
                                                <div className="flex flex-col items-center justify-center min-w-[70px]">
                                                    <span className="text-xs text-purple-300 sm:text-sm">TC%:</span>
                                                    <span className="text-lg font-bold text-purple-400 sm:text-xl">{fieldGoalPercentageDisplay}%</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Modal de estadísticas del jugador */}
                {showPlayerStatsModal && (
                    <PlayerStatsModal
                        playerId={showPlayerStatsModal.playerId}
                        teamId={showPlayerStatsModal.teamId} // Pasa el teamId directamente
                        teamA={teamA}
                        teamB={teamB}
                        updatePlayerStat={updatePlayerStat}
                        onClose={() => setShowPlayerStatsModal(null)}
                    />
                )}

                {/* Modal de selección de jugador de la plantilla */}
                {showRosterSelectionModalForTeam && (
                    <PlayerSelectionModal
                        rosterPlayers={rosterPlayers}
                        currentTeamPlayers={showRosterSelectionModalForTeam === teamA.name ? teamA.players : teamB.players}
                        onSelectPlayer={(player) => addPlayerToTeamFromRoster(showRosterSelectionModalForTeam, player)}
                        onClose={() => setShowRosterSelectionModalForTeam(null)}
                    />
                )}
            </div>
        );
    };

    // Componente del modal de estadísticas del jugador
    const PlayerStatsModal = ({ playerId, teamId, teamA, teamB, updatePlayerStat, onClose }) => {
        // Encuentra el jugador usando el teamId y playerId pasados
        const currentTeam = teamId === teamA.name ? teamA : teamB;
        const player = currentTeam.players.find(p => p.id === playerId);

        if (!player) {
            console.error(`Error: Jugador con ID ${playerId} no encontrado en el equipo ${teamId}.`);
            onClose(); // Cierra el modal si el jugador no se encuentra
            return null;
        }

        // Función local para manejar la actualización de estadísticas
        const handleStatUpdate = (stat, value) => {
            updatePlayerStat(teamId, player.id, stat, value);
            onClose(); // Cierra el modal automáticamente después de actualizar la estadística
        };

        // Cálculos para porcentajes de tiro
        const total2ptAttempts = player.made2pt + player.missed2pt;
        const total3ptAttempts = player.made3pt + player.missed3pt;
        const totalFTAttempts = player.madeFT + player.missedFT;

        const fgPercentage = (total2ptAttempts + total3ptAttempts) > 0 ? ((player.made2pt + player.made3pt) / (total2ptAttempts + total3ptAttempts) * 100).toFixed(1) : '0.0';
        const threePtPercentage = total3ptAttempts > 0 ? (player.made3pt / total3ptAttempts * 100).toFixed(1) : '0.0';
        const ftPercentage = totalFTAttempts > 0 ? (player.madeFT / totalFTAttempts * 100).toFixed(1) : '0.0';

        return (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md border border-gray-700">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-2xl font-bold text-white">
                            {player.name} <span className="text-gray-400 text-lg">#{player.jersey}</span>
                        </h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white text-3xl leading-none"
                        >
                            &times;
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                        {/* Puntos de campo */}
                        <div className="bg-gray-700 p-3 rounded-md flex flex-col items-center">
                            <span className="text-blue-400 text-sm">Puntos de Campo</span>
                            <div className="flex space-x-2 mt-1">
                                <button onClick={() => handleStatUpdate('2PM', 1)} className="bg-blue-600 hover:bg-blue-700 text-white rounded-md px-3 py-1 text-sm font-bold">+2PM</button>
                                <button onClick={() => handleStatUpdate('2PTM', 1)} className="bg-red-600 hover:bg-red-700 text-white rounded-md px-3 py-1 text-sm font-bold flex items-center justify-center">
                                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path>
                                    </svg>
                                    2PTM
                                </button>
                            </div>
                        </div>

                        {/* Puntos de 3 */}
                        <div className="bg-gray-700 p-3 rounded-md flex flex-col items-center">
                            <span className="text-green-400 text-sm">Puntos de 3</span>
                            <div className="flex space-x-2 mt-1">
                                <button onClick={() => handleStatUpdate('3PM', 1)} className="bg-green-600 hover:bg-green-700 text-white rounded-md px-3 py-1 text-sm font-bold">+3PM</button>
                                <button onClick={() => handleStatUpdate('3PTM', 1)} className="bg-red-600 hover:bg-red-700 text-white rounded-md px-3 py-1 text-sm font-bold flex items-center justify-center">
                                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path>
                                    </svg>
                                    3PTM
                                </button>
                            </div>
                        </div>

                        {/* Tiros Libres */}
                        <div className="bg-gray-700 p-3 rounded-md flex flex-col items-center">
                            <span className="text-yellow-400 text-sm">Tiros Libres</span>
                            <div className="flex space-x-2 mt-1">
                                <button onClick={() => handleStatUpdate('FTM', 1)} className="bg-yellow-600 hover:bg-yellow-700 text-white rounded-md px-3 py-1 text-sm font-bold">+FTM</button>
                                <button onClick={() => handleStatUpdate('FTT', 1)} className="bg-red-600 hover:bg-red-700 text-white rounded-md px-3 py-1 text-sm font-bold flex items-center justify-center">
                                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path>
                                    </svg>
                                    FTT
                                </button>
                            </div>
                        </div>

                        {/* Rebotes */}
                        <div className="bg-gray-700 p-3 rounded-md flex flex-col items-center">
                            <span className="text-purple-400 text-sm">Rebotes</span>
                            <button onClick={() => handleStatUpdate('REB', 1)} className="bg-purple-600 hover:bg-purple-700 text-white rounded-md px-3 py-1 mt-1 text-sm font-bold">+REB</button>
                        </div>
                        {/* Asistencias */}
                        <div className="bg-gray-700 p-3 rounded-md flex flex-col items-center">
                            <span className="text-pink-400 text-sm">Asistencias</span>
                            <button onClick={() => handleStatUpdate('AST', 1)} className="bg-pink-600 hover:bg-pink-700 text-white rounded-md px-3 py-1 mt-1 text-sm font-bold">+AST</button>
                        </div>
                        {/* Robos */}
                        <div className="bg-gray-700 p-3 rounded-md flex flex-col items-center">
                            <span className="text-teal-400 text-sm">Robos</span>
                            <button onClick={() => handleStatUpdate('STL', 1)} className="bg-teal-600 hover:bg-teal-700 text-white rounded-md px-3 py-1 mt-1 text-sm font-bold">+STL</button>
                        </div>
                        {/* Bloqueos */}
                        <div className="bg-gray-700 p-3 rounded-md flex flex-col items-center">
                            <span className="text-indigo-400 text-sm">Bloqueos</span>
                            <button onClick={() => handleStatUpdate('BLK', 1)} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-md px-3 py-1 mt-1 text-sm font-bold">+BLK</button>
                        </div>
                        {/* Pérdidas */}
                        <div className="bg-gray-700 p-3 rounded-md flex flex-col items-center">
                            <span className="text-orange-400 text-sm">Pérdidas</span>
                            <button onClick={() => handleStatUpdate('TOV', 1)} className="bg-orange-600 hover:bg-orange-600 text-white rounded-md px-3 py-1 mt-1 text-sm font-bold">+TOV</button>
                        </div>
                        {/* Faltas */}
                        <div className="bg-gray-700 p-3 rounded-md flex flex-col items-center">
                            <span className="text-red-400 text-sm">Faltas</span>
                            <button onClick={() => handleStatUpdate('FLT', 1)} className="bg-red-600 hover:bg-red-700 text-white rounded-md px-3 py-1 mt-1 text-sm font-bold">+FLT</button>
                        </div>
                    </div>

                    {/* Resumen de estadísticas del jugador en el modal */}
                    <div className="bg-gray-700 p-4 rounded-md text-sm text-gray-200">
                        <h4 className="text-lg font-bold text-white mb-2">Resumen:</h4>
                        <p>Puntos: <span className="font-semibold text-blue-300">{player.score}</span></p>
                        <p>Rebotes: <span className="font-semibold text-purple-300">{player.rebounds}</span></p>
                        <p>Asistencias: <span className="font-semibold text-pink-300">{player.assists}</span></p>
                        <p>Robos: <span className="font-semibold text-teal-300">{player.steals}</span></p>
                        <p>Bloqueos: <span className="font-semibold text-indigo-300">{player.blocks}</span></p>
                        <p>Pérdidas: <span className="font-semibold text-orange-300">{player.turnovers}</span></p>
                        <p>Faltas: <span className="font-semibold text-red-300">{player.fouls}</span></p>
                        <p>Tiros de 2pt: <span className="font-semibold text-blue-300">{player.made2pt}/{total2ptAttempts}</span></p>
                        <p>Tiros de 3pt: <span className="font-semibold text-green-300">{player.made3pt}/{total3ptAttempts}</span></p>
                        <p>Tiros Libres: <span className="font-semibold text-yellow-300">{player.madeFT}/{totalFTAttempts}</span></p>
                        <p>FG%: <span className="font-semibold text-purple-300">{fgPercentage}%</span></p>
                        <p>3P%: <span className="font-semibold text-green-300">{threePtPercentage}%</span></p>
                        <p>FT%: <span className="font-semibold text-yellow-300">{ftPercentage}%</span></p>
                    </div>
                </div>
            </div>
        );
    };

    // Componente del modal de selección de jugador de la plantilla
    const PlayerSelectionModal = ({ rosterPlayers, currentTeamPlayers, onSelectPlayer, onClose }) => {
        const availablePlayers = rosterPlayers.filter(rosterP =>
            !currentTeamPlayers.some(teamP => teamP.jersey === rosterP.jersey)
        );

        return (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md border border-gray-700 max-h-[80vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-2xl font-bold text-white">Seleccionar Jugador</h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white text-3xl leading-none"
                        >
                            &times;
                        </button>
                    </div>

                    {availablePlayers.length === 0 ? (
                        <p className="text-gray-400">No hay jugadores disponibles en la plantilla para añadir a este equipo. Asegúrate de que no estén ya en el equipo o añade nuevos a la plantilla.</p>
                    ) : (
                        <div className="space-y-3">
                            {availablePlayers.map(player => (
                                <button
                                    key={player.id}
                                    onClick={() => onSelectPlayer(player)}
                                    className="w-full bg-gray-700 hover:bg-gray-600 text-white p-3 rounded-md text-left transition duration-200"
                                >
                                    #{player.jersey} - {player.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    };


    // Componente para la página de historial
    const HistoryPage = () => {
        const [selectedGame, setSelectedGame] = useState(null);
        // Eliminados: analysisLoading, analysisResult, generateAnalysis

        // Función para exportar los datos del partido a CSV
        const exportGameToCsv = (game) => {
            const escapeCsv = (value) => {
                if (value === null || value === undefined) return '';
                let stringValue = String(value);
                // Si el valor contiene comas, comillas dobles o saltos de línea, enciérralo en comillas dobles
                if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                    // Escapa las comillas dobles duplicándolas
                    stringValue = stringValue.replace(/"/g, '""');
                    return `"${stringValue}"`;
                }
                return stringValue;
            };

            let csvContent = `Detalles del Partido\n`;
            csvContent += `Fecha:,${escapeCsv(game.date)}\n`;
            csvContent += `Duración:,${escapeCsv(game.duration)}\n\n`;

            // Encabezados para las estadísticas de los jugadores
            const playerHeaders = [
                'Equipo', 'Nombre', 'Número', 'Puntos', 'Rebotes', 'Asistencias', 'Robos', 'Bloqueos', 'Pérdidas', 'Faltas',
                '2PM', '2PTM', '3PM', '3PTM', 'FTM', 'FTT', 'FG%', '3P%', 'FT%'
            ];
            csvContent += playerHeaders.map(header => escapeCsv(header)).join(',') + '\n';

            // Función para añadir filas de jugadores
            const addPlayerRows = (teamName, players) => {
                players.forEach(p => {
                    const total2ptAttempts = p.made2pt + p.missed2pt;
                    const total3ptAttempts = p.made3pt + p.missed3pt;
                    const totalFTAttempts = p.madeFT + p.missedFT;

                    const fgPercentage = (total2ptAttempts + total3ptAttempts) > 0 ? ((p.made2pt + p.made3pt) / (total2ptAttempts + total3ptAttempts) * 100).toFixed(1) : '0.0';
                    const threePtPercentage = total3ptAttempts > 0 ? (p.made3pt / total3ptAttempts * 100).toFixed(1) : '0.0';
                    const ftPercentage = totalFTAttempts > 0 ? (p.madeFT / totalFTAttempts * 100).toFixed(1) : '0.0';

                    const row = [
                        teamName,
                        p.name,
                        p.jersey,
                        p.score,
                        p.rebounds,
                        p.assists,
                        p.steals,
                        p.blocks,
                        p.turnovers,
                        p.fouls,
                        p.made2pt,
                        p.missed2pt,
                        p.made3pt,
                        p.missed3pt,
                        p.madeFT,
                        p.missedFT,
                        fgPercentage,
                        threePtPercentage,
                        ftPercentage
                    ];
                    csvContent += row.map(item => escapeCsv(item)).join(',') + '\n';
                });
            };

            // Añadir datos del equipo A
            csvContent += `\n${escapeCsv(game.teamA.name)} - Puntuación: ${game.teamA.score}\n`;
            addPlayerRows(game.teamA.name, game.teamA.players);

            // Añadir datos del equipo B
            csvContent += `\n${escapeCsv(game.teamB.name)} - Puntuación: ${game.teamB.score}\n`;
            addPlayerRows(game.teamB.name, game.teamB.players);

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `Partido_${game.date.replace(/[/:\s,]/g, '_')}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url); // Limpiar la URL del objeto
        };


        return (
            <div className="min-h-screen text-white p-4">
                <div className="flex justify-between items-center mb-6">
                    <button
                        onClick={() => setPage('home')}
                        className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg text-sm shadow-md transition duration-200"
                    >
                        &larr; Volver
                    </button>
                    <h2 className="text-3xl font-bold text-green-400">Historial de Partidos</h2>
                </div>

                {history.length === 0 ? (
                    <p className="text-center text-gray-400 text-lg mt-8">No hay partidos en el historial.</p>
                ) : (
                    <div className="space-y-4">
                        {history.map(game => (
                            <div
                                key={game.id}
                                className="bg-gray-800 p-4 rounded-lg shadow-lg cursor-pointer hover:bg-gray-700 transition duration-200"
                                onClick={() => {
                                    setSelectedGame(game);
                                }}
                            >
                                <h3 className="text-xl font-bold text-white">
                                    {game.teamA.name} {game.teamA.score} - {game.teamB.name} {game.teamB.score}
                                </h3>
                                <p className="text-gray-400 text-sm">Fecha: {game.date} | Duración: {game.duration}</p>
                            </div>
                        ))}
                    </div>
                )}

                {selectedGame && (
                    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 overflow-y-auto">
                        <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-4xl border border-gray-700">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-2xl font-bold text-white">Detalles del Partido</h3>
                                <button
                                    onClick={() => setSelectedGame(null)}
                                    className="text-gray-400 hover:text-white text-3xl leading-none"
                                >
                                    &times;
                                </button>
                            </div>

                            <p className="text-gray-300 mb-2">Fecha: {selectedGame.date}</p>
                            <p className="text-gray-300 mb-4">Duración: {selectedGame.duration}</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                                {/* Tabla de Equipo Local */}
                                <div className="overflow-x-auto">
                                    <h4 className="text-xl font-bold text-blue-400 mb-2">{selectedGame.teamA.name} ({selectedGame.teamA.score})</h4>
                                    <table className="min-w-full bg-gray-700 rounded-lg overflow-hidden shadow-md text-sm">
                                        <thead className="bg-gray-600 text-gray-200 uppercase text-xs leading-normal">
                                            <tr>
                                                <th className="py-3 px-2 text-left">#</th>
                                                <th className="py-3 px-2 text-left">Nombre</th>
                                                <th className="py-3 px-2 text-center">Pts</th>
                                                <th className="py-3 px-2 text-center">Reb</th>
                                                <th className="py-3 px-2 text-center">Ast</th>
                                                <th className="py-3 px-2 text-center">Stl</th>
                                                <th className="py-3 px-2 text-center">Blk</th>
                                                <th className="py-3 px-2 text-center">Tov</th>
                                                <th className="py-3 px-2 text-center">Flt</th>
                                                <th className="py-3 px-2 text-center">FG%</th>
                                                <th className="py-3 px-2 text-center">3P%</th>
                                                <th className="py-3 px-2 text-center">FT%</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-gray-300 text-sm font-light">
                                            {selectedGame.teamA.players.map(p => {
                                                const total2ptAttempts = p.made2pt + p.missed2pt;
                                                const total3ptAttempts = p.made3pt + p.missed3pt;
                                                const totalFTAttempts = p.madeFT + p.missedFT;

                                                const fgPercentage = (total2ptAttempts + total3ptAttempts) > 0 ? ((p.made2pt + p.made3pt) / (total2ptAttempts + total3ptAttempts) * 100).toFixed(1) : '0.0';
                                                const threePtPercentage = total3ptAttempts > 0 ? (p.made3pt / total3ptAttempts * 100).toFixed(1) : '0.0';
                                                const ftPercentage = totalFTAttempts > 0 ? (p.madeFT / totalFTAttempts * 100).toFixed(1) : '0.0';

                                                return (
                                                    <tr key={p.id} className="border-b border-gray-600 hover:bg-gray-600">
                                                        <td className="py-3 px-2 text-left whitespace-nowrap">{p.jersey}</td>
                                                        <td className="py-3 px-2 text-left whitespace-nowrap">{p.name}</td>
                                                        <td className="py-3 px-2 text-center">{p.score}</td>
                                                        <td className="py-3 px-2 text-center">{p.rebounds}</td>
                                                        <td className="py-3 px-2 text-center">{p.assists}</td>
                                                        <td className="py-3 px-2 text-center">{p.steals}</td>
                                                        <td className="py-3 px-2 text-center">{p.blocks}</td>
                                                        <td className="py-3 px-2 text-center">{p.turnovers}</td>
                                                        <td className="py-3 px-2 text-center">{p.fouls}</td>
                                                        <td className="py-3 px-2 text-center">{fgPercentage}%</td>
                                                        <td className="py-3 px-2 text-center">{threePtPercentage}%</td>
                                                        <td className="py-3 px-2 text-center">{ftPercentage}%</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Tabla de Equipo Visitante */}
                                <div className="overflow-x-auto">
                                    <h4 className="text-xl font-bold text-red-400 mb-2">{selectedGame.teamB.name} ({selectedGame.teamB.score})</h4>
                                    <table className="min-w-full bg-gray-700 rounded-lg overflow-hidden shadow-md text-sm">
                                        <thead className="bg-gray-600 text-gray-200 uppercase text-xs leading-normal">
                                            <tr>
                                                <th className="py-3 px-2 text-left">#</th>
                                                <th className="py-3 px-2 text-left">Nombre</th>
                                                <th className="py-3 px-2 text-center">Pts</th>
                                                <th className="py-3 px-2 text-center">Reb</th>
                                                <th className="py-3 px-2 text-center">Ast</th>
                                                <th className="py-3 px-2 text-center">Stl</th>
                                                <th className="py-3 px-2 text-center">Blk</th>
                                                <th className="py-3 px-2 text-center">Tov</th>
                                                <th className="py-3 px-2 text-center">Flt</th>
                                                <th className="py-3 px-2 text-center">FG%</th>
                                                <th className="py-3 px-2 text-center">3P%</th>
                                                <th className="py-3 px-2 text-center">FT%</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-gray-300 text-sm font-light">
                                            {selectedGame.teamB.players.map(p => {
                                                const total2ptAttempts = p.made2pt + p.missed2pt;
                                                const total3ptAttempts = p.made3pt + p.missed3pt;
                                                const totalFTAttempts = p.madeFT + p.missedFT;

                                                const fgPercentage = (total2ptAttempts + total3ptAttempts) > 0 ? ((p.made2pt + p.made3pt) / (total2ptAttempts + total3ptAttempts) * 100).toFixed(1) : '0.0';
                                                const threePtPercentage = total3ptAttempts > 0 ? (p.made3pt / total3ptAttempts * 100).toFixed(1) : '0.0';
                                                const ftPercentage = totalFTAttempts > 0 ? (p.madeFT / totalFTAttempts * 100).toFixed(1) : '0.0';

                                                return (
                                                    <tr key={p.id} className="border-b border-gray-600 hover:bg-gray-600">
                                                        <td className="py-3 px-2 text-left whitespace-nowrap">{p.jersey}</td>
                                                        <td className="py-3 px-2 text-left whitespace-nowrap">{p.name}</td>
                                                        <td className="py-3 px-2 text-center">{p.score}</td>
                                                        <td className="py-3 px-2 text-center">{p.rebounds}</td>
                                                        <td className="py-3 px-2 text-center">{p.assists}</td>
                                                        <td className="py-3 px-2 text-center">{p.steals}</td>
                                                        <td className="py-3 px-2 text-center">{p.blocks}</td>
                                                        <td className="py-3 px-2 text-center">{p.turnovers}</td>
                                                        <td className="py-3 px-2 text-center">{p.fouls}</td>
                                                        <td className="py-3 px-2 text-center">{fgPercentage}%</td>
                                                        <td className="py-3 px-2 text-center">{threePtPercentage}%</td>
                                                        <td className="py-3 px-2 text-center">{ftPercentage}%</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <button
                                onClick={() => exportGameToCsv(selectedGame)}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-200 w-full mt-4"
                            >
                                Exportar a Excel (CSV)
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // Renderizado condicional de páginas
    return (
        <div className="bg-gradient-to-br from-gray-900 via-black to-red-900"> {/* Aplicado el estilo global aquí */}
            {/* Custom styles for text stroke */}
            <style>
                {`
                .text-forasteros-title {
                    color: white; /* Changed to white */
                    -webkit-text-stroke: none; /* Removed stroke for Webkit */
                    text-stroke: none; /* Removed stroke for standard */
                }
                `}
            </style>
            {page === 'home' && <HomePage />}
            {page === 'setupGame' && <GameSetupPage />}
            {page === 'game' && <GamePage />}
            {page === 'history' && <HistoryPage />}
            {page === 'roster' && <RosterManagementPage />}
            <AlertDialog message={alertMessage} onClose={() => setAlertMessage('')} />
        </div>
    );
}

export default App;
