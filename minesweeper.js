//#region Global Variables || Coded by Brian Araneta
let time = 0;
let columns = 0;
let rows = 0;
let minesNum = 0;
let tilesLeft = 0;
let flagsNum = 0;
let grid = [];
let timerId = 0;
// Stats
let score = 0;
let clicksDone = 0;
let flagsUsed = 0;

let firstTile = true;
let testMode = false; // Set to true to reveal mine positions
//#endregion

function setDifficulty() {
    let difficultySelector = document.getElementById("difficulty");
    let difficulty = difficultySelector.selectedIndex;

    if (difficulty === 0) { // Easy
        rows = 9; 
        columns = 9;
        minesNum = 10;
    } 
    else if (difficulty === 1) { // Medium
        rows = 16;
        columns = 16;
        minesNum = 40;
    } 
    else if (difficulty === 2) { // Hard
        rows = 16;
        columns = 30;
        minesNum = 99;
    }
}

function buildGrid() {
    // Fetch grid and clear out old elements.
    let grid = document.getElementById("minefield");
    grid.innerHTML = "";

    setDifficulty(); // Dynamically set the amount of tiles and bombs according to difficulty

    // Build DOM Grid
    let tile;
    let tiles = [];
    for (let row = 0; row < rows; row++) {
        tiles.push([]);
        for (let column = 0; column < columns; column++) {
            tile = createTile(column, row); // Implement tiles and its elements
            tiles[row].push(tile); // Push every new tile into the array
            grid.appendChild(tile.html);
        }
    }
    
    let style = window.getComputedStyle(tile.html);

    let width = parseInt(style.width.slice(0, -2));
    let height = parseInt(style.height.slice(0, -2));

    grid.style.width = (columns * width) + "px"; // Constrain the grid into proper columns and rows
    grid.style.height = (rows * height) + "px";

    return tiles;
}

function createTile(column, row) {
    let tile = document.createElement("div");

    tile.classList.add("tile");
    tile.classList.add("hidden");

    // Prevent default functions of middle/right click when interacting with the grid
    tile.addEventListener("auxclick", function(e) { e.preventDefault(); }); // Middle Click
    tile.addEventListener("contextmenu", function(e) { e.preventDefault(); }); // Right Click
    // Verify tile positions
    tile.addEventListener("mouseup", (e) => handleTileClick(column, row, e)); 

    tile.addEventListener("mouseup", (e) => smileyUp());
    tile.addEventListener("mousedown", (e) => smileyLimbo());

    return { // Store all tile object data to be globally accessible
        html: tile,
        data: {
            shown: false, 
            mineCount: 0,
            isMine: false,
            isFlag: false,
            row: row,
            column: column
        }
    };
}

function adjacent(row, col) { // Helper to scan adjacent tiles
    // row = row, col = column
    let mines = []

    for (let i of [-1, 0, 1]) {
        for (let j of [-1, 0, 1]) {
            if (!(i === 0 && j === 0) && row+i >= 0 && col+j >= 0 && row+i < rows && col+j < columns) {
                mines.push(grid[row+i][col+j]);
            }
        }
    }
    return mines;
}

function addMines() {
    // Add mines randomly
    for (let i = 0; i < minesNum; i++) { 
        let row = Math.floor(Math.random() * rows);
        let col = Math.floor(Math.random() * columns);
        if (grid[row][col].data.isMine) { // If there is already a mine on that tile, redo the current loop interval
            i = i - 1; continue;
        }
        grid[row][col].data.isMine = true;
        adjacent(row, col).forEach((cell) => { // For every mine adjacent, increase mineCount for the tile
            cell.data.mineCount++;
        })
        if (testMode) { // Enable the boolean at the top of the script to reveal mine positions
            grid[row][col].html.classList.add("mine_marked");
        }
    }
}

function revealTile({html, data}) { // Left Click
    if (data.isFlag && data.shown) { // When revealing adjacent tiles, avoid already shown/flagged tiles
        return;
    }
    if (data.isMine && !data.isFlag) {
        html.classList.add("mine_hit");
        data.shown = true;
        smileyLose();
        alert("Game Over!");
        stopTimer();
    } else if (data.mineCount === 0 && !data.isFlag && !data.shown) { // Check the amount of mines adjacent and if the tile is flagged or revealed
        // Adjacent mine count = 0 empty tile
        html.classList.remove("hidden");
        data.shown = true;
        adjacent(data.row, data.column).forEach(cell => revealTile(cell), tilesLeft--); // Recursive to keep on revealing tiles until it hits a numbered tile
        if (firstTile) {
            startTimer();
            firstTile = false;
        }
    } else if (!data.isFlag && !data.shown) {
        // Adjacent mine count > 0
        html.classList.add(`tile_${data.mineCount}`); // Dynamically assign a tile image to the amount of mines around a tile
        data.shown = true;
        tilesLeft--;
        if (firstTile) {
            startTimer();
            firstTile = false;
        }
        //console.log(`${data.mineCount}`, "Mine(s) Adjacent!");
    } 
}

function flagTile({html, data}) { // Right Click
    // Flag a Tile
    if (!data.isFlag && !data.shown && flagsNum !== minesNum) {
        html.classList.add("flag");
        data.isFlag = true;
        flagsNum++;
        flagsUsed++;
        console.log("Flagged a Tile");
    } else if (data.isFlag) {
        html.classList.remove("flag");
        data.isFlag = false;
        flagsNum--;
        console.log("Unflagged a Tile");
    } else if (flagsNum === minesNum) {
        console.log("Unable to flag!");
    }
}

function checkLevelCompletion() { // Check if level is complete by seeing if remaining tiles equal to the number of mines
    let levelComplete = false;
    if (tilesLeft === minesNum) {
        levelComplete = true;
    }
    if (levelComplete) {
      alert("You Win!\nCompletion Time: " + timeValue + 
      " Seconds\nClicks Performed: " + clicksDone + 
      "\nTotal Flags Used: " + flagsUsed);
      smileyWin();
      stopTimer();
    }
}

function handleTileClick(column, row, event) {
    cell = grid[row][column];

    // Left Click
    if (event.which === 1) {
        // Reveal the tile
        revealTile(cell);
        checkLevelCompletion();
        clicksDone++;
        // console.log(tilesLeft);
    }
    // Right Click
    else if (event.which === 3) {
        // Toggle a tile flag
        flagTile(cell);
        updateMinesLeft();
    }
}

//#region Smiley Functions
function smileyDown() {
    let smiley = document.getElementById("smiley");
    smiley.classList.add("face_down");
}

function smileyUp() {
    let smiley = document.getElementById("smiley");
    smiley.classList.remove("face_limbo");
}

function smileyLimbo() {
    let smiley = document.getElementById("smiley");
    smiley.classList.add("face_limbo");
}

function smileyLose() {
    let smiley = document.getElementById("smiley");
    smiley.classList.add("face_lose");
}

function smileyWin() {
    let smiley = document.getElementById("smiley");
    smiley.classList.add("face_win");
}

function smileyReset() {
    let smiley = document.getElementById("smiley");
    smiley.classList.remove("face_lose");
    smiley.classList.remove("face_down");
    smiley.classList.remove("face_limbo");
    smiley.classList.remove("face_win");
}
//#endregion

//#region Timer Functions
function startTimer() {
    console.log(grid);
    timeValue = 0;
    timerId = window.setInterval(onTimerTick, 1000);
}

function stopTimer() {
    window.clearInterval(timerId);
}

function onTimerTick() {
    timeValue++;
    updateTimer();
}

function updateTimer() {
    document.getElementById("timer").innerHTML = timeValue;
}
//#endregion

function updateMinesLeft() {
    let minesLeft = minesNum - flagsNum;
    document.getElementById("flagCount").innerHTML = minesLeft;
}

function resetStats() {
    tilesLeft = 0;
    flagsNum = 0;

    score = 0;
    clicksDone = 0;
    flagsUsed = 0;
}

function startGame() {
    stopTimer();
    resetStats();
    grid = buildGrid();
    tilesLeft = rows * columns;
    addMines();
    updateMinesLeft();
    smileyReset(); //Reset smiley image
    firstTile = true;
    //console.log(tilesLeft);
}
