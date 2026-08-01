/**
 * Sudoku Generator and Solver Logic
 */
class Sudoku {
    constructor() {
        this.board = Array.from({ length: 9 }, () => Array(9).fill(0));
        this.solution = Array.from({ length: 9 }, () => Array(9).fill(0));
    }

    // Initialize an empty board
    clearBoard() {
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                this.board[r][c] = 0;
            }
        }
    }

    // Check if it's safe to place a number in a specific cell
    isSafe(board, row, col, num) {
        // Check row
        for (let x = 0; x < 9; x++) {
            if (board[row][x] === num) return false;
        }

        // Check column
        for (let x = 0; x < 9; x++) {
            if (board[x][col] === num) return false;
        }

        // Check 3x3 box
        const startRow = row - (row % 3);
        const startCol = col - (col % 3);
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (board[i + startRow][j + startCol] === num) return false;
            }
        }

        return true;
    }

    // Solve the board using backtracking
    solve(board) {
        let row = -1;
        let col = -1;
        let isEmpty = true;

        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (board[i][j] === 0) {
                    row = i;
                    col = j;
                    isEmpty = false;
                    break;
                }
            }
            if (!isEmpty) {
                break;
            }
        }

        // No empty space left
        if (isEmpty) {
            return true;
        }

        // Backtrack
        for (let num = 1; num <= 9; num++) {
            if (this.isSafe(board, row, col, num)) {
                board[row][col] = num;
                if (this.solve(board)) {
                    return true;
                }
                board[row][col] = 0;
            }
        }
        return false;
    }

    // Fill the diagonal 3x3 boxes (optimization for generator)
    fillDiagonal() {
        for (let i = 0; i < 9; i += 3) {
            this.fillBox(i, i);
        }
    }

    // Fill a 3x3 box
    fillBox(rowStart, colStart) {
        let num;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                do {
                    num = Math.floor(Math.random() * 9) + 1;
                } while (!this.isSafeInBox(rowStart, colStart, num));
                this.board[rowStart + i][colStart + j] = num;
            }
        }
    }

    // Check if safe in a 3x3 box
    isSafeInBox(rowStart, colStart, num) {
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (this.board[rowStart + i][colStart + j] === num) {
                    return false;
                }
            }
        }
        return true;
    }

    // Check how many solutions exist (to ensure unique solution)
    countSolutions(board, limit = 2) {
        let row = -1, col = -1;
        let isEmpty = true;
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (board[i][j] === 0) {
                    row = i; col = j;
                    isEmpty = false; break;
                }
            }
            if (!isEmpty) break;
        }

        if (isEmpty) return 1;
        
        let count = 0;
        for (let num = 1; num <= 9; num++) {
            if (this.isSafe(board, row, col, num)) {
                board[row][col] = num;
                count += this.countSolutions(board, limit);
                if (count >= limit) return count;
                board[row][col] = 0;
            }
        }
        return count;
    }

    // Generate a full valid board
    generateFullBoard() {
        this.clearBoard();
        this.fillDiagonal();
        this.solve(this.board);
        // Save the solution
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                this.solution[i][j] = this.board[i][j];
            }
        }
    }

    // Remove digits based on difficulty
    removeDigits(difficulty) {
        let count;
        switch (difficulty) {
            case 'easy': count = 30; break;
            case 'medium': count = 45; break;
            case 'hard': count = 55; break;
            default: count = 45;
        }

        let attempts = 5;
        while (count > 0 && attempts > 0) {
            let i = Math.floor(Math.random() * 9);
            let j = Math.floor(Math.random() * 9);
            
            if (this.board[i][j] !== 0) {
                let backup = this.board[i][j];
                this.board[i][j] = 0;
                
                // Copy board to count solutions
                let copy = this.board.map(row => [...row]);
                if (this.countSolutions(copy) !== 1) {
                    this.board[i][j] = backup;
                    attempts--;
                } else {
                    count--;
                }
            }
        }
    }

    // Main function to get a new puzzle
    generatePuzzle(difficulty) {
        this.generateFullBoard();
        this.removeDigits(difficulty);
        return {
            board: this.board.map(row => [...row]),
            solution: this.solution.map(row => [...row])
        };
    }
}
