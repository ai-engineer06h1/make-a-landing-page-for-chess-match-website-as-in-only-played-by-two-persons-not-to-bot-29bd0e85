import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict

app = FastAPI()

# In-memory data structure for games (use a database in production)
games = {}  # gameId -> game data

class CreateGameRequest(BaseModel):
    gameName: str
    timeControl: str

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

@app.post('/api/create-game', response_model=CreateGameResponse)
async def create_game(request: CreateGameRequest):
    game_id = str(len(games) + 1)  # Just an example id generation
    user_id = str(len(games) + 1)  # Each user gets a unique id
    games[game_id] = {"name": request.gameName, "timeControl": request.timeControl, "status": "waiting", "board": [[]], "players": [user_id]}
    return CreateGameResponse(gameId=game_id, userId=user_id)

@app.post('/api/join-game', response_model=JoinGameResponse)
async def join_game(request: JoinGameRequest):
    if request.gameId not in games:
        raise HTTPException(status_code=404, detail="Game not found")
    games[request.gameId]['players'].append(request.userId)
    games[request.gameId]['status'] = "ongoing"
    return JoinGameResponse(message="Game joined successfully")

@app.get('/api/game-status/{gameId}', response_model=GameStatusResponse)
async def game_status(gameId: str):
    if gameId not in games:
        raise HTTPException(status_code=404, detail="Game not found")
    game = games[gameId]
    return GameStatusResponse(status=game['status'], board=game['board'], players=game['players'])

@app.post('/api/move', response_model=MoveResponse)
async def move(request: MoveRequest):
    if request.gameId not in games:
        raise HTTPException(status_code=404, detail="Game not found")
    # Logic for move would be added here
    return MoveResponse(board=games[request.gameId]['board'], message="Move recorded")

@app.get('/api/end-game/{gameId}', response_model=EndGameResponse)
async def end_game(gameId: str):
    if gameId not in games:
        raise HTTPException(status_code=404, detail="Game not found")
    result = "draw"  # Add real logic here.
    del games[gameId]
    return EndGameResponse(result=result, message="Game over")
