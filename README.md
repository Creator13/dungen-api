# Dungen-api

## Routes

### Authentication
- `POST /login/player`: authentication route for players. Required fields: `email` and `password` (in plain text). Returns user info in the shape of:
    ```
    {
        id: number,
        nickname: string,
        email: string,
        isUser: true
    }
    ```
- `POST /login/server`: authentication route for game servers. Required fields: `game-session` (retrieved via the `start-game-session` route) and `password` (in plain text).
- `GET /login/start-game-session`: provides a new game server authentication token.
- `GET /login/logout`: Logs out either the server or the player that's logged in on the session cookie.

### API
- `GET /api/highscore-list?count={count}`: returns a list of all highscores recorded in the database sorted from highest to lowest, and by date. Optional query parameter `count` limits the number of scores included. Shape: 
    ```
    [
        {
            nickname: string,
            score: number,
            time: number
        },
        ...
    ]
    ```
- `GET /api/stats`: Returns statistic about the scores. Shape:
    ```
    {
        top_score: {
            nickname: string,
            user_id: number,
            score: number,
            time: number
        },
        total_scores: number,
        monthly_top: {
            nicname: string,
            user_id: number,
            score: number,
            time: number
        }
        monthly_plays: number
    }
    ```
- `POST /api/new-user`: Creates a new user. Required fields: `email`, `name`, and `password` (plain text). The provided email address must be unique within the database. Returns `HTTP 201` on success. Returns `HTTP 400` on failure with a body in the shape of: 
    ```
    {
        error: string
    }
    ```
- `POST /api/add-highscore`: Creates a new highscore entry. Required fields: `user_id` a uid that exists in the database, and `score`. **Game server authentication required**.