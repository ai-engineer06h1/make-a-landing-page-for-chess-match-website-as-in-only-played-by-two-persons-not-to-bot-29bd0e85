import React, { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Crown, Loader2, RotateCcw, Swords } from 'lucide-react';

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

const initialBoard = () => [
    ['bR', 'bN', 'bB', 'bQ', 'bK', 'bB', 'bN', 'bR'],
    ['bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP'],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    ['wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP'],
    ['wR', 'wN', 'wB', 'wQ', 'wK', 'wB', 'wN', 'wR'],
];

const pieceName = (code) => {
    if (!code) return null;
    const side = code[0] === 'w' ? 'White' : 'Black';
    const map = { K: 'King', Q: 'Queen', R: 'Rook', B: 'Bishop', N: 'Knight', P: 'Pawn' };
    return `${side} ${map[code[1]]}`;
};

const inBounds = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8;

const isOpponent = (piece, side) => piece && piece[0] !== side[0];

// Lightweight legal-move helper used for UI highlighting only.
// The server is the authoritative judge of legality.
const getLegalMoves = (board, fromRow, fromCol) => {
    const piece = board[fromRow][fromCol];
    if (!piece) return [];
    const side = piece[0];
    const type = piece[1];
    const moves = [];

    const add = (r, c) => {
        if (!inBounds(r, c)) return false;
        const target = board[r][c];
        if (!target) moves.push({ row: r, col: c });
        if (target && isOpponent(target, side)) moves.push({ row: r, col: c });
        return !target;
    };

    const slide = (dr, dc) => {
        for (let i = 1; i < 8; i++) {
            const r = fromRow + dr * i;
            const c = fromCol + dc * i;
            if (!inBounds(r, c)) break;
            const target = board[r][c];
            if (!target) moves.push({ row: r, col: c });
            else {
                if (isOpponent(target, side)) moves.push({ row: r, col: c });
                break;
            }
        }
    };

    switch (type) {
        case 'P': {
            const dir = side === 'w' ? -1 : 1;
            const startRank = side === 'w' ? 6 : 1;
            if (inBounds(fromRow + dir, fromCol) && !board[fromRow + dir][fromCol]) {
                moves.push({ row: fromRow + dir, col: fromCol });
                if (fromRow === startRank && !board[fromRow + dir * 2][fromCol]) {
                    moves.push({ row: fromRow + dir * 2, col: fromCol });
                }
            }
            [-1, 1].forEach((dc) => {
                const r = fromRow + dir;
                const c = fromCol + dc;
                if (inBounds(r, c) && isOpponent(board[r][c], side)) moves.push({ row: r, col: c });
            });
            break;
        }
        case 'N': {
            const jumps = [
                [2, 1], [2, -1], [-2, 1], [-2, -1], [1, 2], [1, -2], [-1, 2], [-1, -2],
            ];
            jumps.forEach(([dr, dc]) => add(fromRow + dr, fromCol + dc));
            break;
        }
        case 'B':
            [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([dr, dc]) => slide(dr, dc));
            break;
        case 'R':
            [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([dr, dc]) => slide(dr, dc));
            break;
        case 'Q':
            [[-1, -1], [-1, 1], [1, -1], [1, 1], [-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([dr, dc]) => slide(dr, dc));
            break;
        case 'K': {
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    if (dr === 0 && dc === 0) continue;
                    add(fromRow + dr, fromCol + dc);
                }
            }
            break;
        }
        default:
            break;
    }

    return moves;
};

const moveNotation = (from, to, piece) => {
    const pieceChar = piece[1] === 'P' ? '' : piece[1];
    return `${pieceChar}${FILES[from.col]}${RANKS[from.row]}->${FILES[to.col]}${RANKS[to.row]}`;
};

const InGameBoard = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { gameId, selectedSide } = location.state || {};

    const [board, setBoard] = useState(initialBoard());
    const [turn, setTurn] = useState('white');
    const [mySide, setMySide] = useState(selectedSide || 'white');
    const [status, setStatus] = useState('ongoing');
    const [players, setPlayers] = useState([]);
    const [selectedSquare, setSelectedSquare] = useState(null);
    const [legalMoves, setLegalMoves] = useState([]);
    const [moveHistory, setMoveHistory] = useState([]);
    const [capturedByWhite, setCapturedByWhite] = useState([]);
    const [capturedByBlack, setCapturedByBlack] = useState([]);
    const [loading, setLoading] = useState(true);
    const [movePending, setMovePending] = useState(false);
    const [error, setError] = useState('');

    const fetchStatus = useCallback(async () => {
        if (!gameId) return;
        try {
            const response = await fetch(`/api/game-status/${encodeURIComponent(gameId)}`);
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                setError(data.detail || data.message || 'Game not found.');
                return;
            }

            setStatus(data.status || 'ongoing');
            setPlayers(Array.isArray(data.players) ? data.players : []);
            if (Array.isArray(data.board) && data.board.length === 8) {
                setBoard(data.board.map((row) => (Array.isArray(row) ? row : [])));
            }

            if (data.status === 'checkmate' || data.status === 'stalemate' || data.status === 'resigned' || data.status === 'draw') {
                navigate('/gameover', { state: { gameId, selectedSide: mySide } });
            }
        } catch (err) {
            setError('Network error while retrieving match status.');
        } finally {
            setLoading(false);
        }
    }, [gameId, mySide, navigate]);

    useEffect(() => {
        if (!gameId) {
            navigate('/', { replace: true });
            return;
        }
        fetchStatus();
        const interval = setInterval(fetchStatus, 2000);
        return () => clearInterval(interval);
    }, [gameId, fetchStatus, navigate]);

    useEffect(() => {
        if (selectedSquare) {
            setLegalMoves(getLegalMoves(board, selectedSquare.row, selectedSquare.col));
        } else {
            setLegalMoves([]);
        }
    }, [selectedSquare, board]);

    const handleSquareClick = async (row, col) => {
        if (status !== 'ongoing' || movePending) return;
        if (turn !== mySide) {
            setError("It's not your turn.");
            setSelectedSquare(null);
            return;
        }

        const piece = board[row][col];

        // Select own piece
        if (piece && piece[0] === mySide[0]) {
            setSelectedSquare({ row, col });
            setError('');
            return;
        }

        // Move selected piece to target
        if (selectedSquare) {
            const isLegal = legalMoves.some((m) => m.row === row && m.col === col);
            if (!isLegal) {
                setError('Invalid move.');
                return;
            }

            const movingPiece = board[selectedSquare.row][selectedSquare.col];
            const captured = board[row][col];
            const notation = moveNotation(selectedSquare, { row, col }, movingPiece);

            setMovePending(true);
            setError('');

            try {
                const response = await fetch('/api/move', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ gameId, move: notation }),
                });
                const data = await response.json().catch(() => ({}));

                if (!response.ok) {
                    setError(data.detail || data.message || 'Server failed to record the move.');
                    setMovePending(false);
                    return;
                }

                if (Array.isArray(data.board) && data.board.length === 8) {
                    setBoard(data.board.map((r) => (Array.isArray(r) ? r : [])));
                } else {
                    // Optimistic update if server returns unchanged board
                    const nextBoard = board.map((r) => [...r]);
                    nextBoard[row][col] = movingPiece;
                    nextBoard[selectedSquare.row][selectedSquare.col] = null;
                    setBoard(nextBoard);
                }

                if (captured) {
                    if (mySide === 'white') setCapturedByWhite((prev) => [...prev, captured]);
                    else setCapturedByBlack((prev) => [...prev, captured]);
                }

                setMoveHistory((prev) => [...prev, notation]);
                setTurn((prev) => (prev === 'white' ? 'black' : 'white'));
            } catch (err) {
                setError('Network error. Move could not be sent.');
            } finally {
                setMovePending(false);
                setSelectedSquare(null);
            }
        }
    };

    const handleResign = async () => {
        if (!window.confirm('Are you sure you want to resign?')) return;
        try {
            const response = await fetch('/api/move', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ gameId, move: 'resign' }),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                setError(data.detail || data.message || 'Failed to resign.');
                return;
            }
            navigate('/gameover', { state: { gameId, selectedSide: mySide } });
        } catch (err) {
            setError('Network error while resigning.');
        }
    };

    const handleOfferDraw = async () => {
        if (!window.confirm('Offer a draw?')) return;
        try {
            const response = await fetch('/api/move', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ gameId, move: 'draw' }),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                setError(data.detail || data.message || 'Failed to offer draw.');
                return;
            }
            if (data.message?.toLowerCase().includes('draw')) {
                navigate('/gameover', { state: { gameId, selectedSide: mySide } });
            }
        } catch (err) {
            setError('Network error while offering draw.');
        }
    };

    const handleLeave = () => {
        if (window.confirm('Leave the match and return home?')) {
            navigate('/', { replace: true });
        }
    };

    const renderPiece = (code) => {
        if (!code) return null;
        const color = code[0] === 'w' ? '#f8f6ef' : '#3e2723';
        const stroke = code[0] === 'w' ? '#3e2723' : '#f8f6ef';
        const type = code[1];
        const size = "100%";
        const common = { width: size, height: size, viewBox: "0 0 45 45", fill: color, stroke, strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round" };

        switch (type) {
            case 'P':
                return (
                    <svg {...common}>
                        <path d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z" />
                    </svg>
                );
            case 'R':
                return (
                    <svg {...common}>
                        <path d="M9 39h27v-3H9v3zM12 36v-4h21v4H12zM11 14V9h4v2h5V9h5v2h5V9h4v5" strokeLinecap="butt" />
                        <path d="M34 14l-3 3H14l-3-3" />
                        <path d="M31 17v12.5H14V17" strokeLinecap="butt" strokeLinejoin="miter" />
                        <path d="M31 29.5l1.5 2.5h-20l1.5-2.5" />
                    </svg>
                );
            case 'N':
                return (
                    <svg {...common}>
                        <path d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21" />
                        <path d="M24 18c.38 2.91-5.55 7.37-8 9-3 2-2.82 4.34-5 4-1.042-.94 1.41-3.04 0-3-1 0 .19 1.23-1 2-1 0-4.003 1-4-4 0-2 6-12 6-12s1.89-1.9 2-3.5c-.73-.994-.5-2-.5-3 1-1 3 2.5 3 2.5h2s.78-1.992 2.5-3 1.5 0 1.5 0c-.5 1.5 0 2.5 0 2.5-1.49 1.65-2.5 4.5-2.5 4.5z" fill={color} />
                        <path d="M9.5 25.5A.5.5 0 1 1 9 26a.5.5 0 0 1 .5-.5z" fill={stroke} stroke="none" />
                    </svg>
                );
            case 'B':
                return (
                    <svg {...common}>
                        <path d="M9 36c3.39-.97 10.11.43 13.5-2 3.5 2.5 9.51 1 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.43-13.5 2-3.5-2.5-9.51-1-13.5-2 0 0-1.65-.54-3-2 .68-.97 1.65-.99 3-.5zM15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z" fill={color} />
                        <path d="M25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 1 1 5 0z" fill={stroke} stroke="none" />
                    </svg>
                );
            case 'Q':
                return (
                    <svg {...common}>
                        <path d="M9 26c8.5-1.5 21-1.5 27 0l2-12-7 11V11l-5.5 13.5-3-15-3 15-5.5-13.5V25l-7-11 2 12z" strokeLinecap="butt" />
                        <path d="M9 26c0 2 1.5 2 2.5 4 1 2.5 1 1 .5 3.5-1.5 1-1 2.5-1 2.5-1.5 1.5 0 2.5 0 2.5h27c0 0 1.5-1 0-2.5 0 0 .5-1.5-1-2.5-.5-2.5-.5-1 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0z" strokeLinecap="butt" />
                        <path d="M11.5 30c7.5-1 17.5-1 22 0m-24.5 4.5c7.5-1 20.5-1 27 0" fill="none" />
                    </svg>
                );
            case 'K':
                return (
                    <svg {...common}>
                        <path d="M22.5 11.63V6M20 8h5" strokeLinejoin="miter" />
                        <path d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5" fill={color} strokeLinecap="butt" strokeLinejoin="miter" />
                        <path d="M11.5 37c5.5 3.5 15.5 3.5 21 0v-7s9-4.5 6-10.5c-4-1-5 5-8 3.5C25.5 31 25.5 22 22.5 22.5c-3 0-3 8.5-8 11.5-3 1.5-4-4.5-8-3.5-3 6 6 10.5 6 10.5v7z" fill={color} />
                        <path d="M11.5 30c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0" fill="none" />
                    </svg>
                );
            default:
                return null;
        }
    };

    const isLegalTarget = (row, col) => legalMoves.some((m) => m.row === row && m.col === col);

    const statusText = {
        ongoing: 'Game in progress',
        check: 'Check!',
        checkmate: 'Checkmate',
        stalemate: 'Stalemate',
        resigned: 'Resigned',
        draw: 'Draw',
    }[status] || status;

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-ivory">
                <div className="text-center">
                    <Loader2 size={40} className="animate-spin mx-auto text-wood mb-4" />
                    <p className="text-espresso font-medium">Loading match...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-ivory p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
                <header className="flex flex-wrap items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/')}
                            className="inline-flex items-center gap-1 text-sm font-medium text-espresso-light hover:text-espresso focus-visible:ring-2 focus-visible:ring-wood rounded px-2 py-1 transition-colors"
                        >
                            <ArrowLeft size={18} /> Home
                        </button>
                        <div className="h-6 w-px bg-wood/20" />
                        <div className="flex items-center gap-2">
                            <Crown size={22} className="text-gold" />
                            <span className="font-bold text-espresso">Royal Chess</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-medium">
                        <span className="text-espresso-light">Game:</span>
                        <span className="font-mono text-espresso">{gameId || '—'}</span>
                    </div>
                </header>

                {error && (
                    <div className="mb-4 rounded-lg bg-danger/10 text-danger px-4 py-3 text-sm font-medium flex items-center gap-2" role="alert">
                        <Swords size={18} /> {error}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_20rem] gap-6">
                    <div className="space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cream border border-wood/20 text-sm">
                                <span className="text-espresso-light">Turn:</span>
                                <span className={`font-semibold capitalize ${turn === mySide ? 'text-success' : 'text-espresso'}`}>{turn}</span>
                            </div>
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cream border border-wood/20 text-sm">
                                <span className="text-espresso-light">You:</span>
                                <span className="font-semibold text-espresso capitalize">{mySide}</span>
                            </div>
                        </div>

                        <div className={`rounded-xl px-4 py-3 text-center font-semibold text-sm ${
                            status === 'check' ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'
                        }`}>
                            {statusText}
                        </div>

                        <div className="relative bg-board-dark p-1 rounded-xl shadow-lg inline-block">
                            <div className="grid grid-cols-8">
                                {RANKS.map((rank, rowIndex) =>
                                    FILES.map((file, colIndex) => {
                                        const isLight = (rowIndex + colIndex) % 2 === 0;
                                        const piece = board[rowIndex][colIndex];
                                        const isSelected = selectedSquare?.row === rowIndex && selectedSquare?.col === colIndex;
                                        const isLegal = isLegalTarget(rowIndex, colIndex);

                                        return (
                                            <button
                                                key={`${rank}-${file}`}
                                                onClick={() => handleSquareClick(rowIndex, colIndex)}
                                                className={`relative w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 flex items-center justify-center transition ${
                                                    isLight ? 'bg-board-light' : 'bg-board-dark'
                                                } ${isSelected ? 'ring-4 ring-gold ring-inset' : ''} ${
                                                    isLegal ? 'after:absolute after:inset-0 after:bg-gold/30' : ''
                                                }`}
                                                aria-label={`${file}${rank} ${pieceName(piece) || 'empty'}`}
                                            >
                                                <span className="absolute top-0.5 left-1 text-[10px] font-semibold text-espresso/40">
                                                    {colIndex === 0 ? rank : ''}
                                                </span>
                                                <span className="absolute bottom-0.5 right-1 text-[10px] font-semibold text-espresso/40">
                                                    {rowIndex === 7 ? file : ''}
                                                </span>
                                                <span className="w-4/5 h-4/5 pointer-events-none">{renderPiece(piece)}</span>
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {movePending && (
                            <div className="flex items-center gap-2 text-sm text-espresso-light">
                                <Loader2 size={16} className="animate-spin" /> Sending move...
                            </div>
                        )}
                    </div>

                    <aside className="space-y-4">
                        <div className="bg-cream border border-wood/20 rounded-2xl p-4">
                            <h2 className="font-bold text-espresso mb-3">Match actions</h2>
                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={handleResign}
                                    className="w-full px-4 py-2.5 rounded-xl font-semibold bg-danger text-white hover:bg-red-700 active:bg-danger focus-visible:ring-2 focus-visible:ring-danger focus-visible:ring-offset-2 transition-colors"
                                >
                                    Resign
                                </button>
                                <button
                                    onClick={handleOfferDraw}
                                    className="w-full px-4 py-2.5 rounded-xl font-semibold bg-espresso text-ivory hover:bg-espresso-light active:bg-espresso focus-visible:ring-2 focus-visible:ring-espresso focus-visible:ring-offset-2 transition-colors"
                                >
                                    Offer draw
                                </button>
                                <button
                                    onClick={handleLeave}
                                    className="w-full px-4 py-2.5 rounded-xl font-semibold bg-wood/10 text-wood hover:bg-wood/20 focus-visible:ring-2 focus-visible:ring-wood transition-colors"
                                >
                                    Leave match
                                </button>
                            </div>
                        </div>

                        <div className="bg-cream border border-wood/20 rounded-2xl p-4">
                            <h2 className="font-bold text-espresso mb-3">Captured pieces</h2>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <span className="text-xs font-semibold uppercase text-espresso-light">White captured</span>
                                    <div className="mt-1 flex flex-wrap gap-1">
                                        {capturedByWhite.length === 0 && <span className="text-sm text-espresso-light">None</span>}
                                        {capturedByWhite.map((p, i) => (
                                            <span key={i} className="w-6 h-6">{renderPiece(p)}</span>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <span className="text-xs font-semibold uppercase text-espresso-light">Black captured</span>
                                    <div className="mt-1 flex flex-wrap gap-1">
                                        {capturedByBlack.length === 0 && <span className="text-sm text-espresso-light">None</span>}
                                        {capturedByBlack.map((p, i) => (
                                            <span key={i} className="w-6 h-6">{renderPiece(p)}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-cream border border-wood/20 rounded-2xl p-4">
                            <h2 className="font-bold text-espresso mb-3 flex items-center gap-2">
                                <RotateCcw size={18} /> Move history
                            </h2>
                            <div className="max-h-64 overflow-y-auto pr-1">
                                {moveHistory.length === 0 && <p className="text-sm text-espresso-light">No moves yet.</p>}
                                <ol className="space-y-1 text-sm text-espresso">
                                    {moveHistory.map((move, i) => (
                                        <li key={i} className="flex gap-2">
                                            <span className="text-espresso-light w-8">{i + 1}.</span>
                                            <span className="font-medium">{move}</span>
                                        </li>
                                    ))}
                                </ol>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
};

export default InGameBoard;
