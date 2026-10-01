import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';

const generateUserId = () => {
    return `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
};

const JoinMatch = () => {
    const navigate = useNavigate();
    const [gameId, setGameId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!gameId.trim()) {
            setError('Game ID is required.');
            return;
        }
        setError('');
        setLoading(true);

        try {
            const userId = localStorage.getItem('chessUserId') || generateUserId();
            const response = await fetch('/api/join-game', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ gameId: gameId.trim(), userId }),
            });
            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                const status = response.status;
                let message = data.detail || data.message || 'Server error. Please try again.';
                if (status === 404) message = 'Game does not exist.';
                if (status === 409) message = 'Game is already full.';
                setError(message);
                setLoading(false);
                return;
            }

            localStorage.setItem('chessUserId', userId);
            navigate('/game', { state: { gameId: gameId.trim() } });
        } catch (err) {
            setError('Network error. Please check your connection and try again.');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-ivory p-6">
            <div className="max-w-md w-full bg-cream border border-wood/20 rounded-2xl shadow-xl p-8">
                <button
                    onClick={() => navigate('/')}
                    className="inline-flex items-center gap-2 text-sm font-medium text-espresso-light hover:text-espresso focus-visible:ring-2 focus-visible:ring-wood rounded px-2 py-1 -ml-2 transition-colors"
                >
                    <ArrowLeft size={18} />
                    Back
                </button>

                <h1 className="text-3xl font-bold text-espresso mt-4 mb-2">Join Match</h1>
                <p className="text-espresso-light mb-6">Enter the Game ID shared by your opponent.</p>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label htmlFor="gameId" className="block text-sm font-semibold text-espresso mb-1.5">
                            Game ID
                        </label>
                        <input
                            id="gameId"
                            type="text"
                            value={gameId}
                            onChange={(e) => setGameId(e.target.value)}
                            placeholder="e.g. 1"
                            className="w-full px-4 py-2.5 rounded-xl border border-wood/30 bg-ivory text-espresso placeholder:text-wood/50 focus-visible:ring-2 focus-visible:ring-wood focus-visible:border-wood outline-none transition"
                        />
                    </div>

                    {error && (
                        <div className="rounded-lg bg-danger/10 text-danger px-4 py-3 text-sm font-medium" role="alert">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold bg-espresso text-ivory hover:bg-espresso-light active:bg-espresso focus-visible:ring-2 focus-visible:ring-espresso focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading && <Loader2 size={20} className="animate-spin" />}
                        {loading ? 'Joining...' : 'Join Match'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default JoinMatch;
