from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, field_validator
from typing import List, Dict
import chess
import random
import string

app = FastAPI()

# In-memory game store. Games do not persist across serverless cold starts;
# this is the closest request-scoped implementation without an external DB.
games: Dict[str, dict] = {}


def _generate_id(length: int = 8) -> str:
    """Generate a short, URL-safe alphanumeric id."""
    return "".join(random.choices(string.ascii_lowercase + string.digits, k=length))


def _board_to_grid(board: chess.Board) -> List[List[str]]:
    """Convert a python-chess board to an 8x8 grid of piece codes.

    Empty squares are "". Pieces are encoded as {color}{type}, e.g. "wP", "bK".
    Rank 8 is at grid index 0 (top of the board), rank 1 at index 7.
    """
    grid: List[List[str]] = []
    for rank in range(8, 0, -1):
        row: List[str] = []
        for file in range(1, 9):
            square = chess.square(file - 1, rank - 1)
            piece = board.piece_at(square)
            if piece is None:
                row.append("")
            else:
                color = "w" if piece.color == chess.WHITE else "b"
                piece_type = piece.symbol().upper()
                row.append(f"{color}{piece_type}")
        grid.append(row)
    return grid


def _update_game_status(game: dict) -> None:
    """Derive status/result from the underlying chess board."""
    board: chess.Board = game["chess_board"]

    if board.is_checkmate():
        winner = "black" if board.turn == chess.WHITE else "white"
        game["status"] = "checkmate"
        game["winner"] = winner
        game["result_reason"] = "checkmate"
    elif board.is_stalemate():
        game["status"] = "stalemate"
        game["result_reason"] = "stalemate"
    elif board.is_insufficient_material():
        game["status"] = "draw"
        game["result_reason"] = "insufficient material"
    elif board.is_check() and game["status"] not in ("checkmate", "stalemate", "draw"):
        game["status"] = "check"
    elif game["status"] not in ("checkmate", "stalemate", "draw", "resigned", "timeout"):
        game["status"] = "ongoing"

    game["board"] = _board_to_grid(board)
    game["current_turn"] = "white" if board.turn == chess.WHITE else "black"


# ---------------------------------------------------------------------------
# Request / response models
# ---------------------------------------------------------------------------

class CreateGameRequest(BaseModel):
    gameName: str = Field(..., min_length=1, max_length=50)
    timeControl: str
    side: str

    @field_validator("side")
    @classmethod
    def _validate_side(cls, value: str) -> str:
        normalized = value.lower()
        if normalized not in ("white", "black"):
            raise ValueError("Side must be White or Black")
        return normalized


class CreateGameResponse(BaseModel):
    gameId: str
    userId: str


class JoinGameRequest(BaseModel):
    gameId: str
    userId: str


class JoinGameResponse(BaseModel):
    message: str


class GameStatusResponse(BaseModel):
    status: str
    board: List[List[str]]
    players: List[str]


class MoveRequest(BaseModel):
    gameId: str
    move: str


class MoveResponse(BaseModel):
    board: List[List[str]]
    message: str


class EndGameResponse(BaseModel):
    result: str
    message: str


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.post("/api/create-game", response_model=CreateGameResponse)
async def create_game(request: CreateGameRequest) -> CreateGameResponse:
    game_id = _generate_id()
    user_id = _generate_id(12)

    board = chess.Board()
    games[game_id] = {
        "gameId": game_id,
        "name": request.gameName,
        "timeControl": request.timeControl,
        "hostSide": request.side,
        "status": "waiting",
        "players": [user_id],
        "user_sides": {user_id: request.side},
        "chess_board": board,
        "board": _board_to_grid(board),
        "current_turn": "white",
        "move_history": [],
        "winner": None,
        "result_reason": None,
    }

    return CreateGameResponse(gameId=game_id, userId=user_id)


@app.post("/api/join-game", response_model=JoinGameResponse)
async def join_game(request: JoinGameRequest) -> JoinGameResponse:
    game = games.get(request.gameId)
    if game is None:
        raise HTTPException(status_code=404, detail="Game not found")

    if len(game["players"]) >= 2:
        raise HTTPException(status_code=400, detail="Game is already full")

    if request.userId in game["players"]:
        raise HTTPException(status_code=400, detail="User already in game")

    opponent_side = "black" if game["hostSide"] == "white" else "white"
    game["players"].append(request.userId)
    game["user_sides"][request.userId] = opponent_side
    game["status"] = "ongoing"

    return JoinGameResponse(message="Game joined successfully")


@app.get("/api/game-status/{gameId}", response_model=GameStatusResponse)
async def game_status(gameId: str) -> GameStatusResponse:
    game = games.get(gameId)
    if game is None:
        raise HTTPException(status_code=404, detail="Game not found")

    _update_game_status(game)

    return GameStatusResponse(
        status=game["status"],
        board=game["board"],
        players=game["players"],
    )


@app.post("/api/move", response_model=MoveResponse)
async def move(request: MoveRequest) -> MoveResponse:
    game = games.get(request.gameId)
    if game is None:
        raise HTTPException(status_code=404, detail="Game not found")

    if game["status"] == "waiting":
        raise HTTPException(status_code=400, detail="Waiting for opponent to join")

    if game["status"] in ("checkmate", "stalemate", "resigned", "draw", "timeout"):
        raise HTTPException(status_code=400, detail="Game is already over")

    board: chess.Board = game["chess_board"]
    move_str = request.move.strip()

    # Accept either SAN (e.g. "e4", "O-O") or UCI (e.g. "e2e4").
    try:
        chess_move = board.parse_san(move_str)
    except ValueError:
        try:
            chess_move = board.parse_uci(move_str)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid move notation")

    if chess_move not in board.legal_moves:
        raise HTTPException(status_code=400, detail="Illegal move")

    san = board.san(chess_move)
    board.push(chess_move)
    game["move_history"].append(san)
    _update_game_status(game)

    return MoveResponse(board=game["board"], message="Move recorded")


@app.get("/api/end-game/{gameId}", response_model=EndGameResponse)
async def end_game(gameId: str) -> EndGameResponse:
    game = games.get(gameId)
    if game is None:
        raise HTTPException(status_code=404, detail="Game not found")

    _update_game_status(game)

    status = game["status"]
    winner = game.get("winner")
    reason = game.get("result_reason") or status

    if status == "checkmate" and winner:
        result = f"{winner} wins"
    elif status in ("stalemate", "draw"):
        result = "draw"
    elif status in ("resigned", "timeout") and winner:
        result = f"{winner} wins"
    else:
        result = "draw"

    return EndGameResponse(result=result, message=f"Game over: {reason}")
