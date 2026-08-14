import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import MatchSetup from './components/MatchSetup';
import WaitingRoom from './components/WaitingRoom';
import InGameBoard from './components/InGameBoard';
import GameOver from './components/GameOver';

const App = () => {
    return (
        <Routes>
            <Route path='/' element={<LandingPage />} />
            <Route path='/match-setup' element={<MatchSetup />} />
            <Route path='/waiting-room' element={<WaitingRoom />} />
            <Route path='/in-game' element={<InGameBoard />} />
            <Route path='/game-over' element={<GameOver />} />
        </Routes>
    )
};

export default App;