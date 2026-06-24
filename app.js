// ==========================
// OLD MINIMAX (REFERENCE)
// ==========================

// function minimax(depth, isMaximizing) {

//     if (depth === 0) {
//         return evaluateBoard();
//     }

//     let moves = game.moves();

//     if (isMaximizing) {

//         let bestScore = -Infinity;

//         for (let move of moves) {

//             game.move(move);

//             let score = minimax(depth - 1, false);

//             game.undo();

//             bestScore = Math.max(bestScore, score);
//         }

//         return bestScore;
//     }
//     else {

//         let bestScore = Infinity;

//         for (let move of moves) {

//             game.move(move);

//             let score = minimax(depth - 1, true);

//             game.undo();

//             bestScore = Math.min(bestScore, score);
//         }

//         return bestScore;
//     }
// }

const transpositionTable = new Map();

const knightTable = [
    [-50, -40, -30, -30, -30, -30, -40, -50],
    [-40, -20, 0, 0, 0, 0, -20, -40],
    [-30, 0, 10, 15, 15, 10, 0, -30],
    [-30, 5, 15, 20, 20, 15, 5, -30],
    [-30, 0, 15, 20, 20, 15, 0, -30],
    [-30, 5, 10, 15, 15, 10, 5, -30],
    [-40, -20, 0, 5, 5, 0, -20, -40],
    [-50, -40, -30, -30, -30, -30, -40, -50]
];

const pawnTable = [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [50, 50, 50, 50, 50, 50, 50, 50],
    [10, 10, 20, 30, 30, 20, 10, 10],
    [5, 5, 10, 25, 25, 10, 5, 5],
    [0, 0, 0, 20, 20, 0, 0, 0],
    [5, -5, -10, 0, 0, -10, -5, 5],
    [5, 10, 10, -20, -20, 10, 10, 5],
    [0, 0, 0, 0, 0, 0, 0, 0]
];

const bishopTable = [
    [-20, -10, -10, -10, -10, -10, -10, -20],
    [-10, 5, 0, 0, 0, 0, 5, -10],
    [-10, 10, 10, 10, 10, 10, 10, -10],
    [-10, 0, 10, 10, 10, 10, 0, -10],
    [-10, 5, 5, 10, 10, 5, 5, -10],
    [-10, 0, 5, 10, 10, 5, 0, -10],
    [-10, 0, 0, 0, 0, 0, 0, -10],
    [-20, -10, -10, -10, -10, -10, -10, -20]
];


const rookTable = [
    [0, 0, 5, 10, 10, 5, 0, 0],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [5, 10, 10, 10, 10, 10, 10, 5],
    [0, 0, 5, 10, 10, 5, 0, 0]
];

var game = new Chess();
var board = null;

var config = {
    draggable: true,
    position: 'start',

    pieceTheme:
        'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png',

    onDrop: onDrop,
    onSnapEnd: onSnapEnd
};

board = Chessboard('myBoard', config);

function onDrop(source, target) {

    var move = game.move({
        from: source,
        to: target,
        promotion: 'q'
    });

    if (move === null) {
        return 'snapback';
    }
    updateMoveHistory();

    if (game.in_checkmate()) {
        alert("Checkmate!");
        return;
    }

    if (game.in_draw()) {
        alert("Draw!");
        return;
    }
    setTimeout(makeBestMove, 250);
}

function onSnapEnd() {
    board.position(game.fen());
}

// ==========================
// EVALUATION FUNCTION
// ==========================

function evaluateBoard() {

    if (game.in_checkmate()) {

        if (game.turn() === 'w') {
            return -999999;
        }
        else {
            return 999999;
        }
    }

    let boardArray = game.board();

    let pieceValues = {
        p: 100,
        n: 320,
        b: 330,
        r: 500,
        q: 900,
        k: 20000
    };

    let score = 0;

    for (let row = 0; row < 8; row++) {

        for (let col = 0; col < 8; col++) {

            let piece = boardArray[row][col];

            if (piece !== null) {

                let value = pieceValues[piece.type];

                // Knight Piece-Square Table
                if (piece.type === 'n') {

                    if (piece.color === 'w') {
                        value += knightTable[row][col];
                    }
                    else {
                        value += knightTable[7 - row][col];
                    }
                }

                // Pawn PST
                if (piece.type === 'p') {

                    if (piece.color === 'w') {
                        value += pawnTable[row][col];
                    }
                    else {
                        value += pawnTable[7 - row][col];
                    }
                }

                if (piece.type === 'b') {

                    if (piece.color === 'w') {
                        value += bishopTable[row][col];
                    }
                    else {
                        value += bishopTable[7 - row][col];
                    }
                }

                // King Safety

                if (piece.type === 'k') {

                    if (piece.color === 'w') {

                        if (row > 1 && col > 1 && col < 6) {
                            value += 30;
                        }

                    } else {

                        if (row < 6 && col > 1 && col < 6) {
                            value += 30;
                        }
                    }
                }
                //rook
                if (piece.type === 'r') {

                    if (piece.color === 'w') {
                        value += rookTable[row][col];
                    }
                    else {
                        value += rookTable[7 - row][col];
                    }
                }

                // Add/Subtract score
                if (piece.color === 'w') {
                    score += value;
                }
                else {
                    score -= value;
                }
            }
        }
    }
    // let mobility = game.moves().length;

    // if (game.turn() === 'w') {
    //     score += mobility;
    // }
    // else {
    //     score -= mobility;
    // }
    return score;
}


function updateMoveHistory() {

    let historyDiv = document.getElementById("moveHistory");

    if (!historyDiv) return;

    let history = game.history();

    let html = `
        <table class="history-table">
            <tr>
                <th>#</th>
                <th>White</th>
                <th>Black</th>
            </tr>
    `;

    for (let i = 0; i < history.length; i += 2) {

        let moveNumber = Math.floor(i / 2) + 1;

        html += `
            <tr>
                <td>${moveNumber}</td>
                <td>${history[i] || ""}</td>
                <td>${history[i + 1] || ""}</td>
            </tr>
        `;
    }

    html += `</table>`;

    historyDiv.innerHTML = html;
}
// ==========================
// ALPHA BETA PRUNING
// ==========================

function alphaBeta(depth, alpha, beta, isMaximizing) {
    let key = game.fen() + "_" + depth;

    if (transpositionTable.has(key)) {
        return transpositionTable.get(key);
    }

    if (depth === 0) {
        return evaluateBoard();
    }



    let moves = game.moves({ verbose: true });

    moves.sort((a, b) => {

        let scoreA = a.captured ? 1 : 0;
        let scoreB = b.captured ? 1 : 0;

        return scoreB - scoreA;
    });
    if (isMaximizing) {

        let bestScore = -Infinity;

        for (let move of moves) {

            game.move(move);

            let score =
                alphaBeta(depth - 1, alpha, beta, false);

            game.undo();

            bestScore = Math.max(bestScore, score);

            alpha = Math.max(alpha, bestScore);

            if (beta <= alpha) {
                break;
            }
        }

        transpositionTable.set(key, bestScore);
        return bestScore;
    }
    else {

        let bestScore = Infinity;

        for (let move of moves) {

            game.move(move);

            let score =
                alphaBeta(depth - 1, alpha, beta, true);

            game.undo();

            bestScore = Math.min(bestScore, score);

            beta = Math.min(beta, bestScore);

            if (beta <= alpha) {
                break;
            }
        }

        transpositionTable.set(key, bestScore);
        return bestScore;
    }
}

// ==========================
// BEST MOVE SEARCH
// ==========================

function getBestMove() {

    transpositionTable.clear();

    //let moves = game.moves();
    let moves = game.moves({ verbose: true });

    let bestMove = null;
    let bestScore = Infinity;

    for (let move of moves) {

        game.move(move);

        let score = alphaBeta(
            3,
            -Infinity,
            Infinity,
            true
        );

        game.undo();

        if (score < bestScore) {

            bestScore = score;
            bestMove = move;
        }
    }

    return bestMove;
}

// ==========================
// AI MOVE
// ==========================

function makeBestMove() {

    let bestMove = getBestMove();

    if (bestMove == null) {
        return;
    }

    game.move(bestMove);

    board.position(game.fen());

    updateMoveHistory();

    if (game.in_checkmate()) {
        alert("Checkmate!");
        return;
    }

    if (game.in_draw()) {
        alert("Draw!");
        return;
    }
}