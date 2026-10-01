import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Crown, Home, Loader2, RotateCcw, Trophy } from 'lucide-react';

const GameOver = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { gameId, selectedSide } = location.state || {};

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [result, setResult] = useState('draw');
    const [message, setMessage] = useState('The match has ended.');

    useEffect(() => {
        const fetchResult = async () => {
            if (!gameId) {
                setError('Game result could not be loaded.');
                setLoading(false);
                return;
            }
            try {
                const response = await fetch(`/api/end-game/${encodeURIComponent(gameId)}`);
                const data = await response.json().catch(() => ({}));
                if (!response.ok) {
                    setError(data.detail || data.message || 'Game result could not be loaded.');
                    setLoading(false);
                    return;
                }
                setResult(data.result || 'draw');
                setMessage(data.message || 'The match has ended.');
            } catch (err) {
                setError('Network error while retrieving the final result.');
            } finally {
                setLoading(false);
            }
        };
        fetchResult();
    }, [gameId]);

    const headline = {
        white: 'White wins!',
        black: 'Black wins!',
        draw: "It's a draw!",
    }[result] || result;

    const won = (result === 'white' && selectedSide === 'white') || (result === 'black' && selectedSide === 'black');

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-ivory">
                <div className="text-center">
                    <Loader2 size={40} className="animate-spin mx-auto text-wood mb-4" />
                    <p className="text-espresso font-medium">Loading result...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-ivory p-6">
            <div className="max-w-md w-full bg-cream border border-wood/20 rounded-2xl shadow-xl p-10 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gold/20 text-gold mb-6">
                    {result === 'draw' ? <RotateCcw size={36} /> : <Trophy size={36} />}
                </div>

                <h1 className="text-4xl font-extrabold text-espresso mb-2">{headline}</h1>
                <p className="text-lg text-espresso-light mb-6">{message}</p>

                <div className="rounded-xl bg-ivory border border-wood/20 p-5 mb-6 text-left space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-espresso-light">Game ID</span>
                        <span className="font-mono font-semibold text-espresso">{gameId || '—'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-espresso-light">Your side</span>
                        <span className="font-semibold text-espresso capitalize">{selectedSide || 'white'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-espresso-light">Outcome for you</span>
                        <span className={`font-semibold ${won ? 'text-success' : result === 'draw' ? 'text-gold' : 'text-danger'}`}>
                            {won ? 'Victory' : result === 'draw' ? 'Draw' : 'Defeat'}
                        </span>
                    </div>
                </div>

                {error && (
                    <div className="rounded-lg bg-danger/10 text-danger px-4 py-3 text-sm font-medium mb-6" role="alert">
                        {error}
                    </div>
                )}

                <div className="flex flex-col gap-3">
                    <button
                        onClick={() => navigate('/setup')}
                        className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold bg-wood text-ivory hover:bg-wood-light active:bg-wood focus-visible:ring-2 focus-visible:ring-wood focus-visible:ring-offset-2 transition-colors"
                    >
                        <Crown size={20} />
                        Play Again
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold bg-espresso text-ivory hover:bg-espresso-light active:bg-espresso focus-visible:ring-2 focus-visible:ring-espresso focus-visible:ring-offset-2 transition-colors"
                    >
                        <Home size={20} />
                        Return Home
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GameOver;
