import React from 'react';

const WaitingRoom = () => {
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
            <h1 className="text-3xl font-bold mb-4">Waiting Room</h1>
            <p>Waiting for your opponent to join...</p>
        </div>
    );
};

export default WaitingRoom;
