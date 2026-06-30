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

const queenTable = [
    [-20, -10, -10, -5, -5, -10, -10, -20],
    [-10, 0, 0, 0, 0, 0, 0, -10],
    [-10, 0, 5, 5, 5, 5, 0, -10],
    [-5, 0, 5, 5, 5, 5, 0, -5],
    [0, 0, 5, 5, 5, 5, 0, -5],
    [-10, 5, 5, 5, 5, 5, 0, -10],
    [-10, 0, 5, 0, 0, 0, 0, -10],
    [-20, -10, -10, -5, -5, -10, -10, -20]
];

const kingOpeningTable = [
    [20, 30, 10, 0, 0, 10, 30, 20],
    [20, 20, 10, 0, 0, 10, 20, 20],
    [0, 0, 0, -10, -10, 0, 0, 0],
    [-10, -20, -20, -30, -30, -20, -20, -10],
    [-20, -30, -30, -40, -40, -30, -30, -20],
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-30, -40, -40, -50, -50, -40, -40, -30]
];

const kingEndgameTable = [
    [-50, -40, -30, -20, -20, -30, -40, -50],
    [-30, -20, -10, 0, 0, -10, -20, -30],
    [-30, -10, 20, 30, 30, 20, -10, -30],
    [-30, -10, 30, 40, 40, 30, -10, -30],
    [-30, -10, 30, 40, 40, 30, -10, -30],
    [-30, -10, 20, 30, 30, 20, -10, -30],
    [-30, -30, 0, 0, 0, 0, -30, -30],
    [-50, -30, -30, -30, -30, -30, -30, -50]
];

var game = new Chess();
var board = null;
var selectedSquare = null;

// ==========================
// BOARD CONFIG (drag removed,
// pure click / tap based movement)
// ==========================

var config = {
    draggable: false,
    position: 'start',

    pieceTheme:
        'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png'
};

board = Chessboard('myBoard', config);

// ==========================
// CLICK / TAP TO MOVE
// ==========================

$('#myBoard').on('click touchend', '.square-55d63', function (e) {

    e.preventDefault();

    handleSquareClick($(this).attr('data-square'));
});

function handleSquareClick(square) {

    // AI की turn में या game खत्म होने पर click ignore करो
    if (game.game_over()) {
        return;
    }

    let piece = game.get(square);

    // Case 1: कोई square पहले से selected नहीं है
    if (!selectedSquare) {

        if (piece && piece.color === game.turn()) {
            selectedSquare = square;
            highlightSquare(square);
            showLegalMoves(square);
        }
        return;
    }

    // Case 2: same square दोबारा click -> deselect
    if (selectedSquare === square) {
        selectedSquare = null;
        removeHighlights();
        return;
    }

    // Case 3: move करने की कोशिश करो
    let move = game.move({
        from: selectedSquare,
        to: square,
        promotion: 'q'
    });

    selectedSquare = null;
    removeHighlights();

    if (move === null) {

        // Invalid move था, लेकिन apna hi dusra piece click kiya -> select it
        if (piece && piece.color === game.turn()) {
            selectedSquare = square;
            highlightSquare(square);
            showLegalMoves(square);
        }
        return;
    }

    board.position(game.fen());
    updateMoveHistory();
    highlightCheck();

    if (game.in_checkmate()) {
        highlightCheckmate();
        alert("Checkmate!");
        return;
    }

    if (game.in_draw()) {
        alert("Draw!");
        return;
    }

    setTimeout(makeBestMove, 250);
}

function highlightCheck() {

    removeHighlights();

    if (!game.in_check()) return;

    let boardArray = game.board();

    for (let r = 0; r < 8; r++) {

        for (let c = 0; c < 8; c++) {

            let piece = boardArray[r][c];

            if (
                piece &&
                piece.type === 'k' &&
                piece.color === game.turn()
            ) {

                let square =
                    "abcdefgh"[c] + (8 - r);

                $('#myBoard .square-' + square)
                    .addClass('highlight-check');

                return;
            }
        }
    }
}

function highlightCheckmate() {

    removeHighlights();

    let boardArray = game.board();

    for (let r = 0; r < 8; r++) {

        for (let c = 0; c < 8; c++) {

            let piece = boardArray[r][c];

            if (
                piece &&
                piece.type === 'k' &&
                piece.color === game.turn()
            ) {

                let square =
                    "abcdefgh"[c] + (8 - r);

                $('#myBoard .square-' + square)
                    .addClass('highlight-checkmate');

                return;
            }
        }
    }
}

function removeHighlights() {

    $('#myBoard .square-55d63').removeClass(
        'highlight-white highlight-black highlight-move highlight-capture highlight-check highlight-checkmate'
    );
}

function highlightSquare(square) {

    let squareEl = $('#myBoard .square-' + square);

    if (squareEl.hasClass('black-3c85d')) {
        squareEl.addClass('highlight-black');
    }
    else {
        squareEl.addClass('highlight-white');
    }
}

function showLegalMoves(square) {

    let moves = game.moves({
        square: square,
        verbose: true
    });

    if (moves.length === 0)
        return;

    highlightSquare(square);

    for (let move of moves) {

        let squareEl = $('#myBoard .square-' + move.to);

        // अगर इस square पर move करने से कोई piece कट रहा है
        // (en passant भी capture गिना जाएगा)
        if (move.captured || move.flags.indexOf('e') !== -1) {
            squareEl.addClass('highlight-capture');
        }
        else {
            squareEl.addClass('highlight-move');
        }
    }
}

// ==========================
// EVALUATION FUNCTION
// ==========================

function isEndgame() {

    let material = 0;

    let boardArray = game.board();

    for (let row = 0; row < 8; row++) {

        for (let col = 0; col < 8; col++) {

            let piece = boardArray[row][col];

            if (piece && piece.type !== 'k') {

                switch (piece.type) {

                    case 'q':
                        material += 900;
                        break;

                    case 'r':
                        material += 500;
                        break;

                    case 'b':
                        material += 330;
                        break;

                    case 'n':
                        material += 320;
                        break;

                    case 'p':
                        material += 100;
                        break;
                }
            }
        }
    }

    return material <= 2600;
}

function isPassedPawn(boardArray, row, col, color) {

    let direction = (color === 'w') ? -1 : 1;

    for (let c = col - 1; c <= col + 1; c++) {

        if (c < 0 || c > 7) continue;

        let r = row + direction;

        while (r >= 0 && r < 8) {

            let piece = boardArray[r][c];

            if (
                piece &&
                piece.type === 'p' &&
                piece.color !== color
            ) {
                return false;
            }

            r += direction;
        }
    }

    return true;
}


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
    const endgame = isEndgame();
    let whiteBishops = 0;
    let blackBishops = 0;

    for (let row = 0; row < 8; row++) {

        for (let col = 0; col < 8; col++) {

            let piece = boardArray[row][col];

            if (piece !== null) {

                if (piece.type === 'b') {

                    if (piece.color === 'w') {
                        whiteBishops++;
                    }
                    else {
                        blackBishops++;
                    }
                }

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


                // Passed Pawn Bonus

                if (piece.type === 'p') {

                    if (isPassedPawn(boardArray, row, col, piece.color)) {

                        if (piece.color === 'w') {

                            value += (6 - row) * 20;

                        } else {

                            value += (row - 1) * 20;
                        }
                    }
                }


                // King PST

                if (piece.type === 'k') {

                    if (endgame) {

                        if (piece.color === 'w') {
                            value += kingEndgameTable[row][col];
                        }
                        else {
                            value += kingEndgameTable[7 - row][col];
                        }

                    } else {

                        if (piece.color === 'w') {
                            value += kingOpeningTable[row][col];
                        }
                        else {
                            value += kingOpeningTable[7 - row][col];
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

                // Queen PST
                if (piece.type === 'q') {

                    if (piece.color === 'w') {
                        value += queenTable[row][col];
                    }
                    else {
                        value += queenTable[7 - row][col];
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


    // Bishop Pair Bonus

    if (whiteBishops >= 2) {
        score += 30;
    }

    if (blackBishops >= 2) {
        score -= 30;
    }
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
            2,
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
    highlightCheck();


    if (game.in_checkmate()) {
        highlightCheckmate();
        alert("Checkmate!");
        return;
    }

    if (game.in_draw()) {
        alert("Draw!");
        return;
    }


}
