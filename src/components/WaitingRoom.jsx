import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Copy, Loader2, XCircle } from 'lucide-react';

const POLL_INTERVAL_MS = 2000;

const WaitingRoom = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { gameId, selectedSide } = location.state || {};

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [playerCount, setPlayerCount] = useState(1);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!gameId) {
            navigate('/setup', { replace: true });
            return;
        }

        const poll = async () => {
            try {
                const response = await fetch(`/api/game-status/${encodeURIComponent(gameId)}`);
                const data = await response.json().catch(() => ({}));

                if (!response.ok) {
                    setError(data.detail || data.message || 'Game no longer exists or network error.');
                    return;
                }

                const players = Array.isArray(data.players) ? data.players : [];
                setPlayerCount(players.length);

                if (data.status === 'ongoing' || players.length >= 2) {
                    navigate('/game', { state: { gameId, selectedSide }, replace: true });
                } else {
                    setError('');
                }
            } catch (err) {
                setError('Network error while checking match status.');
            } finally {
                setLoading(false);
            }
        };

        setLoading(true);
        poll();

        const interval = setInterval(poll, POLL_INTERVAL_MS);
        return () => clearInterval(interval);
    }, [gameId, selectedSide, navigate]);

    const handleCopy = async () => {
        if (!gameId) return;
        try {
            await navigator.clipboard.writeText(gameId);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback: do nothing visually if clipboard fails
        }
    };

    const handleCancel = () => {
        // The backend does not provide a cancel endpoint, so we simply return home.
        navigate('/', { replace: true });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-ivory p-6">
            <div className="max-w-md w-full bg-cream border border-wood/20 rounded-2xl shadow-xl p-8 text-center">
                <button
                    onClick={() => navigate('/')}
                    className="inline-flex items-center gap-2 text-sm font-medium text-espresso-light hover:text-espresso focus-visible:ring-2 focus-visible:ring-wood rounded px-2 py-1 -ml-2 transition-colors"
                >
                    <ArrowLeft size={18} />
                    Home
                </button>

                <div className="mt-4 mb-6">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-wood/10 text-wood mb-4">
                        {loading ? <Loader2 size={28} className="animate-spin" /> : <CheckCircle2 size={28} />}
                    </div>
                    <h1 className="text-3xl font-bold text-espresso mb-2">Match created!</h1>
                    <p className="text-espresso-light">
                        Waiting for your opponent to join...
                    </p>
                </div>

                <div className="rounded-xl bg-ivory border border-wood/20 p-5 mb-5 text-left">
                    <div className="mb-4">
                        <span className="block text-xs font-semibold uppercase tracking-wide text-espresso-light mb-1">Game ID</span>
                        <div className="flex items-center gap-2">
                            <span className="text-2xl font-mono font-bold text-espresso" aria-live="polite">
                                {gameId || '—'}
                            </span>
                            <button
                                onClick={handleCopy}
                                disabled={!gameId}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-wood/10 text-wood hover:bg-wood/20 focus-visible:ring-2 focus-visible:ring-wood disabled:opacity-50 transition-colors"
                            >
                                {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                                {copied ? 'Copied' : 'Copy'}
                            </button>
                        </div>
                        <p className="text-xs text-espresso-light mt-1">Share this ID with your opponent.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <span className="block text-xs font-semibold uppercase tracking-wide text-espresso-light mb-1">Your side</span>
                            <span className="font-medium text-espresso capitalize">{selectedSide || 'white'}</span>
                        </div>
                        <div>
                            <span className="block text-xs font-semibold uppercase tracking-wide text-espresso-light mb-1">Status</span>
                            <span className="font-medium text-espresso">{playerCount}/2 players</span>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="rounded-lg bg-danger/10 text-danger px-4 py-3 text-sm font-medium mb-5 flex items-center gap-2" role="alert">
                        <XCircle size={18} />
                        {error}
                    </div>
                )}

                <button
                    onClick={handleCancel}
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold bg-espresso text-ivory hover:bg-espresso-light active:bg-espresso focus-visible:ring-2 focus-visible:ring-espresso focus-visible:ring-offset-2 transition-colors"
                >
                    Cancel match
                </button>
            </div>
        </div>
    );
};

export default WaitingRoom;
