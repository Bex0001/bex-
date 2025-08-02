// Initialize game state
const game = new Chess();
let board;
let engine;
let engineReady = false;
let currentDepth = 15;

// DOM Elements
const evaluationBar = document.getElementById('evaluationBar');
const evaluationText = document.getElementById('evaluationText');
const adviceElement = document.getElementById('advice');
const moveHistoryElement = document.getElementById('moveHistory');
const newGameBtn = document.getElementById('newGameBtn');
const hintBtn = document.getElementById('hintBtn');
const analyzeBtn = document.getElementById('analyzeBtn');
const analysisList = document.getElementById('analysisList');

// Arabic piece names
const pieceNames = {
    'p': 'بيدق',
    'n': 'حصان',
    'b': 'فيل',
    'r': 'قلعة',
    'q': 'وزير',
    'k': 'ملك',
    'P': 'بيدق',
    'N': 'حصان',
    'B': 'فيل',
    'R': 'قلعة',
    'Q': 'وزير',
    'K': 'ملك'
};

// Initialize the chessboard
function initBoard() {
    const config = {
        draggable: true,
        position: 'start',
        onDragStart: onDragStart,
        onDrop: onDrop,
        onSnapEnd: onSnapEnd,
        pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png',
        orientation: 'black', // Black at bottom for Arabic interface
        showNotation: true
    };
    
    board = Chessboard('board', config);
}

// Initialize Stockfish engine
function initEngine() {
    engine = new Worker('{{ url_for("static", filename="js/stockfish.js") }}');
    
    engine.onmessage = function(event) {
        const message = event.data || event;
        
        if (message === 'uciok') {
            engineReady = true;
            console.log('Engine ready');
            engine.postMessage('setoption name Skill Level value 20');
            engine.postMessage('ucinewgame');
        } 
        else if (message.startsWith('bestmove')) {
            const bestMove = message.split(' ')[1];
            if (bestMove && bestMove !== '(none)') {
                makeMove(bestMove);
                updateBoard();
            }
        }
        else if (message.startsWith('info') && message.includes('score cp')) {
            updateEvaluation(message);
        }
    };
    
    engine.postMessage('uci');
}

// Handle piece drag start
function onDragStart(source, piece) {
    if (game.game_over()) return false;
    if (game.turn() === 'w' && piece.search(/^b/) !== -1) return false;
    if (game.turn() === 'b' && piece.search(/^w/) !== -1) return false;
}

// Handle piece drop
function onDrop(source, target) {
    try {
        const move = game.move({
            from: source,
            to: target,
            promotion: 'q'
        });
        
        if (move === null) return 'snapback';
        
        updateMoveHistory();
        
        // Get computer move
        setTimeout(() => {
            if (!game.game_over()) {
                getComputerMove();
            }
        }, 250);
        
        return true;
    } catch (e) {
        console.error(e);
        return 'snapback';
    }
}

// Handle snap end
function onSnapEnd() {
    board.position(game.fen());
}

// Update the board position
function updateBoard() {
    board.position(game.fen());
    
    if (game.in_check()) {
        adviceElement.textContent = 'كش!';
    }
    
    if (game.in_checkmate()) {
        const winner = game.turn() === 'w' ? 'الأسود' : 'الأبيض';
        adviceElement.textContent = `كش ماط! فوز ${winner}`;
    } else if (game.in_draw()) {
        adviceElement.textContent = 'تعادل!';
    }
    
    analyzePosition();
}

// Get computer move from Stockfish
function getComputerMove() {
    if (!engineReady) return;
    
    engine.postMessage(`position fen ${game.fen()}`);
    engine.postMessage(`go depth ${currentDepth}`);
}

// Make a move on the board
function makeMove(moveString) {
    const move = {
        from: moveString.substring(0, 2),
        to: moveString.substring(2, 4)
    };
    
    if (moveString.length > 4) {
        move.promotion = moveString.substring(4, 5).toLowerCase();
    }
    
    game.move(move);
    updateMoveHistory();
    updateBoard();
}

// Update the move history display
function updateMoveHistory() {
    const moves = game.history();
    moveHistoryElement.innerHTML = '';
    
    for (let i = 0; i < moves.length; i += 2) {
        const moveNumber = Math.floor(i / 2) + 1;
        const whiteMove = moves[i];
        const blackMove = moves[i + 1] || '';
        
        const moveElement = document.createElement('div');
        moveElement.className = 'move-row';
        moveElement.innerHTML = `
            <span class="move-number">${moveNumber}.</span>
            <span class="move white">${whiteMove}</span>
            <span class="move black">${blackMove}</span>
        `;
        
        moveHistoryElement.appendChild(moveElement);
    }
    
    moveHistoryElement.scrollTop = moveHistoryElement.scrollHeight;
}

// Update evaluation bar and text
function updateEvaluation(message) {
    const parts = message.split(' ');
    const cpIndex = parts.indexOf('cp');
    
    if (cpIndex !== -1) {
        const cp = parseInt(parts[cpIndex + 1]);
        const isWhite = game.turn() === 'w';
        const evaluation = isWhite ? cp / 100 : -cp / 100;
        
        // Update evaluation bar (0-100% scale)
        const percentage = 50 + (evaluation * 10);
        const clampedPercentage = Math.min(100, Math.max(0, percentage));
        evaluationBar.style.width = `${clampedPercentage}%`;
        
        // Update evaluation text
        let evalText;
        if (evaluation > 0) {
            evalText = `+${evaluation.toFixed(1)} للأبيض`;
        } else if (evaluation < 0) {
            evalText = `${Math.abs(evaluation).toFixed(1)}+ للأبيض`;
        } else {
            evalText = 'متساوي';
        }
        
        evaluationText.textContent = `التقييم: ${evalText}`;
    }
}

// Analyze current position
function analyzePosition() {
    if (!engineReady) return;
    
    analysisList.innerHTML = '<li>جاري التحليل...</li>';
    
    engine.postMessage(`position fen ${game.fen()}`);
    engine.postMessage('go movetime 1000');
    
    // Get top moves
    engine.postMessage('setoption name MultiPV value 3');
    engine.postMessage('go depth 15');
    
    // This is a simplified analysis - in a real app, you'd parse the engine output
    // and provide more detailed analysis in Arabic
    const analysis = [
        'السيطرة على المركز جيدة',
        'تطوير الأحصنة والفيلة مهم في هذه المرحلة',
        'حاول تحريك القلعة إلى عمود مفتوح'
    ];
    
    analysisList.innerHTML = analysis.map(item => `<li>${item}</li>`).join('');
}

// Event Listeners
newGameBtn.addEventListener('click', () => {
    game.reset();
    board.start();
    updateBoard();
    moveHistoryElement.innerHTML = '';
    adviceElement.textContent = 'ابدأ اللعبة!';
    evaluationBar.style.width = '50%';
    evaluationText.textContent = 'التقييم: متساوي';
    analysisList.innerHTML = '';
});

hintBtn.addEventListener('click', () => {
    if (!engineReady || game.game_over()) return;
    
    engine.postMessage(`position fen ${game.fen()}`);
    engine.postMessage('go movetime 1000');
    
    const originalOnMessage = engine.onmessage;
    engine.onmessage = function(event) {
        const message = event.data || event;
        
        if (message.startsWith('bestmove')) {
            const bestMove = message.split(' ')[1];
            if (bestMove && bestMove !== '(none)') {
                const from = bestMove.substring(0, 2);
                const to = bestMove.substring(2, 4);
                const piece = game.get(from);
                const pieceName = pieceNames[piece.type] || 'قطعة';
                
                adviceElement.textContent = `نصيحة: حرك ${pieceName} من ${from} إلى ${to}`;
                
                // Highlight the suggested move
                board.removeArrows();
                board.arrow(from + to, 'green');
            }
            
            // Restore original message handler
            engine.onmessage = originalOnMessage;
        }
    };
});

analyzeBtn.addEventListener('click', analyzePosition);

// Initialize the game
window.onload = function() {
    initBoard();
    initEngine();
    updateBoard();
};
