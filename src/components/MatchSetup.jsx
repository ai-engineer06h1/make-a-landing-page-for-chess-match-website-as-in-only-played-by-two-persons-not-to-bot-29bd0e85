import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';

const TIME_CONTROLS = [
    { value: '10min', label: '10 minutes' },
    { value: '15min', label: '15 minutes' },
    { value: '30min', label: '30 minutes' },
    { value: '1hour', label: '1 hour' },
    { value: 'unlimited', label: 'Unlimited' },
];

const MatchSetup = () => {
    const navigate = useNavigate();
    const [gameName, setGameName] = useState('');
    const [timeControl, setTimeControl] = useState('15min');
    const [side, setSide] = useState('white');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const validate = () => {
        if (!gameName.trim()) return 'Please enter a game name.';
        if (gameName.trim().length < 1 || gameName.trim().length > 50) {
            return 'Game name must be between 1 and 50 characters.';
        }
        if (!['white', 'black'].includes(side)) return 'Please select White or Black.';
        return '';
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const validationError = validate();
        if (validationError) {
            setError(validationError);
            return;
        }
        setError('');
        setLoading(true);

        try {
            const response = await fetch('/api/create-game', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    gameName: gameName.trim(),
                    timeControl,
                    side,
                }),
            });
            const data = await response.json().catch(() => ({}));

            if (!response.ok || !data.gameId || !data.userId) {
                setError(data.detail || data.message || 'Server failed to create the game. Please try again.');
                setLoading(false);
                return;
            }

            localStorage.setItem('chessUserId', data.userId);
            navigate('/waiting', { state: { gameId: data.gameId, selectedSide: side } });
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

                <h1 className="text-3xl font-bold text-espresso mt-4 mb-2">Match Setup</h1>
                <p className="text-espresso-light mb-6">Configure your match and challenge an opponent.</p>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label htmlFor="gameName" className="block text-sm font-semibold text-espresso mb-1.5">
                            Game name
                        </label>
                        <input
                            id="gameName"
                            type="text"
                            value={gameName}
                            onChange={(e) => setGameName(e.target.value)}
                            placeholder="e.g. Knight's Gambit"
                            maxLength={50}
                            className="w-full px-4 py-2.5 rounded-xl border border-wood/30 bg-ivory text-espresso placeholder:text-wood/50 focus-visible:ring-2 focus-visible:ring-wood focus-visible:border-wood outline-none transition"
                        />
                        <p className="text-xs text-espresso-light mt-1.5">{gameName.length}/50 characters</p>
                    </div>

                    <div>
                        <label htmlFor="timeControl" className="block text-sm font-semibold text-espresso mb-1.5">
                            Time control
                        </label>
                        <select
                            id="timeControl"
                            value={timeControl}
                            onChange={(e) => setTimeControl(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-wood/30 bg-ivory text-espresso focus-visible:ring-2 focus-visible:ring-wood focus-visible:border-wood outline-none transition"
                        >
                            {TIME_CONTROLS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <span className="block text-sm font-semibold text-espresso mb-2">Your side</span>
                        <div className="grid grid-cols-2 gap-3">
                            {['white', 'black'].map((value) => (
                                <label
                                    key={value}
                                    className={`cursor-pointer flex items-center justify-center gap-2 px-4 py-3 rounded-xl border font-medium transition ${
                                        side === value
                                            ? 'bg-wood text-ivory border-wood'
                                            : 'bg-ivory text-espresso border-wood/30 hover:border-wood'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="side"
                                        value={value}
                                        checked={side === value}
                                        onChange={(e) => setSide(e.target.value)}
                                        className="sr-only"
                                    />
                                    {value === 'white' ? 'White' : 'Black'}
                                </label>
                            ))}
                        </div>
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
                        {loading ? 'Creating match...' : 'Create Match'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default MatchSetup;
