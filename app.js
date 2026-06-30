const pieceValues = {
    p: 100,
    n: 320,
    b: 330,
    r: 500,
    q: 900,
    k: 20000
};

// ==========================
// SEARCH CONFIG
// (difficulty से बदलता है, इसलिए let)
// ==========================

let SEARCH_TIME_MS = 1500;
const MAX_SEARCH_DEPTH = 64;

const TT_EXACT = 0;
const TT_LOWER = 1;
const TT_UPPER = 2;

const transpositionTable = new Map();

const killerMoves = [];
for (let i = 0; i < MAX_SEARCH_DEPTH + 1; i++) {
    killerMoves.push([null, null]);
}

let searchStartTime = 0;
let searchTimedOut = false;

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
// APP STATE
// ==========================

let gameMode = null;       // '1v1' | 'ai'
let difficulty = null;     // 'easy' | 'medium' | 'hard'
let pendingPromotion = null; // { from, to }
let aiThinking = false;

const config = {
    draggable: false,
    position: 'start',
    pieceTheme:
        'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png'
};

// ==========================
// MENU LOGIC
// ==========================

$(function () {

    $('.menu-btn[data-mode]').on('click', function () {

        gameMode = $(this).attr('data-mode');

        if (gameMode === '1v1') {
            difficulty = null;
            showStartStep();
        }
        else {
            $('#modeStep').addClass('hidden');
            $('#difficultyStep').removeClass('hidden');
        }
    });

    $('.menu-btn[data-difficulty]').on('click', function () {

        difficulty = $(this).attr('data-difficulty');
        showStartStep();
    });

    $('#backToModeBtn, #backToModeBtn2').on('click', function () {

        $('#difficultyStep').addClass('hidden');
        $('#startStep').addClass('hidden');
        $('#modeStep').removeClass('hidden');
    });

    $('#startGameBtn').on('click', function () {
        startGame();
    });

    $('#undoBtn').on('click', undoMove);
    $('#newGameBtn').on('click', backToMenu);
    $('#exitBtn').on('click', backToMenu);
    $('#newGameModalBtn').on('click', function () {
        $('#gameOverModal').addClass('hidden');
        backToMenu();
    });
    $('#exitModalBtn').on('click', function () {
        $('#gameOverModal').addClass('hidden');
        backToMenu();
    });

    $('#toggleHistoryBtn').on('click', function () {

        $('#historyPanel').toggleClass('hidden');

        let isHidden = $('#historyPanel').hasClass('hidden');
        $(this).text(isHidden ? 'Show History' : 'Hide History');
    });

    $('.promo-btn').on('click', function () {

        let piece = $(this).attr('data-piece');
        completePromotion(piece);
    });
});

function showStartStep() {

    $('#modeStep').addClass('hidden');
    $('#difficultyStep').addClass('hidden');
    $('#startStep').removeClass('hidden');

    let summary = (gameMode === '1v1')
        ? '1 vs 1 — local two player'
        : 'vs AI — Difficulty: ' + capitalize(difficulty);

    $('#selectionSummary').text(summary);
}

function capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

function difficultyToTime(d) {

    if (d === 'easy') return 400;
    if (d === 'medium') return 1500;
    return 3500; // hard
}

function startGame() {

    if (gameMode === 'ai') {
        SEARCH_TIME_MS = difficultyToTime(difficulty);
    }

    game = new Chess();
    selectedSquare = null;
    transpositionTable.clear();

    $('#menuScreen').addClass('hidden');
    $('#gameScreen').removeClass('hidden');

    $('#modeInfo').text(
        gameMode === '1v1'
            ? 'Mode: 1 vs 1'
            : 'Mode: vs AI (' + capitalize(difficulty) + ')'
    );
    updateTurnInfo();

    $('#historyPanel').addClass('hidden');
    $('#toggleHistoryBtn').text('Show History');

    if (board === null) {
        board = Chessboard('myBoard', config);
    }
    else {
        board.position('start');
    }

    updateMoveHistory();
    removeHighlights();
}

function backToMenu() {

    $('#gameScreen').addClass('hidden');
    $('#gameOverModal').addClass('hidden');
    $('#promotionModal').addClass('hidden');

    $('#startStep').addClass('hidden');
    $('#difficultyStep').addClass('hidden');
    $('#modeStep').removeClass('hidden');

    $('#menuScreen').removeClass('hidden');
}

function updateTurnInfo() {

    if (game.game_over()) return;

    let turnText = (game.turn() === 'w') ? 'White' : 'Black';
    $('#turnInfo').text('Turn: ' + turnText);
}

// ==========================
// UNDO
// ==========================

function undoMove() {

    if (aiThinking) return;

    selectedSquare = null;
    removeHighlights();
    $('#gameOverModal').addClass('hidden');

    if (gameMode === 'ai') {
        // खिलाड़ी की चाल और उससे पहले की AI चाल दोनों undo करो
        game.undo();
        game.undo();
    }
    else {
        game.undo();
    }

    board.position(game.fen());
    updateMoveHistory();
    updateTurnInfo();
    highlightCheck();
}

// ==========================
// CLICK / TAP TO MOVE
// ==========================

let touchHandled = false;

$('#myBoard').on('touchend', '.square-55d63', function (e) {

    e.preventDefault();
    touchHandled = true;

    handleSquareClick($(this).attr('data-square'));

    setTimeout(function () {
        touchHandled = false;
    }, 400);
});

$('#myBoard').on('click', '.square-55d63', function (e) {

    if (touchHandled) {
        return;
    }

    handleSquareClick($(this).attr('data-square'));
});

function handleSquareClick(square) {

    if (aiThinking || game.game_over()) {
        return;
    }

    let piece = game.get(square);

    if (!selectedSquare) {

        if (piece && piece.color === game.turn()) {
            selectedSquare = square;
            highlightSquare(square);
            showLegalMoves(square);
        }
        return;
    }

    if (selectedSquare === square) {
        selectedSquare = null;
        removeHighlights();
        return;
    }

    // promotion check: अगर ये move pawn को आख़िरी rank पर ले जाता है
    let legalMoves = game.moves({ square: selectedSquare, verbose: true });
    let needsPromotion = legalMoves.some(m => m.to === square && m.promotion);

    if (needsPromotion) {

        let isLegalTarget = legalMoves.some(m => m.to === square);

        if (!isLegalTarget) {
            // invalid target, शायद apna दूसरा piece click किया
            if (piece && piece.color === game.turn()) {
                selectedSquare = square;
                removeHighlights();
                highlightSquare(square);
                showLegalMoves(square);
            }
            else {
                selectedSquare = null;
                removeHighlights();
            }
            return;
        }

        pendingPromotion = { from: selectedSquare, to: square };
        $('#promotionModal').removeClass('hidden');
        return;
    }

    let move = game.move({
        from: selectedSquare,
        to: square,
        promotion: 'q'
    });

    selectedSquare = null;
    removeHighlights();

    if (move === null) {

        if (piece && piece.color === game.turn()) {
            selectedSquare = square;
            highlightSquare(square);
            showLegalMoves(square);
        }
        return;
    }

    finishMove();
}

function completePromotion(pieceChar) {

    $('#promotionModal').addClass('hidden');

    if (!pendingPromotion) return;

    let move = game.move({
        from: pendingPromotion.from,
        to: pendingPromotion.to,
        promotion: pieceChar
    });

    pendingPromotion = null;
    selectedSquare = null;
    removeHighlights();

    if (move === null) return;

    finishMove();
}

function finishMove() {

    board.position(game.fen());
    updateMoveHistory();
    updateTurnInfo();
    highlightCheck();

    if (checkGameOver()) {
        return;
    }

    if (gameMode === 'ai') {
        setTimeout(makeBestMove, 250);
    }
}

function checkGameOver() {

    if (game.in_checkmate()) {

        highlightCheckmate();

        let winner = (game.turn() === 'w') ? 'Black' : 'White';

        showGameOverModal('Checkmate!', winner + ' wins the game.');
        return true;
    }

    if (game.in_draw() || game.in_stalemate() || game.in_threefold_repetition()) {

        showGameOverModal('Draw!', 'The game ended in a draw.');
        return true;
    }

    return false;
}

function showGameOverModal(title, message) {

    $('#gameOverTitle').text(title);
    $('#gameOverMsg').text(message);
    $('#gameOverModal').removeClass('hidden');
}

function highlightCheck() {

    removeHighlights();

    if (!game.in_check()) return;

    let boardArray = game.board();

    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {

            let piece = boardArray[r][c];

            if (piece && piece.type === 'k' && piece.color === game.turn()) {

                let square = "abcdefgh"[c] + (8 - r);

                $('#myBoard .square-' + square).addClass('highlight-check');
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

            if (piece && piece.type === 'k' && piece.color === game.turn()) {

                let square = "abcdefgh"[c] + (8 - r);

                $('#myBoard .square-' + square).addClass('highlight-checkmate');
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

    let moves = game.moves({ square: square, verbose: true });

    if (moves.length === 0) return;

    highlightSquare(square);

    for (let move of moves) {

        let squareEl = $('#myBoard .square-' + move.to);

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
                material += pieceValues[piece.type];
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

            if (piece && piece.type === 'p' && piece.color !== color) {
                return false;
            }

            r += direction;
        }
    }

    return true;
}

function evaluateBoard() {

    if (game.in_checkmate()) {
        return (game.turn() === 'w') ? -999999 : 999999;
    }

    if (game.in_draw() || game.in_stalemate() || game.in_threefold_repetition()) {
        return 0;
    }

    let boardArray = game.board();

    let score = 0;
    const endgame = isEndgame();
    let whiteBishops = 0;
    let blackBishops = 0;
    let whitePawnFiles = new Array(8).fill(0);
    let blackPawnFiles = new Array(8).fill(0);
    let whitePawnCols = [];
    let blackPawnCols = [];

    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {

            let piece = boardArray[row][col];

            if (piece === null) continue;

            if (piece.type === 'b') {
                if (piece.color === 'w') whiteBishops++;
                else blackBishops++;
            }

            let value = pieceValues[piece.type];

            if (piece.type === 'n') {
                value += (piece.color === 'w')
                    ? knightTable[row][col]
                    : knightTable[7 - row][col];
            }

            if (piece.type === 'p') {

                if (piece.color === 'w') {
                    whitePawnFiles[col]++;
                    whitePawnCols.push(col);
                }
                else {
                    blackPawnFiles[col]++;
                    blackPawnCols.push(col);
                }

                value += (piece.color === 'w')
                    ? pawnTable[row][col]
                    : pawnTable[7 - row][col];

                if (isPassedPawn(boardArray, row, col, piece.color)) {
                    value += (piece.color === 'w')
                        ? (6 - row) * 20
                        : (row - 1) * 20;
                }
            }

            if (piece.type === 'b') {
                value += (piece.color === 'w')
                    ? bishopTable[row][col]
                    : bishopTable[7 - row][col];
            }

            if (piece.type === 'k') {

                if (endgame) {
                    value += (piece.color === 'w')
                        ? kingEndgameTable[row][col]
                        : kingEndgameTable[7 - row][col];
                }
                else {
                    value += (piece.color === 'w')
                        ? kingOpeningTable[row][col]
                        : kingOpeningTable[7 - row][col];
                }
            }

            if (piece.type === 'r') {

                value += (piece.color === 'w')
                    ? rookTable[row][col]
                    : rookTable[7 - row][col];

                let noWhitePawns = whitePawnFiles[col] === 0;
                let noBlackPawns = blackPawnFiles[col] === 0;

                if (noWhitePawns && noBlackPawns) {
                    value += 20;
                }
                else if (piece.color === 'w' && noWhitePawns && !noBlackPawns) {
                    value += 10;
                }
                else if (piece.color === 'b' && noBlackPawns && !noWhitePawns) {
                    value += 10;
                }
            }

            if (piece.type === 'q') {
                value += (piece.color === 'w')
                    ? queenTable[row][col]
                    : queenTable[7 - row][col];
            }

            score += (piece.color === 'w') ? value : -value;
        }
    }

    for (let file = 0; file < 8; file++) {

        if (whitePawnFiles[file] > 1) {
            score -= (whitePawnFiles[file] - 1) * 20;
        }

        if (blackPawnFiles[file] > 1) {
            score += (blackPawnFiles[file] - 1) * 20;
        }
    }

    for (let file of whitePawnCols) {

        let left = (file > 0) ? whitePawnFiles[file - 1] : 0;
        let right = (file < 7) ? whitePawnFiles[file + 1] : 0;

        if (left === 0 && right === 0) {
            score -= 15;
        }
    }

    for (let file of blackPawnCols) {

        let left = (file > 0) ? blackPawnFiles[file - 1] : 0;
        let right = (file < 7) ? blackPawnFiles[file + 1] : 0;

        if (left === 0 && right === 0) {
            score += 15;
        }
    }

    if (whiteBishops >= 2) score += 30;
    if (blackBishops >= 2) score -= 30;

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
// MOVE ORDERING
// ==========================

function moveScore(move, ttMove, depth) {

    if (ttMove &&
        move.from === ttMove.from &&
        move.to === ttMove.to &&
        move.promotion === ttMove.promotion) {
        return 1000000;
    }

    if (move.captured) {
        return 100000 +
            (pieceValues[move.captured] * 10 - pieceValues[move.piece]);
    }

    if (move.promotion) {
        return 90000;
    }

    let km = killerMoves[depth];

    if (km) {
        if (km[0] && move.from === km[0].from && move.to === km[0].to) {
            return 80000;
        }
        if (km[1] && move.from === km[1].from && move.to === km[1].to) {
            return 79000;
        }
    }

    return 0;
}

function orderMoves(moves, ttMove, depth) {

    return moves
        .map(m => ({ move: m, s: moveScore(m, ttMove, depth) }))
        .sort((a, b) => b.s - a.s)
        .map(x => x.move);
}

function recordKiller(move, depth) {

    if (move.captured) return;

    let km = killerMoves[depth];

    if (!km[0] || (km[0].from !== move.from || km[0].to !== move.to)) {
        km[1] = km[0];
        km[0] = move;
    }
}

// ==========================
// QUIESCENCE SEARCH
// ==========================

function quiescence(alpha, beta, isMaximizing) {

    if (searchTimedOut) return evaluateBoard();

    let standPat = evaluateBoard();

    if (isMaximizing) {
        if (standPat >= beta) return beta;
        if (standPat > alpha) alpha = standPat;
    }
    else {
        if (standPat <= alpha) return alpha;
        if (standPat < beta) beta = standPat;
    }

    let moves = game.moves({ verbose: true })
        .filter(m => m.captured || m.flags.indexOf('e') !== -1);

    moves = orderMoves(moves, null, 0);

    for (let move of moves) {

        if ((performance.now() - searchStartTime) > SEARCH_TIME_MS) {
            searchTimedOut = true;
            break;
        }

        game.move(move);
        let score = quiescence(alpha, beta, !isMaximizing);
        game.undo();

        if (isMaximizing) {
            if (score > alpha) alpha = score;
            if (alpha >= beta) return beta;
        }
        else {
            if (score < beta) beta = score;
            if (beta <= alpha) return alpha;
        }
    }

    return isMaximizing ? alpha : beta;
}

// ==========================
// ALPHA BETA PRUNING
// ==========================

function alphaBeta(depth, alpha, beta, isMaximizing) {

    if (searchTimedOut) return evaluateBoard();

    if ((performance.now() - searchStartTime) > SEARCH_TIME_MS) {
        searchTimedOut = true;
        return evaluateBoard();
    }

    let key = game.fen();
    let ttEntry = transpositionTable.get(key);
    let ttMove = ttEntry ? ttEntry.bestMove : null;

    if (ttEntry && ttEntry.depth >= depth) {

        if (ttEntry.flag === TT_EXACT) return ttEntry.score;
        if (ttEntry.flag === TT_LOWER && ttEntry.score > alpha) alpha = ttEntry.score;
        if (ttEntry.flag === TT_UPPER && ttEntry.score < beta) beta = ttEntry.score;

        if (alpha >= beta) return ttEntry.score;
    }

    if (depth === 0) {
        return quiescence(alpha, beta, isMaximizing);
    }

    if (game.game_over()) {
        return evaluateBoard();
    }

    let moves = game.moves({ verbose: true });
    moves = orderMoves(moves, ttMove, depth);

    let bestScore = isMaximizing ? -Infinity : Infinity;
    let bestMoveHere = null;
    const alphaOrig = alpha;
    const betaOrig = beta;

    for (let move of moves) {

        game.move(move);

        let score = alphaBeta(depth - 1, alpha, beta, !isMaximizing);

        game.undo();

        if (isMaximizing) {

            if (score > bestScore) {
                bestScore = score;
                bestMoveHere = move;
            }

            alpha = Math.max(alpha, bestScore);
        }
        else {

            if (score < bestScore) {
                bestScore = score;
                bestMoveHere = move;
            }

            beta = Math.min(beta, bestScore);
        }

        if (beta <= alpha) {
            recordKiller(move, depth);
            break;
        }

        if (searchTimedOut) break;
    }

    let flag = TT_EXACT;

    if (bestScore <= alphaOrig) flag = TT_UPPER;
    else if (bestScore >= betaOrig) flag = TT_LOWER;

    transpositionTable.set(key, {
        score: bestScore,
        depth: depth,
        flag: flag,
        bestMove: bestMoveHere
    });

    return bestScore;
}

// ==========================
// BEST MOVE SEARCH
// ==========================

function getBestMove() {

    transpositionTable.clear();

    searchStartTime = performance.now();
    searchTimedOut = false;

    let aiIsMaximizing = (game.turn() === 'w');

    let moves = game.moves({ verbose: true });

    if (moves.length === 0) return null;

    let bestMove = moves[0];
    let bestScore = aiIsMaximizing ? -Infinity : Infinity;

    for (let depth = 1; depth <= MAX_SEARCH_DEPTH; depth++) {

        if ((performance.now() - searchStartTime) > SEARCH_TIME_MS) {
            break;
        }

        let ttRoot = transpositionTable.get(game.fen());
        let orderedMoves = orderMoves(moves, ttRoot ? ttRoot.bestMove : null, depth);

        let currentBestMove = null;
        let currentBestScore = aiIsMaximizing ? -Infinity : Infinity;
        let depthTimedOut = false;

        for (let move of orderedMoves) {

            if ((performance.now() - searchStartTime) > SEARCH_TIME_MS) {
                depthTimedOut = true;
                break;
            }

            game.move(move);

            let score = alphaBeta(
                depth - 1,
                -Infinity,
                Infinity,
                !aiIsMaximizing
            );

            game.undo();

            if (aiIsMaximizing) {
                if (score > currentBestScore) {
                    currentBestScore = score;
                    currentBestMove = move;
                }
            }
            else {
                if (score < currentBestScore) {
                    currentBestScore = score;
                    currentBestMove = move;
                }
            }
        }

        if (!depthTimedOut && currentBestMove) {
            bestMove = currentBestMove;
            bestScore = currentBestScore;
        }

        if (searchTimedOut || depthTimedOut) {
            break;
        }

        if (Math.abs(bestScore) > 900000) {
            break;
        }
    }

    return bestMove;
}

// ==========================
// AI MOVE
// ==========================

function makeBestMove() {

    aiThinking = true;

    let bestMove = getBestMove();

    aiThinking = false;

    if (bestMove == null) {
        return;
    }

    game.move(bestMove);

    board.position(game.fen());

    updateMoveHistory();
    updateTurnInfo();
    highlightCheck();

    checkGameOver();
}