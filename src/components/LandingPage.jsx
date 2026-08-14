import React from 'react';

const LandingPage = () => {
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
            <h1 className="text-5xl font-bold mb-4">Welcome to the Chess Match Website</h1>
            <p className="mb-8 text-xl">Play chess with your friends!</p>
            <a href="/match-setup" className="bg-blue-500 text-white px-4 py-2 rounded">Start a Match</a>
        </div>
    );
};

export default LandingPage;
