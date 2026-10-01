import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import MatchSetup from './components/MatchSetup';
import JoinMatch from './components/JoinMatch';
import InGameBoard from './components/InGameBoard';
import WaitingRoom from './components/WaitingRoom';
import GameOver from './components/GameOver';

const App = () => {
    return (
        <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/setup" element={<MatchSetup />} />
            <Route path="/join" element={<JoinMatch />} />
            <Route path="/game" element={<InGameBoard />} />
            <Route path="/waiting" element={<WaitingRoom />} />
            <Route path="/gameover" element={<GameOver />} />
        </Routes>
    );
};

export default App;
