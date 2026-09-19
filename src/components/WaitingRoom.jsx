import React from 'react';
import { useLocation } from 'react-router-dom';

const WaitingRoom = () => {
    const location = useLocation();
    const { selectedSide } = location.state || { selectedSide: 'white' };

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
            <h1 className="text-3xl font-bold mb-4">Waiting Room</h1>
            <p className="mb-4">Waiting for your opponent to join...</p>
            <p className="text-lg">You are playing as the {selectedSide} side.</p>
        </div>
    );
};

export default WaitingRoom;
