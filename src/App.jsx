import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai'; // Corrected import path

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
        // Increased z-index to 60 to be above bottom navigation (z-50)
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4">
            <div className="bg-gray-800 p-6 rounded-lg shadow-xl max-w-sm w-full text-center border-2 border-yellow-500 animate-fade-in">
                <p className="text-white text-lg mb-4">{message}</p>
                <button
                    onClick={onClose}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-normal py-2 px-4 rounded-lg transition duration-200"
                >
                    Entendido
                </button>
            </div>
        </div>
    );
};

// Componente de diálogo de confirmación
const ConfirmDialog = ({ message, onConfirm, onCancel }) => {
    return (
        // Increased z-index to 60 to be above bottom navigation (z-50)
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4">
            <div className="bg-gray-800 p-6 rounded-lg shadow-xl max-w-sm w-full text-center border border-gray-700">
                <p className="text-white text-lg mb-4">{message}</p>
                <div className="flex justify-center space-x-4">
                    <button
                        onClick={onConfirm}
                        className="bg-green-600 hover:bg-green-700 text-white font-normal py-2 px-4 rounded-lg transition duration-200"
                    >
                        Confirmar
                    </button>
                    <button
                        onClick={onCancel}
                        className="bg-red-600 hover:bg-red-700 text-white font-normal py-2 px-4 rounded-lg transition duration-200"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
};

// Formato del tiempo
const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// Componente del icono de contacto (roster)
const ContactIcon = ({ size = 24, color = "currentColor" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
    </svg>
);

// Componente del icono de configuración
const SettingsIcon = ({ size = 24, color = "currentColor" }) => (
    <svg width={size} height={size} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className={color === "currentColor" ? "text-white" : ""}>
        <path d="M19.14 12.936a7.5 7.5 0 000-1.872l2.036-1.58a.5.5 0 00.12-.64l-1.928-3.34a.5.5 0 00-.6-.22l-2.4.96a7.5 7.5 0 00-1.62-.936l-.36-2.52a.5.5 0 00-.5-.44h-3.856a.5.5 0 00-.5.44l-.36 2.52a7.5 7.5 0 00-1.62.936l-2.4-.96a.5.5 0 00-.6.22l-1.928 3.34a.5.5 0 00.12.64l2.036 1.58a7.5 7.5 0 000 1.872l-2.036 1.58a.5.5 0 00-.12.64l1.928 3.34a.5.5 0 00.6.22l2.4-.96a7.5 7.5 0 001.62.936l.36 2.52a.5.5 0 00.5.44h3.856a.5.5 0 00.5-.44l.36-2.52a7.5 7.5 0 001.62-.936l2.4.96a.5.5 0 00.6-.22l1.928-3.34a.5.5 0 00-.12-.64l-2.036-1.58zM12 15.6a3.6 3.6 0 110-7.2 3.6 3.6 0 010 7.2z"/>
    </svg>
);

// Componente del icono de libro (para historial)
const BookIcon = ({ size = 24, color = "currentColor" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 1.5A10.5 10.5 0 1022.5 12 10.512 10.512 0 0012 1.5zm0 19.2A8.7 8.7 0 1120.7 12 8.71 8.71 0 0112 20.7zm.6-13.8h-1.2v6l5.2 3.1.6-1.1-4.6-2.7z"/>
    </svg>
);

// NUEVO: Componente de la barra de navegación inferior (solo para páginas que no son el inicio)
const BottomNavigationBar = ({ currentPage, navigateToPage, hasUnfinishedGame }) => {
    // Solo renderizar si la página actual NO es 'home'
    if (currentPage === 'home') {
        return null;
    }

    return (
        // z-index 50 for the bottom navigation bar
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 shadow-lg z-50">
            <div className="flex justify-around items-center h-16 px-2 sm:px-4">
                {/* Inicio */}
                <button
                    onClick={() => navigateToPage('home')}
                    className={`flex flex-col items-center justify-center p-1 rounded-md text-sm font-medium transition duration-200 ${
                        currentPage === 'home' ? 'text-white bg-gray-700' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                    </svg>

                    <span className="mt-1 hidden sm:block">Inicio</span>
                </button>

                {/* Configurar Partido */}
                <button
                    onClick={() => navigateToPage('setupGame')}
                    className={`flex flex-col items-center justify-center p-1 rounded-md text-sm font-medium transition duration-200 ${
                        currentPage === 'setupGame' ? 'text-white bg-gray-700' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`}
                >    {/* Icono Configurar partido */}
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>

                    <span className="mt-1 hidden sm:block">Configurar</span>
                </button>

                {/* Partido Actual / Reanudar */}
                <button
                    onClick={() => navigateToPage('game')}
                    className={`flex flex-col items-center justify-center p-1 rounded-md text-sm font-medium transition duration-200 ${
                        currentPage === 'game' ? 'text-white bg-gray-700' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`}
                >
                    {/* Icono de Partido Actual (Play) */}
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                    </svg>

                    <span className="mt-1 hidden sm:block">{hasUnfinishedGame ? 'Reanudar' : 'Partido Actual'}</span>
                </button>

                {/* Historial */}
                <button
                    onClick={() => navigateToPage('history')}
                    className={`flex flex-col items-center justify-center p-1 rounded-md text-sm font-medium transition duration-200 ${
                        currentPage === 'history' ? 'text-white bg-gray-700' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`}
                >
                    <BookIcon size={24} color="currentColor" />
                    <span className="mt-1 hidden sm:block">Historial</span>
                </button>

                {/* Plantilla */}
                <button
                    onClick={() => navigateToPage('roster')}
                    className={`flex flex-col items-center justify-center p-1 rounded-md text-sm font-medium transition duration-200 ${
                        currentPage === 'roster' ? 'text-white bg-gray-700' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`}
                >
                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                    </svg>
                    <span className="mt-1 hidden sm:block">Jugadores</span>
                </button>
            </div>
        </div>
    );
};


// Componente principal de la aplicación
function App() {
    const [page, setPage] = useState('home'); // 'home', 'setupGame', 'game', 'history', 'roster'
    const [initialGameTime, setInitialGameTime] = useState(600); // Default 10 minutes (600 seconds)
    // showPlayerStatsModal ahora almacena un objeto { playerId, teamId, isLongPress }
    const [showPlayerStatsModal, setShowPlayerStatsModal] = useState(null);
    // Añadido currentQuarterScore y allQuarterScores a los estados de equipo
    // AHORA: currentQuarterFouls para faltas por cuarto
    const [teamA, setTeamA] = useState({ name: 'Local', players: [], lastAction: null, currentQuarterScore: 0, allQuarterScores: [], currentQuarterFouls: 0 });
    const [teamB, setTeamB] = useState({ name: 'Visitante', players: [], lastAction: null, currentQuarterScore: 0, allQuarterScores: [], currentQuarterFouls: 0 });
    const [history, setHistory] = useState(() => {
        // Cargar historial de localStorage
        const savedHistory = localStorage.getItem('forasterosHistory');
        return savedHistory ? JSON.parse(savedHistory) : [];
    });
    // MODIFICADO: rosterPlayers ahora es 'allPlayers' y es una lista global
    const [allPlayers, setAllPlayers] = useState(() => {
        const savedPlayers = localStorage.getItem('forasterosAllPlayers'); // Changed key
        return savedPlayers ? JSON.parse(savedPlayers) : [];
    });
    const [showRosterSelectionModalForTeam, setShowRosterSelectionModalForTeam] = useState(null); // 'Local' o 'Visitante' para el modal de selección
    const [playerToSubOut, setPlayerToSubOut] = useState(null); // { playerId, teamId } of the player initiating a sub
    const [showSubstitutionModal, setShowSubstitutionModal] = useState(false);


    // Estado para el AlertDialog
    const [alertMessage, setAlertMessage] = useState('');

    // ESTADO DEL TEMPORIZADOR ELEVADO A APP
    const [timer, setTimer] = useState(600); // Inicializa con el tiempo por defecto
    const [isRunning, setIsRunning] = useState(false);
    const [timeUpMessage, setTimeUpMessage] = useState('');
    const intervalRef = useRef(null);

    // Estado para el contador de cuartos
    const [currentQuarter, setCurrentQuarter] = useState(1);
    const [totalQuarters, setTotalQuarters] = useState(4); // Default 4 quarters

    // NUEVO: Estado para la duración del tiempo extra y el período actual de tiempo extra
    const [overtimeDuration, setOvertimeDuration] = useState(5 * 60); // Default 5 minutes (300 seconds)
    const [currentOvertimePeriod, setCurrentOvertimePeriod] = useState(0); // 0 for regular time, 1 for first OT, etc.

    // NUEVO: Estado para el partido no terminado (para reanudar)
    const [unfinishedGame, setUnfinishedGame] = useState(() => {
        const savedUnfinishedGame = localStorage.getItem('forasterosUnfinishedGame');
        return savedUnfinishedGame ? JSON.parse(savedUnfinishedGame) : null;
    });

    // NUEVO: Estado para las faltas antes de bonus
    const [foulsBeforeBonus, setFoulsBeforeBonus] = useState(6); // Default 5 fouls before bonus

    // NUEVO: Estado para controlar si el modal de selección de plantilla debe abrirse al cargar la página de juego
    const [shouldOpenInitialRosterSelection, setShouldOpenInitialRosterSelection] = useState(false);

    // NUEVO: Estado para controlar la posición de los equipos en la pantalla (izquierda/derecha)
    const [isTeamASideLeft, setIsTeamASideLeft] = useState(true);


    // Efecto para el temporizador, ahora en App
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

    // Función para reiniciar el juego localmente (temporizador y estado de running)
    const localResetGame = useCallback(() => {
        setTimer(initialGameTime); // Reinicia el timer con el initialGameTime
        setIsRunning(false);
        setTimeUpMessage('');
        setCurrentQuarter(1); // Reiniciar cuartos al reiniciar el juego
        setCurrentOvertimePeriod(0); // Reiniciar tiempo extra
        // Resetear también los scores y faltas por cuarto
        setTeamA(prev => ({ ...prev, currentQuarterScore: 0, allQuarterScores: [], currentQuarterFouls: 0 }));
        setTeamB(prev => ({ ...prev, currentQuarterScore: 0, allQuarterScores: [], currentQuarterFouls: 0 }));
        setIsTeamASideLeft(true); // Resetear la posición de los equipos
    }, [initialGameTime]);

    // Efecto para guardar historial en localStorage
    useEffect(() => {
        localStorage.setItem('forasterosHistory', JSON.stringify(history));
    }, [history]);

    // MODIFICADO: Efecto para guardar todos los jugadores en localStorage
    useEffect(() => {
        localStorage.setItem('forasterosAllPlayers', JSON.stringify(allPlayers));
    }, [allPlayers]);

    // NUEVO: Efecto para guardar el estado del partido no terminado
    useEffect(() => {
        // Guardar el estado del partido no terminado cuando se descarga la página o se navega fuera
        const saveCurrentGameState = () => {
            if (page === 'game') { // Solo guardar si estamos en la página del partido
                const currentGameState = {
                    teamA: teamA,
                    teamB: teamB,
                    timer: timer,
                    isRunning: isRunning,
                    currentQuarter: currentQuarter,
                    totalQuarters: totalQuarters,
                    initialGameTime: initialGameTime,
                    overtimeDuration: overtimeDuration, // Guardar duración de tiempo extra
                    currentOvertimePeriod: currentOvertimePeriod, // Guardar período de tiempo extra
                    foulsBeforeBonus: foulsBeforeBonus, // Guardar faltas antes de bonus
                    isTeamASideLeft: isTeamASideLeft, // Guardar la posición de los equipos
                };
                localStorage.setItem('forasterosUnfinishedGame', JSON.stringify(currentGameState));
            }
        };

        window.addEventListener('beforeunload', saveCurrentGameState);

        // Limpiar el estado del partido no terminado si se navega a 'history' (partido finalizado)
        if (page === 'history' && unfinishedGame) {
            setUnfinishedGame(null);
            localStorage.removeItem('forasterosUnfinishedGame');
        }

        return () => {
            window.removeEventListener('beforeunload', saveCurrentGameState);
        };
    }, [page, teamA, teamB, timer, isRunning, currentQuarter, totalQuarters, initialGameTime, overtimeDuration, currentOvertimePeriod, unfinishedGame, foulsBeforeBonus, isTeamASideLeft]);


    // NUEVO: Función para navegar entre páginas, guardando el estado del partido si es necesario
    const navigateToPage = useCallback((newPage) => {
        if (page === 'game' && newPage !== 'history') { // Si salimos de la página del juego y no es para ir al historial (partido finalizado)
            const currentGameState = {
                teamA: teamA,
                teamB: teamB,
                timer: timer,
                isRunning: isRunning,
                currentQuarter: currentQuarter,
                totalQuarters: totalQuarters,
                initialGameTime: initialGameTime,
                overtimeDuration: overtimeDuration,
                currentOvertimePeriod: currentOvertimePeriod,
                foulsBeforeBonus: foulsBeforeBonus, // Guardar faltas antes de bonus
                isTeamASideLeft: isTeamASideLeft, // Guardar la posición de los equipos
            };
            localStorage.setItem('forasterosUnfinishedGame', JSON.stringify(currentGameState));
            setUnfinishedGame(currentGameState); // Actualizar el estado local también
        }
        setPage(newPage);
    }, [page, teamA, teamB, timer, isRunning, currentQuarter, totalQuarters, initialGameTime, overtimeDuration, currentOvertimePeriod, foulsBeforeBonus, isTeamASideLeft]);


    // NUEVO: Función para reanudar un partido
    const handleResumeGame = useCallback(() => {
        if (unfinishedGame) {
            setTeamA(unfinishedGame.teamA);
            setTeamB(unfinishedGame.teamB);
            setTimer(unfinishedGame.timer);
            setIsRunning(unfinishedGame.isRunning);
            setCurrentQuarter(unfinishedGame.currentQuarter);
            setTotalQuarters(unfinishedGame.totalQuarters);
            setInitialGameTime(unfinishedGame.initialGameTime);
            setOvertimeDuration(unfinishedGame.overtimeDuration || (5 * 60)); // Default if not saved
            setCurrentOvertimePeriod(unfinishedGame.currentOvertimePeriod || 0); // Default if not saved
            setFoulsBeforeBonus(unfinishedGame.foulsBeforeBonus || 5); // Default if not saved
            setIsTeamASideLeft(unfinishedGame.isTeamASideLeft !== undefined ? unfinishedGame.isTeamASideLeft : true); // Load position
            setPage('game');
            setAlertMessage('Partido reanudado.');
        } else {
            setAlertMessage('No hay partido para reanudar.');
        }
    }, [unfinishedGame, setTeamA, setTeamB, setTimer, setIsRunning, setCurrentQuarter, setTotalQuarters, setInitialGameTime, setOvertimeDuration, setCurrentOvertimePeriod, setFoulsBeforeBonus, setPage, setAlertMessage, setIsTeamASideLeft]);


    // NUEVO: Función para añadir un jugador a la lista global
    const addPlayerToGlobalRoster = useCallback((playerData) => {
        setAllPlayers(prev => {
            // Check for unique jersey within the global list
            const isJerseyTaken = prev.some(p => p.jersey === playerData.jersey);
            if (isJerseyTaken) {
                setAlertMessage(`El número de camiseta ${playerData.jersey} ya está en uso.`);
                return prev; // Return original list if jersey is taken
            }
            // Add to the end to keep oldest first
            return [...prev, { id: crypto.randomUUID(), ...playerData }];
        });
    }, [setAlertMessage]);

    // NUEVO: Función para actualizar un jugador en la lista global
    const updateGlobalPlayer = useCallback((playerId, newData) => {
        setAllPlayers(prev => {
            // Check for unique jersey within the global list, excluding the player being edited
            const isJerseyTakenByAnotherPlayer = prev.some(p => p.jersey === newData.jersey && p.id !== playerId);
            if (isJerseyTakenByAnotherPlayer) {
                setAlertMessage(`El número de camiseta ${newData.jersey} ya está en uso por otro jugador.`);
                return prev;
            }
            return prev.map(p => p.id === playerId ? { ...p, ...newData } : p);
        });
    }, [setAlertMessage]);

    // NUEVO: Función para eliminar un jugador de la lista global
    const removeGlobalPlayer = useCallback((playerId) => {
        setAllPlayers(prev => prev.filter(p => p.id !== playerId));
    }, []);

    // NUEVO: Función para reordenar jugadores en la lista global
    const reorderGlobalPlayers = useCallback((newPlayersOrder) => {
        setAllPlayers(newPlayersOrder);
    }, []);

    // MODIFICADO: Función para añadir jugadores del roster (global) a un equipo de juego (ahora acepta array)
    const addPlayersToTeamFromRoster = useCallback((teamId, rosterPlayersToAdd) => {
        const setTeamState = teamId === teamA.name ? setTeamA : setTeamB;

        setTeamState(prev => {
            let currentPlayersCount = prev.players.filter(p => p.isOnCourt).length; // Count players already on court
            const newPlayers = rosterPlayersToAdd.map(rosterPlayer => {
                // Check if player is already in the team (by jersey)
                if (prev.players.some(p => p.jersey === rosterPlayer.jersey)) {
                    setAlertMessage(`El jugador con el número ${rosterPlayer.jersey} ya está en este equipo.`);
                    return null; // Don't add this player
                }

                const isOnCourt = currentPlayersCount < 5; // First 5 go to court
                if (isOnCourt) {
                    currentPlayersCount++; // Increment count for court players
                }

                return {
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
                    isOnCourt: isOnCourt, // New property
                };
            }).filter(p => p !== null); // Remove nulls from players already in team

            return { ...prev, players: [...prev.players, ...newPlayers] };
        });
        setShowRosterSelectionModalForTeam(null);
    }, [setTeamA, setTeamB, setAlertMessage, setShowRosterSelectionModalForTeam]);


    // Función para eliminar un jugador del equipo de juego
    const removePlayer = useCallback((teamId, playerId) => {
        if (teamId === teamA.name) {
            setTeamA(prev => {
                const updatedPlayers = prev.players.filter(p => p.id !== playerId);
                // If a player was removed from court, try to bring one from bench if available
                const onCourtCount = updatedPlayers.filter(p => p.isOnCourt).length;
                if (onCourtCount < 5) {
                    const firstBenchPlayerIndex = updatedPlayers.findIndex(p => !p.isOnCourt);
                    if (firstBenchPlayerIndex !== -1) {
                        updatedPlayers[firstBenchPlayerIndex] = { ...updatedPlayers[firstBenchPlayerIndex], isOnCourt: true };
                    }
                }
                return { ...prev, players: updatedPlayers };
            });
        } else {
            setTeamB(prev => {
                const updatedPlayers = prev.players.filter(p => p.id !== playerId);
                const onCourtCount = updatedPlayers.filter(p => p.isOnCourt).length;
                if (onCourtCount < 5) {
                    const firstBenchPlayerIndex = updatedPlayers.findIndex(p => !p.isOnCourt);
                    if (firstBenchPlayerIndex !== -1) {
                        updatedPlayers[firstBenchPlayerIndex] = { ...updatedPlayers[firstBenchPlayerIndex], isOnCourt: true };
                    }
                }
                return { ...prev, players: updatedPlayers };
            });
        }
    }, [setTeamA, setTeamB]);

    // Manejar el cambio de nombre de jugador (en juego) - ESTA FUNCIÓN AHORA NO SE UTILIZARÁ DIRECTAMENTE EN PlayerRow
    const handlePlayerNameChange = useCallback((teamId, playerId, newName) => {
        const updateTeamState = (setTeamState) => {
            setTeamState(prevTeam => ({
                ...prevTeam,
                players: prevTeam.players.map(p =>
                    p.id === playerId ? { ...p, name: newName } : p
                ),
            }));
        };
        if (teamId === teamA.name) {
            updateTeamState(setTeamA);
        } else {
            updateTeamState(setTeamB);
        }
    }, [setTeamA, setTeamB]);

    // Función para actualizar estadísticas y registrar la última acción por equipo
    const updatePlayerStat = useCallback((teamId, playerId, stat, value) => {
        const setTeamState = teamId === teamA.name ? setTeamA : setTeamB;
        const currentTeam = teamId === teamA.name ? teamA : teamB;

        setTeamState(prevTeam => {
            const playerToUpdate = prevTeam.players.find(p => p.id === playerId);
            if (!playerToUpdate) {
                console.error(`Player with ID ${playerId} no encontrado en el equipo ${prevTeam.name}.`);
                return prevTeam;
            }
            // Solo permitir actualización de estadísticas si el jugador está en cancha
            if (!playerToUpdate.isOnCourt) {
                setAlertMessage(`No se pueden actualizar estadísticas de ${playerToUpdate.name} porque está en la banca.`);
                return prevTeam;
            }

            const prevPlayerState = { ...playerToUpdate };
            let scoreChange = 0; // Track score change for the current quarter
            let foulChange = 0; // Track foul change for the current quarter
            const updatedPlayers = prevTeam.players.map(player => {
                if (player.id === playerId) {
                    const newPlayer = { ...player };
                    switch (stat) {
                        case '2PM': newPlayer.made2pt = Math.max(0, newPlayer.made2pt + value); scoreChange = (value * 2); newPlayer.score += scoreChange; break;
                        case '2PTM': newPlayer.missed2pt = Math.max(0, newPlayer.missed2pt + value); break;
                        case '3PM': newPlayer.made3pt = Math.max(0, newPlayer.made3pt + value); scoreChange = (value * 3); newPlayer.score += scoreChange; break;
                        case '3PTM': newPlayer.missed3pt = Math.max(0, newPlayer.missed3pt + value); break;
                        case 'FTM': newPlayer.madeFT = Math.max(0, newPlayer.madeFT + value); scoreChange = value; newPlayer.score += scoreChange; break;
                        case 'FTT': newPlayer.missedFT = Math.max(0, newPlayer.missedFT + value); break;
                        case 'REB': newPlayer.rebounds = Math.max(0, newPlayer.rebounds + value); break;
                        case 'AST': newPlayer.assists = Math.max(0, newPlayer.assists + value); break;
                        case 'STL': newPlayer.steals = Math.max(0, newPlayer.steals + value); break;
                        case 'BLK': newPlayer.blocks = Math.max(0, newPlayer.blocks + value); break;
                        case 'TOV': newPlayer.turnovers = Math.max(0, newPlayer.turnovers + value); break;
                        case 'FLT':
                            // Check for bonus alert BEFORE updating the foul count
                            if (value === 1 && prevTeam.currentQuarterFouls + 1 === foulsBeforeBonus) {
                                setAlertMessage(`¡${prevTeam.name} está en bonus!`);
                            }
                            newPlayer.fouls = Math.max(0, newPlayer.fouls + value);
                            foulChange = value;
                            break;
                        default: break;
                    }
                    // Asegurarse de que la puntuación no baje de cero si se decrementan tiros y ya no hay más
                    if (newPlayer.score < 0) newPlayer.score = 0;
                    return newPlayer;
                }
                return player;
            });
            return {
                ...prevTeam,
                players: updatedPlayers,
                currentQuarterScore: prevTeam.currentQuarterScore + scoreChange, // Update current quarter score
                currentQuarterFouls: prevTeam.currentQuarterFouls + foulChange, // Update current quarter fouls
                lastAction: {
                    playerId: playerId,
                    stat: stat,
                    valueApplied: value,
                    prevPlayerState: prevPlayerState,
                    scoreChange: scoreChange, // Store score change for undo
                    foulChange: foulChange
                }
            };
        });
    }, [setTeamA, setTeamB, foulsBeforeBonus, setAlertMessage]); // Added foulsBeforeBonus and setAlertMessage to dependencies

    // Función para deshacer la última acción de un equipo específico
    const handleTeamUndo = useCallback((teamId) => {
        const setTeamState = teamId === teamA.name ? setTeamA : setTeamB;
        setTeamState(prevTeam => {
            if (!prevTeam.lastAction) return prevTeam;

            const { playerId, prevPlayerState, scoreChange, foulChange } = prevTeam.lastAction; // Get scoreChange and foulChange

            const updatedPlayers = prevTeam.players.map(player => {
                if (player.id === playerId) {
                    return prevPlayerState;
                }
                return player;
            });
            return {
                ...prevTeam,
                players: updatedPlayers,
                currentQuarterScore: prevTeam.currentQuarterScore - scoreChange, // Reverse score change
                currentQuarterFouls: prevTeam.currentQuarterFouls - foulChange, // Reverse foul change
                lastAction: null
            };
        });
    }, [setTeamA, setTeamB]);

    // Resetea solo el estado de los jugadores y modales en App.js
    const resetGamePlayersAndModals = useCallback(() => {
        // Al iniciar un nuevo partido, los equipos deben estar vacíos.
        setTeamA({ name: 'Local', players: [], lastAction: null, currentQuarterScore: 0, allQuarterScores: [], currentQuarterFouls: 0 });
        setTeamB({ name: 'Visitante', players: [], lastAction: null, currentQuarterScore: 0, allQuarterScores: [], currentQuarterFouls: 0 });
        setShowPlayerStatsModal(null);
        setShowRosterSelectionModalForTeam(null);
        setPlayerToSubOut(null);
        setShowSubstitutionModal(false);
        setIsTeamASideLeft(true); // Resetear la posición de los equipos
    }, []);

    // Función para generar jugadores por defecto - AHORA SIEMPRE RETORNA UN ARRAY VACÍO AL INICIO DE UN PARTIDO
    const generateDefaultPlayers = useCallback((teamName, count = 0) => { // count ahora es 0 por defecto
        return []; // Siempre retorna un array vacío para nuevos partidos
    }, []);

    // Manejar el fin del partido - ahora recibe el tiempo restante de GamePage
    const handleEndGame = useCallback(() => {
        const finalScoreA = teamA.players.reduce((acc, p) => acc + p.score, 0);
        const finalScoreB = teamB.players.reduce((acc, p) => acc + p.score, 0);

        // Ensure the current quarter/overtime score is added if the game ends prematurely
        let finalTeamAQuarterScores = [...teamA.allQuarterScores];
        let finalTeamBQuarterScores = [...teamB.allQuarterScores];

        // Only add the current quarter's score if it hasn't been added by handleNextQuarter
        if (finalTeamAQuarterScores.length < currentQuarter + currentOvertimePeriod) { // Adjusted for overtime periods
            finalTeamAQuarterScores.push(teamA.currentQuarterScore);
            finalTeamBQuarterScores.push(teamB.currentQuarterScore);
        }

        const gameSummary = {
            id: crypto.randomUUID(), // Usar crypto.randomUUID()
            date: new Date().toLocaleString(),
            duration: formatTime(initialGameTime - timer), // Duración real del partido
            teamA: {
                name: teamA.name,
                score: finalScoreA,
                players: teamA.players,
                totalFouls: teamA.players.reduce((acc, p) => acc + p.fouls, 0), // Añadir faltas totales (acumuladas)
                quarterScores: finalTeamAQuarterScores, // Store quarter scores
            },
            teamB: {
                name: teamB.name,
                score: finalScoreB,
                players: teamB.players,
                totalFouls: teamB.players.reduce((acc, p) => acc + p.fouls, 0), // Añadir faltas totales (acumuladas)
                quarterScores: finalTeamBQuarterScores, // Store quarter scores
            },
            quartersPlayed: currentQuarter, // Guardar cuartos jugados
            totalQuarters: totalQuarters, // Guardar total de cuartos
            overtimePeriodsPlayed: currentOvertimePeriod, // Guardar tiempos extra jugados
            foulsBeforeBonus: foulsBeforeBonus, // Guardar faltas antes de bonus
        };
        setHistory(prev => [...prev, gameSummary]);
        navigateToPage('history'); // Usar navigateToPage para limpiar el unfinishedGame
        // Resetear jugadores y modales, y el temporizador global
        resetGamePlayersAndModals();
        setTimer(initialGameTime); // Reinicia el timer al finalizar el partido
        setIsRunning(false);
        setTimeUpMessage('');
        setCurrentQuarter(1); // Resetear cuartos
        setCurrentOvertimePeriod(0); // Resetear tiempos extra
        // Reset quarter scores and fouls for the next game
        setTeamA(prev => ({ ...prev, currentQuarterScore: 0, allQuarterScores: [], currentQuarterFouls: 0 }));
        setTeamB(prev => ({ ...prev, currentQuarterScore: 0, allQuarterScores: [], currentQuarterFouls: 0 }));
        setUnfinishedGame(null); // Asegurarse de limpiar el partido no terminado
        localStorage.removeItem('forasterosUnfinishedGame');
    }, [initialGameTime, timer, teamA, teamB, resetGamePlayersAndModals, currentQuarter, totalQuarters, currentOvertimePeriod, foulsBeforeBonus, navigateToPage]);

    // NUEVO: Obtener todos los jugadores de la lista global para el modal de selección de jugadores en el partido
    const allRosterPlayers = useMemo(() => {
        return allPlayers; // Ahora es directamente allPlayers
    }, [allPlayers]);

    // NUEVO: Función para iniciar una sustitución
    const initiateSubstitution = useCallback((teamId, playerId) => {
        setPlayerToSubOut({ teamId, playerId });
        setShowSubstitutionModal(true);
    }, []);

    // NUEVO: Función para confirmar la sustitución
    const confirmSubstitution = useCallback((teamId, player1Id, player2Id) => {
        const setTeamState = teamId === teamA.name ? setTeamA : setTeamB;

        setTeamState(prevTeam => {
            const updatedPlayers = prevTeam.players.map(player => {
                if (player.id === player1Id) {
                    return { ...player, isOnCourt: !player.isOnCourt };
                }
                if (player.id === player2Id) {
                    return { ...player, isOnCourt: !player.isOnCourt };
                }
                return player;
            });
            return { ...prevTeam, players: updatedPlayers };
        });
        setShowSubstitutionModal(false);
        setPlayerToSubOut(null);
        setAlertMessage('Sustitución realizada.');
    }, [teamA, teamB, setTeamA, setTeamB, setAlertMessage]);

    // NUEVO: Función para cambiar la posición de los equipos en la pantalla
    const handleSwapTeamsDisplay = useCallback(() => {
        setIsTeamASideLeft(prev => !prev);
        setAlertMessage('Posición de equipos en pantalla cambiada.');
    }, [setIsTeamASideLeft, setAlertMessage]);

    // NUEVO: Combine players from both teams for the selection modal
    const allPlayersCurrentlyInGame = useMemo(() => {
        return [...teamA.players, ...teamB.players];
    }, [teamA.players, teamB.players]);


    // Componente para la página de inicio
    const HomePage = useCallback(() => (
        <div className="flex flex-col items-center justify-center min-h-screen text-white p-4">
            <h1 className="text-4xl font-semibold mb-4 text-forasteros-title">Forasteros Stats App</h1>
            <img
                src="https://i.imgur.com/Wn0F6h5.png"
                alt="Logo Forasteros BBC"
                className="w-48 h-48 mb-8 rounded-full shadow-lg"
            />
            <div className="flex flex-col space-y-4 w-full max-w-md">
                {/* Nuevo Partido */}
                <button
                    onClick={() => navigateToPage('setupGame')}
                    className="bg-gray-800 hover:bg-gray-700 text-white font-normal py-4 px-6 rounded-lg shadow-lg text-lg transition transform hover:scale-105 flex items-center justify-between w-full"
                >
                    <div className="flex-grow text-center">
                        <span className="block text-xl font-semibold">Nuevo Partido</span>
                        <span className="block text-sm text-gray-400 font-normal">Configura y empieza un nuevo partido.</span>
                    </div>
                    <svg
                        className="size-6 flex-shrink-0 ml-4"
                        version="1.1"
                        viewBox="0 0 64 64"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <g id="basketball">
                            <path fill="currentColor" d="M59.5,22.7c-2.9-8.5-9.7-15.3-18.1-18.1c-6-2-12.7-2-18.6,0C14.2,7.4,7.4,14.2,4.5,22.7c-1,3-1.5,6.1-1.5,9.3   s0.5,6.3,1.5,9.3c2.9,8.5,9.6,15.3,18.1,18.1c3,1,6.1,1.5,9.3,1.5s6.3-0.5,9.3-1.5c8.5-2.9,15.3-9.6,18.1-18.1c1-3,1.5-6.1,1.5-9.3   S60.5,25.7,59.5,22.7z M58.5,37c-15-0.7-30.3-1.5-42-4.1c0-2,0.2-4,0.6-6.1c0.6,0.1,1.3,0.2,1.9,0.2c2.1,0,4.2-0.7,6.4-2.1   c11.8-7.5,22.2-8.2,31.8-2.1c0.1,0.2,0.1,0.4,0.2,0.5c1,2.8,1.4,5.7,1.4,8.7C59,33.7,58.8,35.3,58.5,37z M56,19.7   c-9.7-5-20-3.9-31.6,3.4c-2.4,1.6-4.7,2.1-6.8,1.6c1.8-7,6.1-14,14.6-19.8c2.9,0,5.7,0.5,8.4,1.4C47.3,8.7,52.9,13.5,56,19.7z   M23.3,6.4c1.7-0.6,3.5-1,5.3-1.2c-7.3,5.7-11.1,12.3-12.8,18.8c-3.9-2.1-5.8-7.3-5.8-7.4c0,0,0-0.1-0.1-0.1   C13.1,11.9,17.8,8.3,23.3,6.4z M8.6,18.6c0.9,2,3.1,5.8,6.7,7.5c-0.4,2.1-0.6,4.2-0.7,6.3c-3.4-0.9-6.5-1.9-9.1-3.2   c-0.1,0-0.2-0.1-0.3-0.1c0.2-2,0.6-3.9,1.3-5.7C7,21.7,7.7,20.1,8.6,18.6z M5,31.1c2.8,1.3,6,2.4,9.5,3.3c0,1.5,0.1,3,0.3,4.5   c-3.9-0.1-6.9,1.9-8,2.9c-0.1-0.4-0.3-0.7-0.4-1.1C5.5,37.9,5,35,5,32C5,31.7,5,31.4,5,31.1z M7.7,43.7C7.7,43.7,7.7,43.7,7.7,43.7   c0.2-0.2,3.3-3.1,7.5-2.8c1.1,6.7,3.4,12.2,4.8,15.2C14.6,53.5,10.2,49.1,7.7,43.7z M40.7,57.6c-5.5,1.9-11.8,1.9-17.4,0   c-0.2-0.1-0.4-0.1-0.5-0.2c-0.6-1-4-7.5-5.5-16c1.3,0.4,2.7,1.2,4.1,2.4c0.8,0.7,1.5,1.3,2.2,1.9c5.7,5,10,8.8,20.1,8.8   c1.1,0,2.3-0.1,3.5-0.1C45.2,55.7,43,56.8,40.7,57.6z M50.1,52c-0.1,0-0.1,0-0.2,0c-14,1.8-18.4-2.1-25-7.9   c-0.7-0.6-1.4-1.3-2.2-1.9c-2-1.7-3.9-2.6-5.7-3c-0.2-1.4-0.3-2.8-0.3-4.3c11.7,2.6,26.8,3.4,41.5,4.1c-0.2,0.6-0.3,1.2-0.5,1.7   C56.1,45.1,53.5,49,50.1,52z"/>
                        </g>
                        <g id="field"/>
                        <g id="basket"/>
                        <g id="trophy"/>
                        <g id="league_1_"/>
                        <g id="player"/>
                        <g id="uniform_1_"/>
                        <g id="scoreboard"/>
                        <g id="medal"/>
                        <g id="shoe_1_"/>
                        <g id="ticket_1_"/>
                        <g id="event_1_"/>
                        <g id="time"/>
                        <g id="strategy_1_"/>
                        <g id="supporter"/>
                        <g id="whistle"/>
                        <g id="podium"/>
                        <g id="bag"/>
                        <g id="bottle"/>
                        <g id="badge"/>
                    </svg>
                </button>

                {/* Continuar Partido */}
                {unfinishedGame && (
                    <button
                        onClick={handleResumeGame}
                        className="bg-gray-800 hover:bg-gray-700 text-white font-normal py-4 px-6 rounded-lg shadow-lg text-lg transition transform hover:scale-105 flex items-center justify-between w-full"
                    >
                        <div className="flex-grow text-center">
                            <span className="block text-xl font-semibold">Continuar Partido</span>
                            <span className="block text-sm text-gray-400 font-normal">Reanuda el último partido en curso.</span>
                        </div>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                     </svg>

                    </button>
                )}

                {/* Historial de Partidos */}
                <button
                    onClick={() => navigateToPage('history')}
                    className="bg-gray-800 hover:bg-gray-700 text-white font-normal py-4 px-6 rounded-lg shadow-lg text-lg transition transform hover:scale-105 flex items-center justify-between w-full"
                >
                    <div className="flex-grow text-center">
                        <span className="block text-xl font-semibold">Historial de Partidos</span>
                        <span className="block text-sm text-gray-400 font-normal">Revisa estadísticas de partidos anteriores.</span>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24" className="flex-shrink-0 ml-4">
                        <path d="M12 1.5A10.5 10.5 0 1022.5 12 10.512 10.512 0 0012 1.5zm0 19.2A8.7 8.7 0 1120.7 12 8.71 8.71 0 0112 20.7zm.6-13.8h-1.2v6l5.2 3.1.6-1.1-4.6-2.7z"/>
                    </svg>
                </button>

                {/* Gestionar Plantillas */}
                <button
                    onClick={() => navigateToPage('roster')}
                    className="bg-gray-800 hover:bg-gray-700 text-white font-normal py-4 px-6 rounded-lg shadow-lg text-lg transition transform hover:scale-105 flex items-center justify-between w-full"
                >
                    <div className="flex-grow text-center">
                        <span className="block text-xl font-semibold">Gestionar Jugadores</span>
                        <span className="block text-sm text-gray-400 font-normal">Crea y edita tus plantillas de jugadores.</span>
                    </div>
                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                    </svg>
                </button>
            </div>
            <p className="mt-8 text-gray-400 text-sm font-normal">Desarrollado por Forasteros </p>
        </div>
    ), [navigateToPage, unfinishedGame, handleResumeGame]);

    // Nuevo componente para configurar el tiempo del juego
    const GameSetupPage = useCallback(() => {
        const [minutes, setMinutes] = useState(initialGameTime / 60); // Default 10 minutes
        const [quarters, setQuarters] = useState(totalQuarters); // Default 4 quarters
        const [otMinutes, setOtMinutes] = useState(overtimeDuration / 60); // Default 5 minutes for overtime
        const [bonusFouls, setBonusFouls] = useState(foulsBeforeBonus); // Default 5 fouls before bonus

        const handleStartGame = () => {
            if (minutes <= 0 || isNaN(minutes)) {
                setAlertMessage("Por favor, introduce un número de minutos válido y positivo para los cuartos.");
                return;
            }
            if (quarters <= 0 || isNaN(quarters)) {
                setAlertMessage("Por favor, introduce un número de cuartos válido y positivo.");
                return;
            }
            if (otMinutes < 0 || isNaN(otMinutes)) { // Allow 0 for no overtime
                setAlertMessage("Por favor, introduce un número de minutos válido y no negativo para el tiempo extra.");
                return;
            }
            if (bonusFouls < 0 || isNaN(bonusFouls)) { // Allow 0 for no bonus
                setAlertMessage("Por favor, introduce un número de faltas válido y no negativo para el bonus.");
                return;
            }

            setInitialGameTime(minutes * 60); // Convert minutes to seconds
            setTimer(minutes * 60); // Inicializa el timer global de App
            setTotalQuarters(quarters); // Establece el total de cuartos
            setOvertimeDuration(otMinutes * 60); // Establece la duración del tiempo extra
            setFoulsBeforeBonus(bonusFouls); // Establece las faltas antes de bonus
            setCurrentQuarter(1); // Inicia en el primer cuarto
            setCurrentOvertimePeriod(0); // Reinicia los tiempos extra
            resetGamePlayersAndModals(); // Reset players before starting new game
            setIsTeamASideLeft(true); // Reinicia la posición de los equipos al iniciar un nuevo partido

            // NUEVA LÓGICA: Redirigir si no hay jugadores o abrir modal de selección
            if (allPlayers.length === 0) {
                setAlertMessage("No hay jugadores registrados. Por favor, añade jugadores a tu plantilla antes de iniciar un partido.");
                navigateToPage('roster'); // Redirigir a la página de gestión de jugadores
            } else {
                setShouldOpenInitialRosterSelection(true); // Indicar que el modal debe abrirse en GamePage
                navigateToPage('game'); // Navegar a la página del partido
            }
        };

        return (
            <div className="min-h-screen flex flex-col items-center justify-center text-white p-4 pb-20">
                <h2 className="text-4xl font-semibold mb-8 text-white">Configurar Partido</h2>
                <div className="bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700 flex flex-col items-center space-y-6 max-w-sm w-full">
                    <label htmlFor="game-minutes" className="text-lg font-normal text-gray-300">Duración por Cuarto (minutos):</label>
                    <input
                        id="game-minutes"
                        type="number"
                        value={minutes}
                        onChange={(e) => setMinutes(parseInt(e.target.value) || 0)}
                        min="1"
                        className="w-full p-3 rounded-md bg-gray-700 text-white text-center text-2xl font-normal focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <label htmlFor="total-quarters" className="text-lg font-normal text-gray-300">Cantidad de Cuartos:</label>
                    <input
                        id="total-quarters"
                        type="number"
                        value={quarters}
                        onChange={(e) => setQuarters(parseInt(e.target.value) || 0)}
                        min="1"
                        className="w-full p-3 rounded-md bg-gray-700 text-white text-center text-2xl font-normal focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <label htmlFor="overtime-minutes" className="text-lg font-normal text-gray-300">Duración Tiempo Extra (minutos):</label>
                    <input
                        id="overtime-minutes"
                        type="number"
                        value={otMinutes}
                        onChange={(e) => setOtMinutes(parseInt(e.target.value) || 0)}
                        min="0"
                        className="w-full p-3 rounded-md bg-gray-700 text-white text-center text-2xl font-normal focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {/* NUEVO: Campo para faltas antes de bonus */}
                    <label htmlFor="fouls-before-bonus" className="text-lg font-normal text-gray-300">Faltas antes de Bonus:</label>
                    <input
                        id="fouls-before-bonus"
                        type="number"
                        value={bonusFouls}
                        onChange={(e) => setBonusFouls(parseInt(e.target.value) || 0)}
                        min="0"
                        className="w-full p-3 rounded-md bg-gray-700 text-white text-center text-2xl font-normal focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        onClick={handleStartGame}
                        className="bg-green-600 hover:bg-green-700 text-white font-normal py-3 px-6 rounded-lg shadow-lg text-lg transition transform hover:scale-105 w-full"
                    >
                        Comenzar Partido
                    </button>
                    {/* Botón de volver eliminado, ahora en la barra de navegación inferior */}
                </div>
            </div>
        );
    }, [initialGameTime, totalQuarters, overtimeDuration, foulsBeforeBonus, resetGamePlayersAndModals, setAlertMessage, setInitialGameTime, navigateToPage, setTimer, setTotalQuarters, setOvertimeDuration, setFoulsBeforeBonus, setCurrentQuarter, setCurrentOvertimePeriod, allPlayers.length, setShouldOpenInitialRosterSelection, setIsTeamASideLeft]);

    // Componente para la página de gestión de jugadores (antes RosterManagementPage)
    const RosterManagementPage = useCallback(() => {
        const [newPlayerName, setNewPlayerName] = useState('');
        const [newPlayerJersey, setNewPlayerJersey] = useState('');
        const [editingPlayerId, setEditingPlayerId] = useState(null);
        const [editPlayerName, setEditPlayerName] = useState('');
        const [editPlayerJersey, setEditPlayerJersey] = useState('');
        const [confirmDeletePlayerId, setConfirmDeletePlayerId] = useState(null);
        const [successMessage, setSuccessMessage] = useState(''); // NEW: State for success message

        // Referencia para el campo de entrada del nombre del jugador
        const newPlayerNameInputRef = useRef(null);

        // Lista de nombres aleatorios
        const randomNames = useMemo(() => [
            "Juan", "María", "Pedro", "Ana", "Luis", "Sofía", "Carlos", "Laura",
            "Miguel", "Elena", "José", "Isabel", "David", "Carmen", "Javier", "Pilar",
            "Fernando", "Rosa", "Daniel", "Lucía", "Alejandro", "Martina", "Pablo", "Valeria"
        ], []);

        // Drag and Drop states
        const [draggedPlayerId, setDraggedPlayerId] = useState(null);
        const [draggedOverPlayerId, setDraggedOverPlayerId] = useState(null);

        const handleAddPlayer = (e) => {
            e.preventDefault();
            const nameInput = newPlayerName.trim();
            let finalName;
            if (nameInput === '') {
                finalName = randomNames[Math.floor(Math.random() * randomNames.length)];
            } else {
                finalName = nameInput;
            }

            let jersey = parseInt(newPlayerJersey);
            if (isNaN(jersey) || jersey <= 0) {
                const maxJersey = allPlayers.reduce((max, p) => Math.max(max, p.jersey), 0);
                jersey = maxJersey + 1;
            } else {
                if (allPlayers.some(p => p.jersey === jersey)) { // Check against global list
                    setAlertMessage(`El número de camiseta ${jersey} ya está en uso.`);
                    return;
                }
            }
            addPlayerToGlobalRoster({ name: finalName, jersey }); // Call global function
            setNewPlayerName(''); // Limpiar solo el nombre para seguir agregando
            setNewPlayerJersey(''); // Limpiar el número de camiseta
            // NEW: Set success message
            setSuccessMessage('Jugador añadido exitosamente.');
            setTimeout(() => setSuccessMessage(''), 3000); // Clear after 3 seconds

            // Enfocar el campo de entrada del nombre después de añadir
            if (newPlayerNameInputRef.current) {
                newPlayerNameInputRef.current.focus();
            }
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
            const isJerseyTakenByAnotherPlayer = allPlayers.some(p => p.jersey === jersey && p.id !== editingPlayerId); // Check against global list
            if (isJerseyTakenByAnotherPlayer) {
                setAlertMessage(`El número de camiseta ${jersey} ya está en uso por otro jugador.`);
                return;
            }

            updateGlobalPlayer(editingPlayerId, { name: editPlayerName.trim(), jersey }); // Call global function
            setEditingPlayerId(null);
            setEditPlayerName('');
            setEditPlayerJersey('');
            setAlertMessage('Jugador actualizado.');
        };

        const handleDeletePlayerClick = (playerId) => {
            setConfirmDeletePlayerId(playerId);
        };

        const confirmDeletePlayer = () => {
            removeGlobalPlayer(confirmDeletePlayerId); // Call global function
            setConfirmDeletePlayerId(null);
            setAlertMessage('Jugador eliminado.');
        };

        const cancelDeletePlayer = () => {
            setConfirmDeletePlayerId(null);
        };

        // Drag and Drop Handlers
        const handleDragStart = (e, id) => {
            setDraggedPlayerId(id);
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', id);
        };

        const handleDragOver = (e) => {
            e.preventDefault(); // Allows drop
        };

        const handleDragEnter = (e, id) => {
            e.preventDefault();
            setDraggedOverPlayerId(id);
        };

        const handleDragLeave = (e) => {
            e.preventDefault();
            setDraggedOverPlayerId(null);
        };

        const handleDrop = (e, dropTargetId) => {
            e.preventDefault();
            const draggedId = e.dataTransfer.getData('text/plain');
            if (!draggedId || draggedId === dropTargetId) {
                setDraggedPlayerId(null);
                setDraggedOverPlayerId(null);
                return;
            }

            const newPlayers = [...allPlayers]; // Use allPlayers directly
            const draggedIndex = newPlayers.findIndex(p => p.id === draggedId);
            const dropTargetIndex = newPlayers.findIndex(p => p.id === dropTargetId);

            if (draggedIndex === -1 || dropTargetIndex === -1) {
                setDraggedPlayerId(null);
                setDraggedOverPlayerId(null);
                return;
            }

            const [removed] = newPlayers.splice(draggedIndex, 1);
            newPlayers.splice(dropTargetIndex, 0, removed);

            reorderGlobalPlayers(newPlayers); // Call global function
            setDraggedPlayerId(null);
            setDraggedOverPlayerId(null);
            setAlertMessage('Orden de jugadores actualizado.');
        };

        return (
            <div className="min-h-screen text-white p-4 pb-20">
                <div className="flex justify-between items-center mb-6">
                    {/* Botón de volver eliminado, ahora en la barra de navegación inferior */}
                    <h2 className="text-3xl font-semibold text-white">Gestionar Jugadores</h2>
                </div>

                {/* NEW: Success Message */}
                {successMessage && (
                    <div className="bg-green-600 text-white p-3 rounded-md text-center mb-4 animate-fadeInOut font-normal">
                        {successMessage}
                    </div>
                )}

                {/* Formulario para añadir nuevo jugador */}
                <div className="bg-gray-800 p-6 rounded-lg shadow-xl mb-6">
                    <h3 className="text-xl font-semibold text-white mb-4">Añadir Nuevo Jugador</h3>
                    <form onSubmit={handleAddPlayer} className="flex flex-col sm:flex-row gap-3 items-center">
                        <input
                            type="text"
                            placeholder="Nombre del Jugador (opcional)" // Modificado placeholder
                            value={newPlayerName}
                            onChange={(e) => setNewPlayerName(e.target.value)}
                            className="flex-grow bg-gray-700 text-white p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 font-normal"
                            ref={newPlayerNameInputRef}
                        />
                        <input
                            type="number"
                            placeholder="Núm." // MODIFIED: Shorter placeholder
                            value={newPlayerJersey}
                            onChange={(e) => setNewPlayerJersey(e.target.value)}
                            className="w-16 bg-gray-700 text-white p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-center font-normal"
                        />
                        <button
                            type="submit"
                            className="bg-green-600 hover:bg-green-700 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg font-normal shadow-md transition duration-200 flex-shrink-0" /* Changed text-xl to text-lg */
                            title="Añadir Jugador"
                        >
                            +
                        </button>
                    </form>
                </div>

                {/* Lista de jugadores */}
                <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
                    <h3 className="text-xl font-semibold text-white mb-4">Lista de Jugadores</h3>
                    {allPlayers.length === 0 ? (
                        <p className="text-gray-400 font-normal">No hay jugadores en la lista. ¡Añade algunos!</p>
                    ) : (
                        <div className="space-y-3">
                            {allPlayers.map(player => (
                                <div
                                    key={player.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, player.id)}
                                    onDragOver={handleDragOver}
                                    onDragEnter={(e) => handleDragEnter(e, player.id)}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, player.id)}
                                    className={`
                                            bg-gray-700 p-3 rounded-md flex flex-col sm:flex-row items-center justify-between gap-3
                                            ${draggedPlayerId === player.id ? 'opacity-50 border-2 border-blue-500' : ''}
                                            ${draggedOverPlayerId === player.id && draggedPlayerId !== player.id ? 'bg-gray-600 border-2 border-green-500' : ''}
                                            `}
                                >
                                    {editingPlayerId === player.id ? (
                                        <form onSubmit={handleUpdatePlayer} className="flex flex-col sm:flex-row gap-3 w-full">
                                            <input
                                                type="text"
                                                value={editPlayerName}
                                                onChange={(e) => setEditPlayerName(e.target.value)}
                                                className="flex-grow bg-gray-600 text-white p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-normal"
                                            />
                                            <input
                                                type="number"
                                                value={editPlayerJersey}
                                                onChange={(e) => setEditPlayerJersey(e.target.value)}
                                                className="w-16 sm:w-24 bg-gray-600 text-white p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-normal"
                                            />
                                            <div className="flex gap-2">
                                                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 px-3 rounded-md font-normal">Guardar</button>
                                                <button type="button" onClick={() => setEditingPlayerId(null)} className="bg-gray-500 hover:bg-gray-600 text-white text-sm py-2 px-3 rounded-md font-normal">Cancelar</button>
                                            </div>
                                        </form>
                                    ) : (
                                        <>
                                            <span className="text-lg font-semibold">{player.name} <span className="text-gray-400 font-normal">#{player.jersey}</span></span>
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleEditClick(player)}
                                                    className="bg-yellow-500 hover:bg-yellow-600 text-white text-sm py-2 px-3 rounded-md font-normal"
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    onClick={() => handleDeletePlayerClick(player.id)}
                                                    className="bg-red-500 hover:bg-red-600 text-white text-sm py-2 px-3 rounded-md font-normal"
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

                {confirmDeletePlayerId && (
                    <ConfirmDialog
                        message={`¿Estás seguro de que quieres eliminar a ${allPlayers.find(p => p.id === confirmDeletePlayerId)?.name || 'este jugador'} de la lista?`}
                        onConfirm={confirmDeletePlayer}
                        onCancel={cancelDeletePlayer}
                    />
                )}
            </div>
        );
    }, [allPlayers, setAlertMessage, addPlayerToGlobalRoster, updateGlobalPlayer, removeGlobalPlayer, reorderGlobalPlayers]);


    // New component for a single player row
    const PlayerRow = React.memo(({ player, teamId, isRunning, updatePlayerStat, removePlayer, setShowPlayerStatsModal, onInitiateSubstitution }) => {
        const [localPlayerName, setLocalPlayerName] = useState(player.name);
        const [pressTimerId, setPressTimerId] = useState(null); // Local state for long press timer
        const longPressThreshold = 1000; // 1 second
        // Nuevo estado para controlar el modal de confirmación de eliminación
        const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);


        // Update local state if player.name changes from parent (e.g., initial load or undo)
        useEffect(() => {
            setLocalPlayerName(player.name);
        }, [player.name]);

        // La edición del nombre del jugador ahora solo se permite en la página de gestión de jugadores.
        // Por lo tanto, este campo de entrada siempre será de solo lectura en la página del partido.
        const handleLocalNameChange = (e) => {
            // No permitir cambios directos aquí
            console.log("La edición del nombre del jugador solo está permitida en la página de gestión de jugadores.");
        };

        const handleNameBlur = () => {
            // No se necesita lógica de guardado aquí ya que es de solo lectura
        };

        const handleNameKeyDown = (e) => {
            // No se necesita lógica de guardado aquí ya que es de solo lectura
        };

        // Handle press start on the stats button
        const handleButtonPressStart = useCallback((e) => {
            e.stopPropagation(); // Prevent propagation to parent elements
            if (pressTimerId) {
                clearTimeout(pressTimerId);
            }
            const timer = setTimeout(() => {
                // This is a long press
                setShowPlayerStatsModal({ playerId: player.id, teamId: teamId, isLongPress: true });
                setPressTimerId(null); // Clear timer ID as action is performed
            }, longPressThreshold);
            setPressTimerId(timer);
        }, [player.id, teamId, pressTimerId, setShowPlayerStatsModal]);

        // Handle press end on the stats button
        const handleButtonPressEnd = useCallback((e) => {
            e.stopPropagation(); // Prevent propagation to parent elements
            if (pressTimerId) {
                clearTimeout(pressTimerId);
                setPressTimerId(null);
                // If the timer was cleared, it means it was a short tap (less than longPressThreshold)
                // Open the modal only if it's not already open in long-press mode for this player
                setShowPlayerStatsModal({ playerId: player.id, teamId: teamId, isLongPress: false });
            }
        }, [player.id, teamId, pressTimerId, setShowPlayerStatsModal]);

        // Handle mouse/touch leave/cancel to clear the timer
        const handleButtonPressCancel = useCallback(() => {
            if (pressTimerId) {
                clearTimeout(pressTimerId);
                setPressTimerId(null);
            }
        }, [pressTimerId]);


        return (
            <div
                className={`
                    bg-gray-600 p-3 rounded-lg shadow-md flex items-center gap-2 transition duration-200 ease-in-out
                    ${isRunning ? 'cursor-default opacity-80' : 'cursor-default'}
                    flex-wrap sm:flex-nowrap // Main container allows wrapping on mobile, no wrap on sm+
                    justify-between // Distribute items horizontally
                `}
            >
                {!isRunning && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowConfirmDeleteModal(true); // Mostrar modal de confirmación
                        }}
                        className="rounded-full bg-red-600 hover:bg-red-700 text-white w-7 h-7 flex items-center justify-center text-sm font-normal transition duration-200 flex-shrink-0 shadow-sm"
                        title="Eliminar Jugador del Partido"
                    >
                        -
                    </button>
                )}

                {/* Player Name & Jersey - make it take available space, but not push others out */}
                <div className="flex items-center gap-1 flex-grow min-w-[100px] sm:flex-grow">
                    <span className="text-sm text-gray-300 font-normal">#</span>
                    <span className="text-base font-normal text-white">{player.jersey}</span>
                    <input
                        type="text"
                        value={localPlayerName}
                        onChange={handleLocalNameChange} // Este handler no permitirá cambios
                        onBlur={handleNameBlur}
                        onKeyDown={handleNameKeyDown}
                        readOnly={true} // Siempre de solo lectura en la página del partido
                        className={`
                            text-base font-normal text-white bg-gray-700 p-1 rounded-md
                            focus:outline-none focus:ring-2 focus:ring-white min-w-0 flex-grow
                            cursor-default // Cambiado a cursor-default ya que no es editable
                        `}
                    />
                    {/* Botón de cambio de jugador */}
                    <button
                        onClick={() => onInitiateSubstitution(teamId, player.id)}
                        className="bg-purple-600 hover:bg-purple-700 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-normal shadow-md transition duration-200 flex-shrink-0"
                        title="Cambiar Jugador"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h18m-15-6L3 7.5m0 0L7.5 3M3 7.5h18" />
                        </svg>
                    </button>
                </div>

                {/* Estadísticas del Jugador: Puntos, Faltas */}
                <div className="flex flex-row justify-around items-center gap-x-1 flex-shrink-0">
                    <div className="flex flex-col items-center justify-center min-w-[35px]">
                        <span className="text-xs text-blue-300 sm:text-sm font-normal">Pts:</span>
                        <span className="text-lg font-normal text-blue-400 sm:text-xl">{player.score}</span>
                    </div>
                    <div className="flex flex-col items-center justify-center min-w-[35px]">
                        <span className="text-xs text-red-300 sm:text-sm font-normal">Flt:</span>
                        <span className="text-lg font-normal text-red-400 sm:text-xl">{player.fouls}</span>
                    </div>
                </div>

                {/* Stats Modal Button */}
                <button
                    onMouseDown={handleButtonPressStart}
                    onMouseUp={handleButtonPressEnd}
                    onMouseLeave={handleButtonPressCancel}
                    onTouchStart={handleButtonPressStart}
                    onTouchEnd={handleButtonPressEnd}
                    onTouchCancel={handleButtonPressCancel}
                    disabled={!player.isOnCourt} // Deshabilitar si no está en cancha
                    className={`bg-gray-700 text-white rounded-md px-3 py-2 text-sm font-normal shadow-md transition duration-200 flex-shrink-0 ${!player.isOnCourt ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-600'}`}
                    title={!player.isOnCourt ? "Jugador en banca, no se pueden actualizar estadísticas" : "Ver Estadísticas del Jugador"}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M4 20h4V10H4v10zm6 0h4V4h-4v16zm6 0h4V14h-4v6z"/>
                    </svg>
                </button>

                {showConfirmDeleteModal && (
                    <ConfirmDialog
                        message={`¿Estás seguro de que quieres eliminar a ${player.name} del equipo?`}
                        onConfirm={() => {
                            removePlayer(teamId, player.id);
                            setShowConfirmDeleteModal(false);
                        }}
                        onCancel={() => setShowConfirmDeleteModal(false)}
                    />
                )}
            </div>
        );
    });

    // Componente para la página del juego
    const GamePage = React.memo(({
        timer, setIsRunning, isRunning, timeUpMessage, setTimeUpMessage, localResetGame,
        teamA, setTeamA, teamB, setTeamB,
        updatePlayerStat, handleTeamUndo, onEndGame,
        setShowRosterSelectionModalForTeam, setShowPlayerStatsModal,
        navigateToPage, setAlertMessage,
        addPlayersToTeamFromRoster, removePlayer,
        currentQuarter, setCurrentQuarter, totalQuarters, initialGameTime, setTimer,
        allRosterPlayers,
        addPlayerToGlobalRoster, updateGlobalPlayer, removeGlobalPlayer,
        overtimeDuration, currentOvertimePeriod, setCurrentOvertimePeriod,
        foulsBeforeBonus,
        initiateSubstitution, confirmSubstitution, playerToSubOut, showSubstitutionModal,
        shouldOpenInitialRosterSelection, setShouldOpenInitialRosterSelection,
        isTeamASideLeft, handleSwapTeamsDisplay,
        allPlayersCurrentlyInGame // Receive the new prop here
    }) => {
        // NUEVO: Estado para controlar la visibilidad del modal de la plantilla
        const [showRosterViewModal, setShowRosterViewModal] = useState(false);

        // Efecto para abrir el modal de selección de jugadores al cargar la página de juego
        useEffect(() => {
            if (shouldOpenInitialRosterSelection && teamA.players.length === 0) {
                setShowRosterSelectionModalForTeam('Local');
                setShouldOpenInitialRosterSelection(false); // Resetear para que no se abra de nuevo
            }
        }, [shouldOpenInitialRosterSelection, setShowRosterSelectionModalForTeam, setShouldOpenInitialRosterSelection, teamA.players.length]);


        // Separar jugadores en cancha y en banca
        const teamAOnCourt = teamA.players.filter(p => p.isOnCourt);
        const teamABench = teamA.players.filter(p => !p.isOnCourt);
        const teamBOnCourt = teamB.players.filter(p => p.isOnCourt);
        const teamBBench = teamB.players.filter(p => !p.isOnCourt);

        const currentScoreA = teamA.players.reduce((acc, p) => acc + p.score, 0);
        const currentScoreB = teamB.players.reduce((acc, p) => acc + p.score, 0);
        // Las faltas totales que se muestran en el marcador son las faltas del cuarto actual
        const currentQuarterFoulsA = teamA.currentQuarterFouls;
        const currentQuarterFoulsB = teamB.currentQuarterFouls;

        // Determinar si los equipos están en bonus
        const teamABonus = currentQuarterFoulsA >= foulsBeforeBonus;
        const teamBBonus = currentQuarterFoulsB >= foulsBeforeBonus;

        // Determinar qué equipo va a la izquierda y cuál a la derecha
        const leftTeam = isTeamASideLeft ? teamA : teamB;
        const rightTeam = isTeamASideLeft ? teamB : teamA;
        const leftTeamOnCourt = isTeamASideLeft ? teamAOnCourt : teamBOnCourt;
        const leftTeamBench = isTeamASideLeft ? teamABench : teamBBench;
        const rightTeamOnCourt = isTeamASideLeft ? teamBOnCourt : teamAOnCourt;
        const rightTeamBench = isTeamASideLeft ? teamBBench : teamABench;
        const leftTeamScore = isTeamASideLeft ? currentScoreA : currentScoreB;
        const rightTeamScore = isTeamASideLeft ? currentScoreB : currentScoreA;
        const leftTeamFouls = isTeamASideLeft ? currentQuarterFoulsA : currentQuarterFoulsB;
        const rightTeamFouls = isTeamASideLeft ? currentQuarterFoulsB : currentQuarterFoulsA;
        const leftTeamBonus = isTeamASideLeft ? teamBBonus : teamABonus; // Bonus applies to the *other* team's fouls
        const rightTeamBonus = isTeamASideLeft ? teamABonus : teamBBonus;


        // Función para avanzar al siguiente cuarto o iniciar tiempo extra
        const handleNextQuarter = useCallback(() => {
            const finalScoreA = teamA.players.reduce((acc, p) => acc + p.score, 0); // Calculate total score at end of period
            const finalScoreB = teamB.players.reduce((acc, p) => acc + p.score, 0);

            // Save current quarter/overtime score
            setTeamA(prev => ({ ...prev, allQuarterScores: [...prev.allQuarterScores, prev.currentQuarterScore] }));
            setTeamB(prev => ({ ...prev, allQuarterScores: [...prev.allQuarterScores, prev.currentQuarterScore] }));

            setIsRunning(false); // Pause timer
            setTimeUpMessage(''); // Clear time up message

            if (currentQuarter < totalQuarters) {
                // Regular quarter transition
                setCurrentQuarter(prev => prev + 1);
                setTimer(initialGameTime); // Reset timer for next quarter
                // Reset current quarter score and fouls for the new quarter
                setTeamA(prev => ({ ...prev, currentQuarterScore: 0, currentQuarterFouls: 0 }));
                setTeamB(prev => ({ ...prev, currentQuarterScore: 0, currentQuarterFouls: 0 }));
                setIsRunning(true); // Auto-start next quarter
            } else {
                // End of last regular quarter or an overtime period
                if (finalScoreA === finalScoreB) {
                    // Scores are tied
                    if (overtimeDuration > 0) {
                        // Start a new overtime period
                        setCurrentOvertimePeriod(prev => prev + 1);
                        setTimer(overtimeDuration); // Set timer for overtime
                        // Reset current quarter score and fouls for the new overtime period
                        setTeamA(prev => ({ ...prev, currentQuarterScore: 0, currentQuarterFouls: 0 }));
                        setTeamB(prev => ({ ...prev, currentQuarterScore: 0, currentQuarterFouls: 0 }));
                        setIsRunning(true); // Auto-start overtime
                        setAlertMessage(`¡Empate! Iniciando tiempo extra #${currentOvertimePeriod + 1}.`);
                    } else {
                        // No overtime configured, game ends in a tie
                        onEndGame();
                        setAlertMessage('¡Partido finalizado en empate!');
                    }
                } else {
                    // Scores are not tied, game ends
                    onEndGame();
                }
            }
        }, [currentQuarter, totalQuarters, initialGameTime, overtimeDuration, teamA, teamB, setCurrentQuarter, setTimer, setIsRunning, setTimeUpMessage, setTeamA, setTeamB, setCurrentOvertimePeriod, onEndGame, setAlertMessage, currentOvertimePeriod]);

        // Manejador para el botón de Iniciar/Pausar el temporizador
        const handleToggleTimer = useCallback(() => {
            if (!isRunning) { // Si el temporizador está pausado y se intenta iniciar
                // Validar que haya al menos 5 jugadores por equipo
                if (teamA.players.filter(p => p.isOnCourt).length < 5 || teamB.players.filter(p => p.isOnCourt).length < 5) {
                    setAlertMessage("Cada equipo debe tener al menos 5 jugadores en cancha para iniciar el partido.");
                    return; // No iniciar el temporizador
                }
            }
            setIsRunning(!isRunning); // Toggle el estado de ejecución
        }, [isRunning, teamA.players, teamB.players, setIsRunning, setAlertMessage]);


        return (
            <div className="min-h-screen text-white p-4 pb-20">
                {/* MODIFIED: Use grid-cols-1 on mobile, sm:grid-cols-3 on larger screens */}
                <div className="grid grid-cols-1 sm:grid-cols-3 items-center mb-6 gap-y-4 sm:gap-y-0">
                    {/* Botones de navegación superior eliminados, ahora en la barra de navegación inferior */}

                    {/* El temporizador se muestra aquí como título principal, centrado en la columna del medio */}
                    <div className="col-span-1 sm:col-span-1 text-5xl font-normal bg-gray-800 py-3 px-6 rounded-lg shadow-inner text-center text-white justify-self-center w-full sm:w-auto">
                        {formatTime(timer)}
                    </div>
                    {/* Display de Cuartos / Tiempo Extra */}
                    <div className="text-xl font-normal text-gray-300 justify-self-center sm:justify-self-end">
                        {currentOvertimePeriod > 0 ? `Tiempo Extra: ${currentOvertimePeriod}` : `Cuarto: ${currentQuarter}/${totalQuarters}`}
                    </div>
                </div>

                {/* Controles del temporizador */}
                <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-6">
                    <button
                        onClick={handleToggleTimer} // Usar el nuevo manejador
                        className={`py-2 px-6 rounded-lg font-normal text-lg shadow-lg transition duration-200 w-full sm:w-auto ${
                            isRunning ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'
                        }`}
                    >
                        {isRunning ? 'Pausar' : 'Iniciar'}
                    </button>
                    <button
                        onClick={localResetGame} // Llama a la función de App para reiniciar el timer
                        className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-6 rounded-lg font-normal text-lg shadow-lg transition duration-200 w-full sm:w-auto"
                    >
                        Reiniciar
                    </button>
                    <button
                        onClick={handleNextQuarter}
                        className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-6 rounded-lg font-normal text-lg shadow-lg transition duration-200 w-full sm:w-auto"
                    >
                        {currentQuarter < totalQuarters ? 'Siguiente Cuarto' : (currentOvertimePeriod > 0 ? 'Siguiente T. Extra / Finalizar' : 'Finalizar Partido')}
                    </button>
                    {/* NUEVO: Botón para terminar el partido en cualquier momento */}
                    <button
                        onClick={onEndGame}
                        className="bg-red-600 hover:bg-red-700 text-white py-2 px-6 rounded-lg font-normal text-lg shadow-lg transition duration-200 w-full sm:w-auto"
                    >
                        Terminar Partido Ahora
                    </button>
                </div>

                {/* Mensaje de tiempo finalizado */}
                {timeUpMessage && (
                    <div className="text-center text-red-400 text-2xl font-normal mb-4 animate-pulse">
                        {timeUpMessage}
                    </div>
                )}

                {/* Marcador y Faltas Totales - AHORA CON BOTÓN DE INTERCAMBIO */}
                <div className="flex justify-around items-center bg-gray-800 p-3 rounded-lg shadow-xl mb-6 relative">
                    {/* Equipo Izquierdo */}
                    <div className="flex flex-col items-center">
                        <h3 className={`text-xl font-semibold ${isTeamASideLeft ? 'text-blue-300' : 'text-red-300'}`}>
                            {leftTeam.name}: {leftTeamScore}
                        </h3>
                        <p className="text-sm text-gray-400 font-normal">Faltas: {leftTeamFouls}</p>
                        {leftTeamBonus && <span className="text-yellow-400 text-sm font-normal mt-1">BONUS</span>}
                    </div>

                    {/* Botón de Intercambio */}
                    <button
                        onClick={handleSwapTeamsDisplay}
                        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-700 hover:bg-gray-600 text-white rounded-full w-10 h-10 flex items-center justify-center text-lg font-normal shadow-md transition duration-200 z-10"
                        title="Cambiar lados de la cancha"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h18m-15-6L3 7.5m0 0L7.5 3M3 7.5h18" />
                        </svg>
                    </button>

                    {/* Equipo Derecho (dinámico) */}
                    <div className="flex flex-col items-center">
                        <h3 className={`text-xl font-semibold ${isTeamASideLeft ? 'text-red-300' : 'text-blue-300'}`}>
                            {rightTeam.name}: {rightTeamScore}
                        </h3>
                        <p className="text-sm text-gray-400 font-normal">Faltas: {rightTeamFouls}</p>
                        {rightTeamBonus && <span className="text-yellow-400 text-sm font-normal mt-1">BONUS</span>}
                    </div>
                </div>

                {/* MODIFICADO: Listas de jugadores de ambos equipos - Adaptable a móvil y escritorio */}
                {/* APLICANDO CORRECCIÓN: Usar flex-1 en lugar de w-1/2 para evitar overflow con space-x */}
                <div className="flex space-x-4 sm:space-x-6"> {/* Ajustado space-x para pantallas pequeñas */}
                    {/* Equipo Izquierdo (dinámico) */}
                    <div className="flex-1 bg-gray-800 p-4 rounded-lg shadow-lg"> {/* Cambiado w-1/2 a flex-1 */}
                        <div className="flex justify-between items-center mb-4">
                            <h3 className={`text-2xl font-semibold ${isTeamASideLeft ? 'text-blue-400' : 'text-red-400'}`}>{leftTeam.name}</h3>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => handleTeamUndo(leftTeam.name)}
                                    disabled={!leftTeam.lastAction}
                                    className={`py-1 px-3 rounded-lg font-normal text-sm transition duration-200 ${
                                        leftTeam.lastAction ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                    }`}
                                >
                                    {/* Solo icono para deshacer */}
                                    ↩️
                                </button>
                                <button
                                    onClick={() => {
                                        if (allRosterPlayers.length === 0) {
                                            setAlertMessage("No hay jugadores en tu lista global. Por favor, añade jugadores en la página de 'Gestionar Jugadores' antes de agregarlos a un equipo.");
                                            navigateToPage('roster'); // Redirigir a la página de gestión de jugadores
                                        } else {
                                            setShowRosterSelectionModalForTeam(leftTeam.name);
                                        }
                                    }}
                                    className="bg-green-600 hover:bg-green-700 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg font-normal shadow-md transition duration-200 flex-shrink-0" /* Changed text-xl to text-lg, added flex-shrink-0 */
                                    title="Añadir Jugador de Plantilla"
                                >
                                    +
                                </button>
                            </div>
                        </div>
                        {/* Jugadores en Cancha */}
                        <h4 className="text-lg font-semibold text-white mb-2">En Cancha ({leftTeamOnCourt.length}/5)</h4>
                        <div className="space-y-4 mb-6">
                            {leftTeamOnCourt.length === 0 ? (
                                <p className="text-gray-400 text-sm font-normal">No hay jugadores en cancha.</p>
                            ) : (
                                leftTeamOnCourt.map(player => (
                                    <PlayerRow
                                        key={player.id}
                                        player={player}
                                        teamId={leftTeam.name}
                                        isRunning={isRunning}
                                        updatePlayerStat={updatePlayerStat}
                                        removePlayer={removePlayer}
                                        setShowPlayerStatsModal={setShowPlayerStatsModal}
                                        onInitiateSubstitution={initiateSubstitution}
                                    />
                                ))
                            )}
                        </div>
                        {/* Jugadores en Banca */}
                        <h4 className="text-lg font-semibold text-white mb-2">En Banca ({leftTeamBench.length})</h4>
                        <div className="space-y-4">
                            {leftTeamBench.length === 0 ? (
                                <p className="text-gray-400 text-sm font-normal">No hay jugadores en banca.</p>
                            ) : (
                                leftTeamBench.map(player => (
                                    <PlayerRow
                                        key={player.id}
                                        player={player}
                                        teamId={leftTeam.name}
                                        isRunning={isRunning}
                                        updatePlayerStat={updatePlayerStat}
                                        removePlayer={removePlayer}
                                        setShowPlayerStatsModal={setShowPlayerStatsModal}
                                        onInitiateSubstitution={initiateSubstitution}
                                    />
                                ))
                            )}
                        </div>
                    </div>

                    {/* Equipo Derecho (dinámico) */}
                    <div className="flex-1 bg-gray-800 p-4 rounded-lg shadow-lg"> {/* Cambiado w-1/2 a flex-1 */}
                        <div className="flex justify-between items-center mb-4">
                            <h3 className={`text-2xl font-semibold ${isTeamASideLeft ? 'text-red-400' : 'text-blue-400'}`}>{rightTeam.name}</h3>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => handleTeamUndo(rightTeam.name)}
                                    disabled={!rightTeam.lastAction}
                                    className={`py-1 px-3 rounded-lg font-normal text-sm transition duration-200 ${
                                        rightTeam.lastAction ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                    }`}
                                >
                                    {/* Solo icono para deshacer */}
                                    ↩️
                                </button>
                                <button
                                    onClick={() => {
                                        if (allRosterPlayers.length === 0) {
                                            setAlertMessage("No hay jugadores en tu lista global. Por favor, añade jugadores en la página de 'Gestionar Jugadores' antes de agregarlos a un equipo.");
                                            navigateToPage('roster'); // Redirigir a la página de gestión de jugadores
                                        } else {
                                            setShowRosterSelectionModalForTeam(rightTeam.name);
                                        }
                                    }}
                                    className="bg-green-600 hover:bg-green-700 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg font-normal shadow-md transition duration-200 flex-shrink-0" /* Changed text-xl to text-lg, added flex-shrink-0 */
                                    title="Añadir Jugador de Plantilla"
                                >
                                    +
                                </button>
                            </div>
                        </div>
                        {/* Jugadores en Cancha */}
                        <h4 className="text-lg font-semibold text-white mb-2">En Cancha ({rightTeamOnCourt.length}/5)</h4>
                        <div className="space-y-4 mb-6">
                            {rightTeamOnCourt.length === 0 ? (
                                <p className="text-gray-400 text-sm font-normal">No hay jugadores en cancha.</p>
                            ) : (
                                rightTeamOnCourt.map(player => (
                                    <PlayerRow
                                        key={player.id}
                                        player={player}
                                        teamId={rightTeam.name}
                                        isRunning={isRunning}
                                        updatePlayerStat={updatePlayerStat}
                                        removePlayer={removePlayer}
                                        setShowPlayerStatsModal={setShowPlayerStatsModal}
                                        onInitiateSubstitution={initiateSubstitution}
                                    />
                                ))
                            )}
                        </div>
                        {/* Jugadores en Banca */}
                        <h4 className="text-lg font-semibold text-white mb-2">En Banca ({rightTeamBench.length})</h4>
                        <div className="space-y-4">
                            {rightTeamBench.length === 0 ? (
                                <p className="text-gray-400 text-sm font-normal">No hay jugadores en banca.</p>
                            ) : (
                                rightTeamBench.map(player => (
                                    <PlayerRow
                                        key={player.id}
                                        player={player}
                                        teamId={rightTeam.name}
                                        isRunning={isRunning}
                                        updatePlayerStat={updatePlayerStat}
                                        removePlayer={removePlayer}
                                        setShowPlayerStatsModal={setShowPlayerStatsModal}
                                        onInitiateSubstitution={initiateSubstitution}
                                    />
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Modal de estadísticas del jugador */}
                {showPlayerStatsModal && (
                    <PlayerStatsModal
                        key={`${showPlayerStatsModal.playerId}-${showPlayerStatsModal.teamId}`}
                        playerId={showPlayerStatsModal.playerId}
                        teamId={showPlayerStatsModal.teamId}
                        teamA={teamA}
                        teamB={teamB}
                        updatePlayerStat={updatePlayerStat}
                        onClose={() => setShowPlayerStatsModal(null)}
                        isLongPressOpen={showPlayerStatsModal.isLongPress}
                    />
                )}

                {/* MODIFICADO: Modal de selección de jugador de la lista global */}
                {showRosterSelectionModalForTeam && (
                    <PlayerSelectionModal
                        rosterPlayers={allRosterPlayers}
                        targetTeamPlayers={showRosterSelectionModalForTeam === teamA.name ? teamA.players : teamB.players}
                        allPlayersInGame={allPlayersCurrentlyInGame} // Pass the combined list here
                        onAddSelectedPlayers={(selectedPlayers) => addPlayersToTeamFromRoster(showRosterSelectionModalForTeam, selectedPlayers)} // MODIFICADO
                        onClose={() => setShowRosterSelectionModalForTeam(null)}
                    />
                )}

                {/* NUEVO: Modal de Sustitución */}
                {showSubstitutionModal && playerToSubOut && (
                    <SubstitutionModal
                        teamId={playerToSubOut.teamId}
                        playerToSubOutId={playerToSubOut.playerId}
                        teamA={teamA}
                        teamB={teamB}
                        onConfirmSwap={confirmSubstitution}
                        onClose={() => {
                            setShowSubstitutionModal(false);
                            setPlayerToSubOut(null);
                        }}
                    />
                )}
            </div>
        );
    });

    // Componente del modal de estadísticas del jugador
    const PlayerStatsModal = ({ playerId, teamId, teamA, teamB, updatePlayerStat, onClose, isLongPressOpen }) => {
        // Encuentra el jugador usando el teamId y playerId pasados
        const currentTeam = teamId === teamA.name ? teamA : teamB;
        const player = currentTeam.players.find(p => p.id === playerId);

        // Estado para el modo de múltiples toques (controlado por isLongPressOpen)
        const [isMultiTapMode, setIsMultiTapMode] = useState(isLongPressOpen);

        // Reiniciar modo cuando el modal se abre o cambia el modo de apertura
        useEffect(() => {
            setIsMultiTapMode(isLongPressOpen);
        }, [playerId, teamId, isLongPressOpen]); // Dependencias: jugador, equipo y cómo se abrió

        if (!player) {
            console.error(`Error: Jugador con ID ${playerId} no encontrado en el equipo ${teamId}.`);
            onClose(); // Cierra el modal si el jugador no se encuentra
            return null;
        }

        // Función local para manejar la actualización de estadísticas
        const handleStatUpdate = (stat, value) => {
            updatePlayerStat(teamId, player.id, stat, value);

            // MODIFICADO: Ya no se cierra automáticamente aquí.
            // El modal solo se cerrará con el botón "Cerrar".
        };

        // Cálculos para porcentajes de tiro, con manejo de división por cero
        const total2ptAttempts = player.made2pt + player.missed2pt;
        const total3ptAttempts = player.made3pt + player.missed3pt;
        const totalFTAttempts = player.madeFT + player.missedFT;

        const fgPercentage = (total2ptAttempts + total3ptAttempts) > 0
            ? (((player.made2pt + player.made3pt) / (total2ptAttempts + total3ptAttempts)) * 100).toFixed(1)
            : '0.0';
        const threePtPercentage = total3ptAttempts > 0
            ? ((player.made3pt / total3ptAttempts) * 100).toFixed(1)
            : '0.0';
        const ftPercentage = totalFTAttempts > 0
            ? ((player.madeFT / totalFTAttempts) * 100).toFixed(1)
            : '0.0';


        return (
            // Increased z-index to 60 to be above bottom navigation (z-50)
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4"> {/* Added p-4 for padding on small screens */}
                {/* Ajustado: w-full h-full para ocupar casi toda la pantalla, y max-w-screen-lg para limitar el ancho en pantallas muy grandes */}
                <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-screen-lg h-full max-h-[90vh] border border-gray-700 flex flex-col relative">
                    <div className="flex justify-between items-center mb-4 sm:mb-6"> {/* Adjusted mb for smaller screens */}
                        <h3 className="text-2xl sm:text-3xl font-semibold text-white"> {/* Responsive font size */}
                            {player.name} <span className="text-gray-400 text-lg sm:text-xl font-normal">#{player.jersey}</span> {/* Responsive font size */}
                        </h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white text-3xl sm:text-4xl leading-none font-normal" /* Responsive font size */
                        >
                            &times;
                        </button>
                    </div>

                    {/* Contenedor para las estadísticas con scroll horizontal */}
                    {/* Removed overflow-y-auto from this div. The main modal container will handle overall scroll if needed. */}
                    {/* Adjusted grid for responsiveness: 2 columns on mobile, 3 on sm, 4 on md */}
                    <div className="flex-grow pb-16 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                        {/* Fila de Aciertos */}
                        {/* 2 Puntos - Aciertos */}
                        <div className="bg-gray-700 p-2 sm:p-3 rounded-md flex flex-col items-center justify-center text-center"> {/* Adjusted padding */}
                            <span className="font-normal text-white text-xs sm:text-sm mb-1 sm:mb-2 bg-green-600 px-1 sm:px-2 py-0.5 sm:py-1 rounded-md w-full">2 Puntos (Aciertos)</span> {/* Adjusted font size and padding */}
                            <div className="flex space-x-1 sm:space-x-2 items-center mt-1 sm:mt-2"> {/* Adjusted space-x */}
                                <button onClick={() => handleStatUpdate('2PM', 1)} className="bg-green-600 hover:bg-green-700 text-white rounded-md px-2 sm:px-4 py-1 sm:py-2 text-sm sm:text-base font-normal">
                                    +
                                </button>
                                <span className="bg-gray-600 text-white rounded-md px-2 sm:px-3 py-1 sm:py-2 text-base sm:text-lg font-normal min-w-[30px] sm:min-w-[40px] text-center">
                                    {player.made2pt}
                                </span>
                                <button onClick={() => handleStatUpdate('2PM', -1)} className="bg-red-600 hover:bg-red-700 text-white rounded-md px-2 sm:px-4 py-1 sm:py-2 text-sm sm:text-base font-normal">
                                    -
                                </button>
                            </div>
                        </div>

                        {/* 3 Puntos - Aciertos */}
                        <div className="bg-gray-700 p-2 sm:p-3 rounded-md flex flex-col items-center justify-center text-center">
                            <span className="font-normal text-white text-xs sm:text-sm mb-1 sm:mb-2 bg-green-600 px-1 sm:px-2 py-0.5 sm:py-1 rounded-md w-full">3 Puntos (Aciertos)</span>
                            <div className="flex space-x-1 sm:space-x-2 items-center mt-1 sm:mt-2">
                                <button onClick={() => handleStatUpdate('3PM', 1)} className="bg-green-600 hover:bg-green-700 text-white rounded-md px-2 sm:px-4 py-1 sm:py-2 text-sm sm:text-base font-normal">
                                    +
                                </button>
                                <span className="bg-gray-600 text-white rounded-md px-2 sm:px-3 py-1 sm:py-2 text-base sm:text-lg font-normal min-w-[30px] sm:min-w-[40px] text-center">
                                    {player.made3pt}
                                </span>
                                <button onClick={() => handleStatUpdate('3PM', -1)} className="bg-red-600 hover:bg-red-700 text-white rounded-md px-2 sm:px-4 py-1 sm:py-2 text-sm sm:text-base font-normal">
                                    -
                                </button>
                            </div>
                        </div>

                        {/* Tiros Libres - Aciertos */}
                        <div className="bg-gray-700 p-2 sm:p-3 rounded-md flex flex-col items-center justify-center text-center">
                            <span className="font-normal text-white text-xs sm:text-sm mb-1 sm:mb-2 bg-green-600 px-1 sm:px-2 py-0.5 sm:py-1 rounded-md w-full">T. Libres (Aciertos)</span>
                            <div className="flex space-x-1 sm:space-x-2 items-center mt-1 sm:mt-2">
                                <button onClick={() => handleStatUpdate('FTM', 1)} className="bg-green-600 hover:bg-green-700 text-white rounded-md px-2 sm:px-4 py-1 sm:py-2 text-sm sm:text-base font-normal">
                                    +
                                </button>
                                <span className="bg-gray-600 text-white rounded-md px-2 sm:px-3 py-1 sm:py-2 text-base sm:text-lg font-normal min-w-[30px] sm:min-w-[40px] text-center">
                                    {player.madeFT}
                                </span>
                                <button onClick={() => handleStatUpdate('FTM', -1)} className="bg-red-600 hover:bg-red-700 text-white rounded-md px-2 sm:px-4 py-1 sm:py-2 text-sm sm:text-base font-normal">
                                    -
                                </button>
                            </div>
                        </div>

                        {/* Fila de Fallos */}
                        {/* 2 Puntos - Fallos */}
                        <div className="bg-gray-700 p-2 sm:p-3 rounded-md flex flex-col items-center justify-center text-center">
                            <span className="font-normal text-white text-xs sm:text-sm mb-1 sm:mb-2 bg-red-600 px-1 sm:px-2 py-0.5 sm:py-1 rounded-md w-full">2 Puntos (Fallos)</span>
                            <div className="flex space-x-1 sm:space-x-2 items-center mt-1 sm:mt-2">
                                <button onClick={() => handleStatUpdate('2PTM', 1)} className="bg-green-600 hover:bg-green-700 text-white rounded-md px-2 sm:px-4 py-1 sm:py-2 text-sm sm:text-base font-normal">
                                    +
                                </button>
                                <span className="bg-gray-600 text-white rounded-md px-2 sm:px-3 py-1 sm:py-2 text-base sm:text-lg font-normal min-w-[30px] sm:min-w-[40px] text-center">
                                    {player.missed2pt}
                                </span>
                                <button onClick={() => handleStatUpdate('2PTM', -1)} className="bg-red-600 hover:bg-red-700 text-white rounded-md px-2 sm:px-4 py-1 sm:py-2 text-sm sm:text-base font-normal">
                                    -
                                </button>
                            </div>
                        </div>

                        {/* 3 Puntos - Fallos */}
                        <div className="bg-gray-700 p-2 sm:p-3 rounded-md flex flex-col items-center justify-center text-center">
                            <span className="font-normal text-white text-xs sm:text-sm mb-1 sm:mb-2 bg-red-600 px-1 sm:px-2 py-0.5 sm:py-1 rounded-md w-full">3 Puntos (Fallos)</span>
                            <div className="flex space-x-1 sm:space-x-2 items-center mt-1 sm:mt-2">
                                <button onClick={() => handleStatUpdate('3PTM', 1)} className="bg-green-600 hover:bg-green-700 text-white rounded-md px-2 sm:px-4 py-1 sm:py-2 text-sm sm:text-base font-normal">
                                    +
                                </button>
                                <span className="bg-gray-600 text-white rounded-md px-2 sm:px-3 py-1 sm:py-2 text-base sm:text-lg font-normal min-w-[30px] sm:min-w-[40px] text-center">
                                    {player.missed3pt}
                                </span>
                                <button onClick={() => handleStatUpdate('3PTM', -1)} className="bg-red-600 hover:bg-red-700 text-white rounded-md px-2 sm:px-4 py-1 sm:py-2 text-sm sm:text-base font-normal">
                                    -
                                </button>
                            </div>
                        </div>

                        {/* Tiros Libres - Fallos */}
                        <div className="bg-gray-700 p-2 sm:p-3 rounded-md flex flex-col items-center justify-center text-center">
                            <span className="font-normal text-white text-xs sm:text-sm mb-1 sm:mb-2 bg-red-600 px-1 sm:px-2 py-0.5 sm:py-1 rounded-md w-full">T. Libres (Fallos)</span>
                            <div className="flex space-x-1 sm:space-x-2 items-center mt-1 sm:mt-2">
                                <button onClick={() => handleStatUpdate('FTT', 1)} className="bg-green-600 hover:bg-green-700 text-white rounded-md px-2 sm:px-4 py-1 sm:py-2 text-sm sm:text-base font-normal">
                                    +
                                </button>
                                <span className="bg-gray-600 text-white rounded-md px-2 sm:px-3 py-1 sm:py-2 text-base sm:text-lg font-normal min-w-[30px] sm:min-w-[40px] text-center">
                                    {player.missedFT}
                                </span>
                                <button onClick={() => handleStatUpdate('FTT', -1)} className="bg-red-600 hover:bg-red-700 text-white rounded-md px-2 sm:px-4 py-1 sm:py-2 text-sm sm:text-base font-normal">
                                    -
                                </button>
                            </div>
                        </div>

                        {/* Otras estadísticas */}
                        {/* Rebotes */}
                        <div className="bg-gray-700 p-2 sm:p-3 rounded-md flex flex-col items-center justify-center text-center">
                            <span className="font-normal text-white text-xs sm:text-sm mb-1 sm:mb-2 bg-purple-600 px-1 sm:px-2 py-0.5 sm:py-1 rounded-md w-full">Rebotes</span>
                            <div className="flex space-x-1 sm:space-x-2 items-center mt-1 sm:mt-2">
                                <button onClick={() => handleStatUpdate('REB', 1)} className="bg-green-600 hover:bg-green-700 text-white rounded-md px-2 sm:px-4 py-1 sm:py-2 text-sm sm:text-base font-normal">
                                    +
                                </button>
                                <span className="bg-gray-600 text-white rounded-md px-2 sm:px-3 py-1 sm:py-2 text-base sm:text-lg font-normal min-w-[30px] sm:min-w-[40px] text-center">
                                    {player.rebounds}
                                </span>
                                <button onClick={() => handleStatUpdate('REB', -1)} className="bg-red-600 hover:bg-red-700 text-white rounded-md px-2 sm:px-4 py-1 sm:py-2 text-sm sm:text-base font-normal">
                                    -
                                </button>
                            </div>
                        </div>
                        {/* Asistencias */}
                        <div className="bg-gray-700 p-2 sm:p-3 rounded-md flex flex-col items-center justify-center text-center">
                            <span className="font-normal text-white text-xs sm:text-sm mb-1 sm:mb-2 bg-pink-600 px-1 sm:px-2 py-0.5 sm:py-1 rounded-md w-full">Asistencias</span>
                            <div className="flex space-x-1 sm:space-x-2 items-center mt-1 sm:mt-2">
                                <button onClick={() => handleStatUpdate('AST', 1)} className="bg-green-600 hover:bg-green-700 text-white rounded-md px-2 sm:px-4 py-1 sm:py-2 text-sm sm:text-base font-normal">
                                    +
                                </button>
                                <span className="bg-gray-600 text-white rounded-md px-2 sm:px-3 py-1 sm:py-2 text-base sm:text-lg font-normal min-w-[30px] sm:min-w-[40px] text-center">
                                    {player.assists}
                                </span>
                                <button onClick={() => handleStatUpdate('AST', -1)} className="bg-red-600 hover:bg-red-700 text-white rounded-md px-2 sm:px-4 py-1 sm:py-2 text-sm sm:text-base font-normal">
                                    -
                                </button>
                            </div>
                        </div>
                        {/* Robos */}
                        <div className="bg-gray-700 p-2 sm:p-3 rounded-md flex flex-col items-center justify-center text-center">
                            <span className="font-normal text-white text-xs sm:text-sm mb-1 sm:mb-2 bg-teal-600 px-1 sm:px-2 py-0.5 sm:py-1 rounded-md w-full">Robos</span>
                            <div className="flex space-x-1 sm:space-x-2 items-center mt-1 sm:mt-2">
                                <button onClick={() => handleStatUpdate('STL', 1)} className="bg-green-600 hover:bg-green-700 text-white rounded-md px-2 sm:px-4 py-1 sm:py-2 text-sm sm:text-base font-normal">
                                    +
                                </button>
                                <span className="bg-gray-600 text-white rounded-md px-2 sm:px-3 py-1 sm:py-2 text-base sm:text-lg font-normal min-w-[30px] sm:min-w-[40px] text-center">
                                    {player.steals}
                                </span>
                                <button onClick={() => handleStatUpdate('STL', -1)} className="bg-red-600 hover:bg-red-700 text-white rounded-md px-2 sm:px-4 py-1 sm:py-2 text-sm sm:text-base font-normal">
                                    -
                                </button>
                            </div>
                        </div>
                        {/* Bloqueos */}
                        <div className="bg-gray-700 p-2 sm:p-3 rounded-md flex flex-col items-center justify-center text-center">
                            <span className="font-normal text-white text-xs sm:text-sm mb-1 sm:mb-2 bg-indigo-600 px-1 sm:px-2 py-0.5 sm:py-1 rounded-md w-full">Bloqueos</span>
                            <div className="flex space-x-1 sm:space-x-2 items-center mt-1 sm:mt-2">
                                <button onClick={() => handleStatUpdate('BLK', 1)} className="bg-green-600 hover:bg-green-700 text-white rounded-md px-2 sm:px-4 py-1 sm:py-2 text-sm sm:text-base font-normal">
                                    +
                                </button>
                                <span className="bg-gray-600 text-white rounded-md px-2 sm:px-3 py-1 sm:py-2 text-base sm:text-lg font-normal min-w-[30px] sm:min-w-[40px] text-center">
                                    {player.blocks}
                                </span>
                                <button onClick={() => handleStatUpdate('BLK', -1)} className="bg-red-600 hover:bg-red-700 text-white rounded-md px-2 sm:px-4 py-1 sm:py-2 text-sm sm:text-base font-normal">
                                    -
                                </button>
                            </div>
                        </div>
                        {/* Pérdidas */}
                        <div className="bg-gray-700 p-2 sm:p-3 rounded-md flex flex-col items-center justify-center text-center">
                            <span className="font-normal text-white text-xs sm:text-sm mb-1 sm:mb-2 bg-orange-600 px-1 sm:px-2 py-0.5 sm:py-1 rounded-md w-full">Pérdidas</span>
                            <div className="flex space-x-1 sm:space-x-2 items-center mt-1 sm:mt-2">
                                <button onClick={() => handleStatUpdate('TOV', 1)} className="bg-green-600 hover:bg-green-700 text-white rounded-md px-2 sm:px-4 py-1 sm:py-2 text-sm sm:text-base font-normal">
                                    +
                                </button>
                                <span className="bg-gray-600 text-white rounded-md px-2 sm:px-3 py-1 sm:py-2 text-base sm:text-lg font-normal min-w-[30px] sm:min-w-[40px] text-center">
                                    {player.turnovers}
                                </span>
                                <button onClick={() => handleStatUpdate('TOV', -1)} className="bg-red-600 hover:bg-red-700 text-white rounded-md px-2 sm:px-4 py-1 sm:py-2 text-sm sm:text-base font-normal">
                                    -
                                </button>
                            </div>
                        </div>
                        {/* Faltas */}
                        <div className="bg-gray-700 p-2 sm:p-3 rounded-md flex flex-col items-center justify-center text-center">
                            <span className="font-normal text-white text-xs sm:text-sm mb-1 sm:mb-2 bg-red-600 px-1 sm:px-2 py-0.5 sm:py-1 rounded-md w-full">Faltas</span>
                            <div className="flex space-x-1 sm:space-x-2 items-center mt-1 sm:mt-2">
                                <button onClick={() => handleStatUpdate('FLT', 1)} className="bg-green-600 hover:bg-green-700 text-white rounded-md px-2 sm:px-4 py-1 sm:py-2 text-sm sm:text-base font-normal">
                                    +
                                </button>
                                <span className="bg-gray-600 text-white rounded-md px-2 sm:px-3 py-1 sm:py-2 text-base sm:text-lg font-normal min-w-[30px] sm:min-w-[40px] text-center">
                                    {player.fouls}
                                </span>
                                <button onClick={() => handleStatUpdate('FLT', -1)} className="bg-red-600 hover:bg-red-700 text-white rounded-md px-2 sm:px-4 py-1 sm:py-2 text-sm sm:text-base font-normal">
                                    -
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Botón de Cierre en la parte inferior derecha */}
                    <button
                        onClick={onClose}
                        className="absolute bottom-4 right-4 bg-gray-700 hover:bg-gray-600 text-white font-normal py-2 px-4 rounded-lg shadow-md transition duration-200"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        );
    };

    // Componente del modal de selección de jugador de la lista global
    const PlayerSelectionModal = useCallback(({ rosterPlayers, targetTeamPlayers, allPlayersInGame, onAddSelectedPlayers, onClose }) => {
        const [selectedPlayers, setSelectedPlayers] = useState([]);

        // This effect ensures that if the modal is opened for a team, and some players are already in the *other* team,
        // those players are not pre-selected or selectable.
        // It also handles cases where a player might be added to the *other* team while this modal is open.
        useEffect(() => {
            // Filter out any players from previous selections that are now in allPlayersInGame
            // This ensures that if a player was selected for Team A, and then Team B's modal is opened,
            // that player isn't still "selected" in the modal's internal state.
            setSelectedPlayers(prev =>
                prev.filter(p => !allPlayersInGame.some(gameP => gameP.id === p.id))
            );
        }, [allPlayersInGame]); // Dependency on allPlayersInGame ensures re-evaluation when game roster changes

        const handleCheckboxChange = (player) => {
            // A player is disabled if they are already in *any* team in the game.
            const isAlreadyInAnyTeam = allPlayersInGame.some(gameP => gameP.id === player.id);

            if (isAlreadyInAnyTeam) {
                return; // Cannot change selection for players already in a team
            }

            setSelectedPlayers(prev =>
                prev.some(p => p.id === player.id)
                    ? prev.filter(p => p.id !== player.id)
                    : [...prev, player]
            );
        };

        const handleAddButtonClick = () => {
            onAddSelectedPlayers(selectedPlayers);
            onClose();
        };

        return (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4">
                <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md border border-gray-700 max-h-[80vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-2xl font-semibold text-white">Seleccionar Jugadores</h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white text-3xl leading-none font-normal"
                        >
                            &times;
                        </button>
                    </div>

                    {rosterPlayers.length === 0 ? ( // Check global roster length
                        <p className="text-gray-400 font-normal">No hay jugadores en la plantilla global. Por favor, añade jugadores en la página de 'Gestionar Jugadores'.</p>
                    ) : (
                        <div className="space-y-3">
                            {rosterPlayers.map(player => {
                                const isAlreadyInAnyTeam = allPlayersInGame.some(gameP => gameP.id === player.id);
                                const isSelectedInThisModal = selectedPlayers.some(sP => sP.id === player.id);

                                return (
                                    <label
                                        key={player.id}
                                        className={`w-full p-3 rounded-md flex items-center justify-between transition duration-200 font-normal
                                            ${isAlreadyInAnyTeam ? 'bg-gray-700 text-gray-400 opacity-50 cursor-not-allowed' : 'bg-gray-700 hover:bg-gray-600 text-white cursor-pointer'}`}
                                    >
                                        <span>#{player.jersey} - {player.name}</span>
                                        <input
                                            type="checkbox"
                                            // If the player is already in ANY team, it should be checked and disabled.
                                            // Otherwise, it's checked if it's in the current modal's selection.
                                            checked={isAlreadyInAnyTeam || isSelectedInThisModal}
                                            onChange={() => handleCheckboxChange(player)}
                                            disabled={isAlreadyInAnyTeam}
                                            className="form-checkbox h-5 w-5 text-green-600 rounded"
                                        />
                                    </label>
                                );
                            })}
                        </div>
                    )}
                    <button
                        onClick={handleAddButtonClick}
                        disabled={selectedPlayers.length === 0}
                        className={`mt-6 w-full py-3 rounded-lg font-normal text-lg shadow-lg transition duration-200 ${
                            selectedPlayers.length > 0 ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        }`}
                    >
                        Añadir {selectedPlayers.length} Jugador(es)
                    </button>
                </div>
            </div>
        );
    }, []);

    // NUEVO: Componente para el modal de sustitución
    const SubstitutionModal = useCallback(({ teamId, playerToSubOutId, teamA, teamB, onConfirmSwap, onClose }) => {
        const currentTeam = teamId === teamA.name ? teamA : teamB;
        const playerToSubOut = currentTeam.players.find(p => p.id === playerToSubOutId);

        const onCourtPlayers = currentTeam.players.filter(p => p.isOnCourt && p.id !== playerToSubOutId);
        const benchPlayers = currentTeam.players.filter(p => !p.isOnCourt && p.id !== playerToSubOutId);

        const [selectedPlayerToSubIn, setSelectedPlayerToSubIn] = useState(null);

        if (!playerToSubOut) {
            console.error("Jugador a sustituir no encontrado.");
            onClose();
            return null;
        }

        const handleConfirm = () => {
            if (selectedPlayerToSubIn) {
                onConfirmSwap(teamId, playerToSubOut.id, selectedPlayerToSubIn.id);
            } else {
                setAlertMessage("Por favor, selecciona un jugador para sustituir.");
            }
        };

        const isSubbingOutFromCourt = playerToSubOut.isOnCourt;

        return (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4">
                <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md border border-gray-700 max-h-[80vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-2xl font-semibold text-white">Realizar Sustitución</h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white text-3xl leading-none font-normal"
                        >
                            &times;
                        </button>
                    </div>

                    <p className="text-gray-300 mb-4 font-normal">
                        Sustituyendo a: <span className="font-semibold text-white">#{playerToSubOut.jersey} {playerToSubOut.name}</span> (actualmente {isSubbingOutFromCourt ? 'en cancha' : 'en banca'})
                    </p>

                    <h4 className="text-xl font-semibold text-white mb-3">Seleccionar Jugador para Intercambiar:</h4>

                    {isSubbingOutFromCourt ? ( // Si el que sale está en cancha, listamos los de la banca
                        benchPlayers.length === 0 ? (
                            <p className="text-gray-400 font-normal">No hay jugadores en la banca para sustituir.</p>
                        ) : (
                            <div className="space-y-3">
                                {benchPlayers.map(player => (
                                    <button
                                        key={player.id}
                                        onClick={() => setSelectedPlayerToSubIn(player)}
                                        className={`w-full p-3 rounded-md text-left transition duration-200 font-normal flex items-center justify-between ${
                                            selectedPlayerToSubIn?.id === player.id ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'
                                        }`}
                                    >
                                        <span>#{player.jersey} - {player.name}</span>
                                        {selectedPlayerToSubIn?.id === player.id && (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )
                    ) : ( // Si el que sale está en banca, listamos los de la cancha
                        onCourtPlayers.length === 0 ? (
                            <p className="text-gray-400 font-normal">No hay jugadores en cancha para sustituir.</p>
                        ) : (
                            <div className="space-y-3">
                                {onCourtPlayers.map(player => (
                                    <button
                                        key={player.id}
                                        onClick={() => setSelectedPlayerToSubIn(player)}
                                        className={`w-full p-3 rounded-md text-left transition duration-200 font-normal flex items-center justify-between ${
                                            selectedPlayerToSubIn?.id === player.id ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'
                                        }`}
                                    >
                                        <span>#{player.jersey} - {player.name}</span>
                                        {selectedPlayerToSubIn?.id === player.id && (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )
                    )}

                    <div className="flex justify-end space-x-4 mt-6">
                        <button
                            onClick={onClose}
                            className="bg-gray-600 hover:bg-gray-700 text-white font-normal py-2 px-4 rounded-lg transition duration-200"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={!selectedPlayerToSubIn}
                            className={`py-2 px-4 rounded-lg font-normal transition duration-200 ${
                                selectedPlayerToSubIn ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            }`}
                        >
                            Confirmar Sustitución
                        </button>
                    </div>
                </div>
            </div>
        );
    }, [setAlertMessage]);


    // NUEVO: Componente para ver y gestionar la plantilla completa (editable)
    const RosterViewModal = ({ allPlayers, addPlayerToGlobalRoster, updateGlobalPlayer, removeGlobalPlayer, setAlertMessage, onClose }) => {
        const [newPlayerName, setNewPlayerName] = useState('');
        const [newPlayerJersey, setNewPlayerJersey] = useState('');
        const [editingPlayerId, setEditingPlayerId] = useState(null);
        const [editPlayerName, setEditPlayerName] = useState('');
        const [editPlayerJersey, setEditPlayerJersey] = useState('');
        const [confirmDeletePlayerId, setConfirmDeletePlayerId] = useState(null);
        const [successMessage, setSuccessMessage] = useState('');

        const newPlayerNameInputRef = useRef(null);

        const randomNames = useMemo(() => [
            "Juan", "María", "Pedro", "Ana", "Luis", "Sofía", "Carlos", "Laura",
            "Miguel", "Elena", "José", "Isabel", "David", "Carmen", "Javier", "Pilar",
            "Fernando", "Rosa", "Daniel", "Lucía", "Alejandro", "Martina", "Pablo", "Valeria"
        ], []);

        const handleAddPlayer = (e) => {
            e.preventDefault();
            const nameInput = newPlayerName.trim();
            let finalName;
            if (nameInput === '') {
                finalName = randomNames[Math.floor(Math.random() * randomNames.length)];
            } else {
                finalName = nameInput;
            }

            let jersey = parseInt(newPlayerJersey);
            if (isNaN(jersey) || jersey <= 0) {
                const maxJersey = allPlayers.reduce((max, p) => Math.max(max, p.jersey), 0);
                jersey = maxJersey + 1;
            } else {
                if (allPlayers.some(p => p.jersey === jersey)) {
                    setAlertMessage(`El número de camiseta ${jersey} ya está en uso.`);
                    return;
                }
            }
            addPlayerToGlobalRoster({ name: finalName, jersey });
            setNewPlayerName('');
            setNewPlayerJersey('');
            setSuccessMessage('Jugador añadido exitosamente.');
            setTimeout(() => setSuccessMessage(''), 3000);

            if (newPlayerNameInputRef.current) {
                newPlayerNameInputRef.current.focus();
            }
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
            const isJerseyTakenByAnotherPlayer = allPlayers.some(p => p.jersey === jersey && p.id !== editingPlayerId);
            if (isJerseyTakenByAnotherPlayer) {
                setAlertMessage(`El número de camiseta ${jersey} ya está en uso por otro jugador.`);
                return;
            }

            updateGlobalPlayer(editingPlayerId, { name: editPlayerName.trim(), jersey });
            setEditingPlayerId(null);
            setEditPlayerName('');
            setEditPlayerJersey('');
            setAlertMessage('Jugador actualizado.');
        };

        const handleDeletePlayerClick = (playerId) => {
            setConfirmDeletePlayerId(playerId);
        };

        const confirmDeletePlayer = () => {
            removeGlobalPlayer(confirmDeletePlayerId);
            setConfirmDeletePlayerId(null);
            setAlertMessage('Jugador eliminado.');
        };

        const cancelDeletePlayer = () => {
            setConfirmDeletePlayerId(null);
        };

        return (
            // Increased z-index to 60 to be above bottom navigation (z-50)
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4">
                <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md border border-gray-700 max-h-[90vh] overflow-y-auto flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-2xl font-semibold text-white">Gestionar Plantilla</h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white text-3xl leading-none font-normal"
                        >
                            &times;
                        </button>
                    </div>

                    {successMessage && (
                        <div className="bg-green-600 text-white p-3 rounded-md text-center mb-4 animate-fadeInOut font-normal">
                            {successMessage}
                        </div>
                    )}

                    {/* Formulario para añadir nuevo jugador */}
                    <div className="bg-gray-700 p-4 rounded-lg shadow-md mb-4">
                        <h4 className="text-lg font-semibold text-white mb-3">Añadir Nuevo Jugador</h4>
                        <form onSubmit={handleAddPlayer} className="flex flex-col sm:flex-row gap-3">
                            <input
                                type="text"
                                placeholder="Nombre (opcional)"
                                value={newPlayerName}
                                onChange={(e) => setNewPlayerName(e.target.value)}
                                className="flex-grow bg-gray-600 text-white p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 font-normal"
                                ref={newPlayerNameInputRef}
                            />
                            <input
                                type="number"
                                placeholder="Número (opcional)"
                                value={newPlayerJersey}
                                onChange={(e) => setNewPlayerJersey(e.target.value)}
                                className="w-16 sm:w-24 bg-gray-600 text-white p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 font-normal"
                            />
                            <button
                                type="submit"
                                className="bg-green-600 hover:bg-green-700 text-white font-normal py-2 px-4 rounded-lg shadow-md transition duration-200"
                            >
                                Añadir
                            </button>
                        </form>
                    </div>

                    {/* Lista de jugadores */}
                    <div className="flex-grow overflow-y-auto space-y-3">
                        {allPlayers.length === 0 ? (
                            <p className="text-gray-400 text-center mt-4 font-normal">No hay jugadores en la plantilla.</p>
                        ) : (
                            allPlayers.map(player => (
                                <div
                                    key={player.id}
                                    className="bg-gray-700 p-3 rounded-md flex flex-col sm:flex-row items-center justify-between gap-3"
                                >
                                    {editingPlayerId === player.id ? (
                                        <form onSubmit={handleUpdatePlayer} className="flex flex-col sm:flex-row gap-3 w-full">
                                            <input
                                                type="text"
                                                value={editPlayerName}
                                                onChange={(e) => setEditPlayerName(e.target.value)}
                                                className="flex-grow bg-gray-600 text-white p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-normal"
                                            />
                                            <input
                                                type="number"
                                                value={editPlayerJersey}
                                                onChange={(e) => setEditPlayerJersey(e.target.value)}
                                                className="w-16 sm:w-24 bg-gray-600 text-white p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-normal"
                                            />
                                            <div className="flex gap-2">
                                                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 px-3 rounded-md font-normal">Guardar</button>
                                                <button type="button" onClick={() => setEditingPlayerId(null)} className="bg-gray-500 hover:bg-gray-600 text-white text-sm py-2 px-3 rounded-md font-normal">Cancelar</button>
                                            </div>
                                        </form>
                                    ) : (
                                        <>
                                            <span className="text-lg font-semibold">{player.name} <span className="text-gray-400 font-normal">#{player.jersey}</span></span>
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleEditClick(player)}
                                                    className="bg-yellow-500 hover:bg-yellow-600 text-white text-sm py-2 px-3 rounded-md font-normal"
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    onClick={() => handleDeletePlayerClick(player.id)}
                                                    className="bg-red-600 hover:bg-red-700 text-white text-sm py-2 px-3 rounded-md font-normal"
                                                >
                                                    Eliminar
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    {confirmDeletePlayerId && (
                        <ConfirmDialog
                            message={`¿Estás seguro de que quieres eliminar a ${allPlayers.find(p => p.id === confirmDeletePlayerId)?.name || 'este jugador'} de la lista?`}
                            onConfirm={confirmDeletePlayer}
                            onCancel={cancelDeletePlayer}
                        />
                    )}
                </div>
            </div>
        );
    };


    // Componente para la página de historial
    const HistoryPage = useCallback(() => {
        const [selectedGame, setSelectedGame] = useState(null);
        const [confirmDeleteGameId, setConfirmDeleteGameId] = useState(null); // State for confirming game deletion

        // Function to handle actual deletion
        const handleDeleteGame = useCallback((gameId) => {
            setHistory(prevHistory => prevHistory.filter(game => game.id !== gameId));
            setConfirmDeleteGameId(null); // Close confirmation modal
            setAlertMessage('Partido eliminado del historial.');
        }, [setHistory, setAlertMessage]);


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
            csvContent += `Duración:,${escapeCsv(game.duration)}\n`;
            csvContent += `Cuartos Jugados:,${escapeCsv(game.quartersPlayed)}/${escapeCsv(game.totalQuarters)}\n`; // Añadir cuartos
            if (game.overtimePeriodsPlayed > 0) {
                csvContent += `Tiempos Extra Jugados:,${escapeCsv(game.overtimePeriodsPlayed)}\n\n`; // Añadir tiempos extra
            } else {
                csvContent += `\n`;
            }


            // Encabezados para las estadísticas de los jugadores
            const playerHeaders = [
                'Equipo', 'Nombre', 'Número', 'Puntos', 'Rebotes', 'Asistencias', 'Robos', 'Bloqueos', 'Pérdidas', 'Faltas',
                '2PM', '2PTM', '3PM', '3PTM', 'Tiros Libres Anotados', 'FTT', 'FG%', '3P%', 'FT%'
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
            csvContent += `\n${escapeCsv(game.teamA.name)} - Puntuación: ${game.teamA.score} | Faltas Totales: ${game.teamA.totalFouls}\n`;
            addPlayerRows(game.teamA.name, game.teamA.players);

            // Añadir datos del equipo B
            csvContent += `\n${escapeCsv(game.teamB.name)} - Puntuación: ${game.teamB.score} | Faltas Totales: ${game.teamB.totalFouls}\n`;
            addPlayerRows(game.teamB.name, game.teamB.players);

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `Partido_${game.date.replace(/[/:\s,]/g, '_')})}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url); // Limpiar la URL del objeto
        };


        return (
            <div className="min-h-screen text-white p-4 pb-20">
                <div className="flex justify-between items-center mb-6">
                    {/* Botón de volver eliminado, ahora en la barra de navegación inferior */}
                    <h2 className="text-3xl font-semibold text-white">Historial de Partidos</h2>
                </div>

                {history.length === 0 ? (
                    <p className="text-center text-gray-400 text-lg mt-8 font-normal">No hay partidos en el historial.</p>
                ) : (
                    <div className="space-y-4">
                        {history.map(game => (
                            <div
                                key={game.id}
                                className="bg-gray-800 p-4 rounded-lg shadow-lg flex items-center justify-between gap-4"
                            >
                                <div className="flex-grow cursor-pointer" onClick={() => setSelectedGame(game)}>
                                    <h3 className="text-xl font-semibold text-white">
                                        {game.teamA.name} {game.teamA.score} - {game.teamB.name} {game.teamB.score}
                                    </h3>
                                    <p className="text-gray-400 text-sm font-normal">Fecha: {game.date} | Duración: {game.duration} | Cuartos: {game.quartersPlayed}/{game.totalQuarters} {game.overtimePeriodsPlayed > 0 ? `| T. Extra: ${game.overtimePeriodsPlayed}` : ''}</p>
                                </div>
                                <div className="flex space-x-2 flex-shrink-0">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation(); // Prevent opening game details
                                            setConfirmDeleteGameId(game.id);
                                        }}
                                        className="bg-red-600 hover:bg-red-700 text-white rounded-md px-3 py-2 text-sm font-normal shadow-md transition duration-200"
                                    >
                                        Eliminar
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation(); // Prevent opening game details
                                            exportGameToCsv(game);
                                        }}
                                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-md px-3 py-2 text-sm font-normal shadow-md transition duration-200"
                                    >
                                        Exportar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {selectedGame && (
                    // Increased z-index to 60 to be above bottom navigation (z-50)
                    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4 overflow-y-auto">
                        <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-4xl border border-gray-700">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-2xl font-semibold text-white">Detalles del Partido</h3>
                                <button
                                    onClick={() => setSelectedGame(null)} // Botón de cierre en la esquina superior derecha
                                    className="text-gray-400 hover:text-white text-3xl leading-none font-normal"
                                >
                                    &times;
                                </button>
                            </div>

                            <p className="text-gray-300 mb-2 font-normal">Fecha: {selectedGame.date}</p>
                            <p className="text-gray-300 mb-2 font-normal">Duración: {selectedGame.duration}</p>
                            <p className="text-gray-300 mb-4 font-normal">Cuartos: {selectedGame.quartersPlayed}/{selectedGame.totalQuarters} {selectedGame.overtimePeriodsPlayed > 0 ? `| T. Extra: ${selectedGame.overtimePeriodsPlayed}` : ''}</p>

                            {/* Tabla de Puntos por Cuarto */}
                            {selectedGame.teamA.quarterScores && selectedGame.teamA.quarterScores.length > 0 && (
                                <div className="mt-6 mb-4">
                                    <h4 className="text-xl font-semibold text-white mb-2">Puntos por Cuarto:</h4>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full bg-gray-700 rounded-lg overflow-hidden shadow-md text-sm">
                                            <thead className="bg-gray-600 text-gray-200 uppercase text-xs leading-normal font-normal">
                                                <tr>
                                                    <th className="py-3 px-2 text-left">Equipo</th>
                                                    {Array.from({ length: selectedGame.totalQuarters }).map((_, index) => (
                                                        <th key={index} className="py-3 px-2 text-center">C{index + 1}</th>
                                                    ))}
                                                    {selectedGame.overtimePeriodsPlayed > 0 && Array.from({ length: selectedGame.overtimePeriodsPlayed }).map((_, index) => (
                                                        <th key={`ot-${index}`} className="py-3 px-2 text-center">OT{index + 1}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="text-gray-300 text-sm font-normal">
                                                <tr className="border-b border-gray-600 hover:bg-gray-600">
                                                    <td className="py-3 px-2 text-left whitespace-nowrap">{selectedGame.teamA.name}</td>
                                                    {Array.from({ length: selectedGame.totalQuarters + selectedGame.overtimePeriodsPlayed }).map((_, index) => (
                                                        <td key={`teamA-qot-${index}`} className="py-3 px-2 text-center">
                                                            {selectedGame.teamA.quarterScores[index] !== undefined ? selectedGame.teamA.quarterScores[index] : 0}
                                                        </td>
                                                    ))}
                                                </tr>
                                                <tr className="border-b border-gray-600 hover:bg-gray-600">
                                                    <td className="py-3 px-2 text-left whitespace-nowrap">{selectedGame.teamB.name}</td>
                                                    {Array.from({ length: selectedGame.totalQuarters + selectedGame.overtimePeriodsPlayed }).map((_, index) => (
                                                        <td key={`teamB-qot-${index}`} className="py-3 px-2 text-center">
                                                            {selectedGame.teamB.quarterScores[index] !== undefined ? selectedGame.teamB.quarterScores[index] : 0}
                                                        </td>
                                                    ))}
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 gap-6 mb-4">
                                {/* Tabla de Equipo Local */}
                                <div className="overflow-x-auto">
                                    <h4 className="text-xl font-semibold text-blue-400 mb-2">{selectedGame.teamA.name} ({selectedGame.teamA.score}) - Faltas: {selectedGame.teamA.totalFouls}</h4>
                                    <table className="min-w-full bg-gray-700 rounded-lg overflow-hidden shadow-md text-sm">
                                        <thead className="bg-gray-600 text-gray-200 uppercase text-xs leading-normal font-normal">
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
                                        <tbody className="text-gray-300 text-sm font-normal">
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
                                    <h4 className="text-xl font-semibold text-red-400 mb-2">{selectedGame.teamB.name} ({selectedGame.teamB.score}) - Faltas: {selectedGame.teamB.totalFouls}</h4>
                                    <table className="min-w-full bg-gray-700 rounded-lg overflow-hidden shadow-md text-sm">
                                        <thead className="bg-gray-600 text-gray-200 uppercase text-xs leading-normal font-normal">
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
                                        <tbody className="text-gray-300 text-sm font-normal">
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
                            <div className="flex flex-col sm:flex-row justify-between space-y-2 sm:space-y-0 sm:space-x-4 mt-4">
                                <button
                                    onClick={() => setSelectedGame(null)} // Nuevo botón "Volver"
                                    className="bg-gray-700 hover:bg-gray-600 text-white font-normal py-2 px-4 rounded-lg shadow-md transition duration-200 w-full sm:w-auto"
                                >
                                    Volver
                                </button>
                                <button
                                    onClick={() => exportGameToCsv(selectedGame)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-normal py-2 px-4 rounded-lg shadow-md transition duration-200 w-full sm:w-auto"
                                >
                                    Exportar a Excel (CSV)
                                </button>
                                <button
                                    onClick={() => setConfirmDeleteGameId(selectedGame.id)} // Botón de eliminar dentro del modal
                                    className="bg-red-600 hover:bg-red-700 text-white font-normal py-2 px-4 rounded-lg shadow-md transition duration-200 w-full sm:w-auto"
                                >
                                    Eliminar Partido
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                {confirmDeleteGameId && (
                    <ConfirmDialog
                        message={`¿Estás seguro de que quieres eliminar este partido del historial?`}
                        onConfirm={() => handleDeleteGame(confirmDeleteGameId)}
                        onCancel={() => {
                            setConfirmDeleteGameId(null);
                        }}
                    />
                )}
            </div>
        );
    }, [history, setHistory, setAlertMessage]);

    // Renderizado condicional de páginas
    return (
        <div className="bg-gradient-to-br from-gray-900 via-black to-red-900 min-h-screen flex flex-col overflow-x-hidden"> {/* Added overflow-x-hidden here */}
            {/* Main content area, takes available space */}
            <div className="flex-grow">
                {page === 'home' && <HomePage />}
                {page === 'setupGame' && <GameSetupPage />}
                {page === 'game' &&
                    <GamePage
                        timer={timer}
                        setTimer={setTimer}
                        isRunning={isRunning}
                        setIsRunning={setIsRunning}
                        timeUpMessage={timeUpMessage}
                        setTimeUpMessage={setTimeUpMessage}
                        localResetGame={localResetGame}
                        initialGameTime={initialGameTime}
                        teamA={teamA} setTeamA={setTeamA}
                        teamB={teamB} setTeamB={setTeamB}
                        updatePlayerStat={updatePlayerStat}
                        handleTeamUndo={handleTeamUndo}
                        onEndGame={handleEndGame}
                        setShowRosterSelectionModalForTeam={setShowRosterSelectionModalForTeam}
                        setShowPlayerStatsModal={setShowPlayerStatsModal}
                        navigateToPage={navigateToPage}
                        setAlertMessage={setAlertMessage}
                        addPlayersToTeamFromRoster={addPlayersToTeamFromRoster}
                        removePlayer={removePlayer}
                        currentQuarter={currentQuarter}
                        setCurrentQuarter={setCurrentQuarter}
                        totalQuarters={totalQuarters}
                        allRosterPlayers={allRosterPlayers}
                        addPlayerToGlobalRoster={addPlayerToGlobalRoster}
                        updateGlobalPlayer={updateGlobalPlayer}
                        removeGlobalPlayer={removeGlobalPlayer}
                        overtimeDuration={overtimeDuration}
                        currentOvertimePeriod={currentOvertimePeriod}
                        setCurrentOvertimePeriod={setCurrentOvertimePeriod}
                        foulsBeforeBonus={foulsBeforeBonus}
                        initiateSubstitution={initiateSubstitution}
                        confirmSubstitution={confirmSubstitution}
                        playerToSubOut={playerToSubOut}
                        showSubstitutionModal={showSubstitutionModal}
                        shouldOpenInitialRosterSelection={shouldOpenInitialRosterSelection}
                        setShouldOpenInitialRosterSelection={setShouldOpenInitialRosterSelection}
                        isTeamASideLeft={isTeamASideLeft}
                        handleSwapTeamsDisplay={handleSwapTeamsDisplay}
                        allPlayersCurrentlyInGame={allPlayersCurrentlyInGame} // Pass the combined list here
                    />
                }
                {page === 'history' && <HistoryPage />}
                {page === 'roster' && <RosterManagementPage />}
            </div>

            {/* Bottom Navigation Bar */}
            <BottomNavigationBar
                currentPage={page}
                navigateToPage={navigateToPage}
                hasUnfinishedGame={!!unfinishedGame} // Pass boolean if there's an unfinished game
            />

            <AlertDialog message={alertMessage} onClose={() => setAlertMessage('')} />
            {/* Custom styles for text stroke */}
            <style>
                {`
                .text-forasteros-title {
                    color: white; /* Changed to white */
                    -webkit-text-stroke: none; /* Removed stroke for Webkit */
                    text-stroke: none; /* Removed stroke for standard */
                }

                @keyframes fadeInOut {
                    0% { opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { opacity: 0; }
                }

                .animate-fadeInOut {
                    animation: fadeInOut 3s ease-in-out forwards;
                }

                @keyframes fadeIn {
                  from { opacity: 0; transform: scale(0.9); }
                  to { opacity: 1; transform: scale(1); }
                }
                .animate-fade-in {
                  animation: fadeIn 0.2s ease-out forwards;
                }
                `}
            </style>
        </div>
    );
}

export default App;
