import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Users } from 'lucide-react';

const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex items-center justify-center bg-ivory p-6">
            <div className="max-w-lg w-full bg-cream border border-wood/20 rounded-2xl shadow-xl p-10 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-wood text-ivory mb-6">
                    <Crown size={32} aria-hidden="true" />
                </div>
                <h1 className="text-4xl font-extrabold text-espresso mb-3">
                    Royal Chess
                </h1>
                <p className="text-lg text-espresso-light mb-10">
                    Play classic chess with friends, anytime, anywhere.
                </p>

                <div className="flex flex-col gap-4">
                    <button
                        onClick={() => navigate('/setup')}
                        className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold bg-wood text-ivory hover:bg-wood-light active:bg-wood focus-visible:ring-2 focus-visible:ring-wood focus-visible:ring-offset-2 transition-colors"
                    >
                        <Crown size={20} />
                        Start a Match
                    </button>
                    <button
                        onClick={() => navigate('/join')}
                        className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold bg-espresso text-ivory hover:bg-espresso-light active:bg-espresso focus-visible:ring-2 focus-visible:ring-espresso focus-visible:ring-offset-2 transition-colors"
                    >
                        <Users size={20} />
                        Join a Match
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LandingPage;
