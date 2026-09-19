import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const MatchSetup = () => {
    const [selectedSide, setSelectedSide] = useState('white');
    const navigate = useNavigate();

    const handleSideChange = (event) => {
        setSelectedSide(event.target.value);
    };

    const handleSubmit = () => {
        // Here you would typically send the selectedSide to the backend
        // For now, we'll just navigate to the game page
        navigate('/game');
    };

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
            <h1 className="text-3xl font-bold mb-4">Match Setup</h1>
            <p>Set up your match details here.</p>
            <div className="mt-4">
                <label className="mr-2">
                    <input 
                        type="radio" 
                        value="white" 
                        checked={selectedSide === 'white'} 
                        onChange={handleSideChange} 
                    />
                    White
                </label>
                <label className="ml-4">
                    <input 
                        type="radio" 
                        value="black" 
                        checked={selectedSide === 'black'} 
                        onChange={handleSideChange} 
                    />
                    Black
                </label>
            </div>
            <button 
                onClick={handleSubmit} 
                className="mt-6 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
                Start Game
            </button>
        </div>
    );
};

export default MatchSetup;
