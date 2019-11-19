// TODO consider what happens when you click the stars that already there at the start, probably can't change them?

var currentGrid = [];
var answerGrid = [];
var zoneGrid = [];

var currentStars = []; // [1]-[8] are stars associated with that zone, null entries have no star in that zone

var canvas;
var ctx;

var finished = false; // once game is finished, clicking on the grid does nothing
var colours = false;

$('document').ready(function(){        
    canvas = document.getElementById('grid');    
    canvas.addEventListener('click', ClickedGrid);
    ctx = canvas.getContext('2d');

    document.getElementById('button_newgame').addEventListener('click', NewGame);
    document.getElementById('button_showanswer').addEventListener('click', ShowAnswer);
    document.getElementById('input_stars').addEventListener('keydown', function(event) { CheckInputText(event)});

    NewGame();
});


function NewGame() {
    InitializeGrid(answerGrid);    
    InitializeGrid(currentGrid);
    InitializeGrid(zoneGrid);

    finished = false;
    currentStars = [];    
    for (let i = 0; i < 9; i++) {
        currentStars.push(null);
    }
    
    DrawGrid();
    PlaceStars();    
    Partition();
}

function ShowAnswer() {
    DrawGrid();
    DrawThickLines(zoneGrid);

    for (y = 0; y < 8; y++) {
        for (x = 0; x < 8; x++) {
            if (answerGrid[x][y] == 1) {
                DrawStar(x, y);
            }
        }
    }

    finished = true;
}

function InitializeGrid(grid) {
    for (let i = 0; i < 8; i++) {
        grid[i] = [0, 0, 0, 0, 0, 0, 0, 0];
    }
}

function DrawGrid() {
    ctx.fillStyle = "white";
    ctx.rect(0, 0, canvas.width, canvas.height);
    ctx.fill();

    ctx.lineWidth = 1;
    for (y = 0; y < 8; y++) {
        for (x = 0; x < 8; x++) {
            ctx.strokeRect(x * 100, y * 100, 100, 100);
        }
    }
}

function DrawStar(x, y) {
    ctx.fillStyle = "blue";

    let xOffset = 10 + 100 * x;
    let yOffset = 12 + 100 * y;

    let scalingFactor = 0.35;
    let points = [108, 0, 141, 70, 218, 78.3, 162, 131, 175, 205, 108, 170, 41.2, 205, 55, 131, 1, 78, 75, 68, 108, 0].map(n => n * scalingFactor);

    ctx.beginPath();    
    ctx.moveTo(points[0] + xOffset, points[1] + yOffset);
    for (let i = 2; i < points.length; i += 2) {
        ctx.lineTo(points[i] + xOffset, points[i + 1] + yOffset);
    }
    ctx.closePath();
    ctx.fill();
}

function PrintGrid(someGrid) {
    for (let y = 0; y < someGrid.length; y++) {
        let row = "";
        for (let x = 0; x < someGrid.length; x++) {
            row += someGrid[x][y] + ", ";
        }
        console.log(row);        
    }
    console.log('\n');
}

function UndrawStar(x, y) {
    ctx.fillStyle = "white";
    ctx.fillRect(x * 100 + 6, y * 100 + 6, 88, 88);
}

function PlaceStars() {            
    let availableXs = [0, 1, 2, 3, 4, 5, 6, 7];
    let availableYs = [0, 1, 2, 3, 4, 5, 6, 7];
    
    while(availableXs.length > 0) {
        randomXIndex = Math.floor(Math.random() * availableXs.length);
        randomYIndex = Math.floor(Math.random() * availableYs.length);

        x = availableXs[randomXIndex];
        y = availableYs[randomYIndex];

        if (IsValidMove (x, y, answerGrid)) {
            answerGrid[x][y] = 1;    
            availableXs.splice(randomXIndex, 1)
            availableYs.splice(randomYIndex, 1)
        }
        else {
            // failed to place a star so restart placing to try again
            InitializeGrid(answerGrid);
            PlaceStars();
            return;
        }
    }
}

function CheckFinshed() {
    for(let i = 1; i < currentStars.length; i++) { // first index is unused
        if (currentStars[i] == null) {
            return false;
        }
    }

    new Audio("winner.mp3").play();

    finished = true;
}

function AddStar(x, y) {
    currentGrid[x][y] = 1;
    currentStars[zoneGrid[x][y]] = [x, y];
    DrawStar(x, y);
    CheckFinshed();
}

function RemoveStar(x, y) {
    currentGrid[x][y] = 0;
    currentStars[zoneGrid[x][y]] = null;    
    UndrawStar(x, y);
}

function ClickedGrid() {
    if (!finished) {
        var rect = canvas.getBoundingClientRect();
        var x = Math.floor((event.clientX - rect.left) / 100);
        var y = Math.floor((event.clientY - rect.top) / 100);

        ToggleStar(x, y);    
    }
}

// TODO add or remove entry from currentStars
function ToggleStar(x, y) {
    if (currentGrid[x][y] == 1) {        
        RemoveStar(x, y, currentGrid);
    }
    else {
        if (IsValidMove(x, y, currentGrid)) {
            AddStar(x, y, currentGrid);
        }
    }
}

// TODO this could return the square causing the move to be invalid so it can be displayed
function IsValidMove(x, y, grid) {

    // check if other star in column
    if (grid[x].includes(1)) {
        if (grid != answerGrid) {
            console.log("Invalid move: column")
        }
        return false;
    }

    // check if other star in row
    for (let i = 0; i < 7; i++) {
        if (grid[i][y] == 1) {
            if (grid != answerGrid) {
                console.log("Invalid move: row")
            }
            return false;
        }
    }

    // only need to check adjacent diagonals now, other cases already checked    
    if (DoesSquareHaveStar(x - 1, y - 1, grid) ||
        DoesSquareHaveStar(x + 1, y - 1, grid) || 
        DoesSquareHaveStar(x - 1, y + 1, grid) ||
        DoesSquareHaveStar(x + 1, y + 1, grid)) {
            if (grid != answerGrid) {
                console.log("Invalid move: adjacent")
            }
            return false;
    }

    // check zone not already occupied
    // this assumes that when answerGrid is being populated, zoneGrid is zeroed
    if (zoneGrid[x][y] != 0) {
        if (currentStars[zoneGrid[x][y]] != null) {
            if (grid != answerGrid) {
                console.log("Invalid move: zone")
            }
            return false;
        }
    }

    return true;
}

function DoesSquareHaveStar(x, y, grid) {
    // out of bounds squares have no star
    if (x < 0 || y < 0 || x > 7 || y > 7) {
        return false;
    }
    else {
        return grid[x][y];
    }
}

function Partition() {
    // give each star a 3x3 zone
    // fill remaining white space by randomly selecting from adjacent coloured squares  

    // TODO combine zoneGrid into some other grid

    starPoints = [];
    for (y = 0; y < 8; y++) {
        for (x = 0; x < 8; x++) {
            if (answerGrid[x][y] == 1) {
                starPoints.push([x, y]);
            }
        }
    }

    for (let i = 0; i < starPoints.length; i++) {
        zoneGrid[starPoints[i][0]][starPoints[i][1]] = i + 1;
    }

    starPoints.map(star => AddAdjacentToZone(star, zoneGrid));
        

    FillWhite(zoneGrid);

    if (colours) {
        let colourList = ["red", "green", "yellow", "pink", "peru", "plum", "silver", "teal"];
        
        for (y = 0; y < 8; y++) {
            for (x = 0; x < 8; x++) {
                ctx.fillStyle = colourList[zoneGrid[x][y] % colourList.length];
                ctx.fillRect(x * 100 + 3, y * 100 + 3, 94, 94);
            }
        }
    }

    let starList = [...starPoints];
    let numStarsToDraw = document.getElementById('input_stars').value;

    while (numStarsToDraw--) {
        let starIndex = Math.floor(Math.random() * starList.length);        
        let x = starList[starIndex][0]
        let y = starList[starIndex][1]

        currentGrid[x][y] = 1;    
        currentStars[zoneGrid[x][y]] = [x, y];
        DrawStar(x, y);
        starList.splice(starIndex, 1);        
    }    

    DrawThickLines(zoneGrid);
}

function AddAdjacentToZone(star, zoneGrid) {
    let zoneNumber = zoneGrid[star[0]][star[1]];

    let starX = star[0];
    let starY = star[1];

    for (let x = -1; x <= 1; x++) {
        for (let y = -1; y <= 1; y++) {
            let coordX = starX + x;
            let coordY = starY + y;
            
            if (zoneGrid[coordX] != undefined && zoneGrid[coordX][coordY] != undefined) {
                zoneGrid[coordX][coordY] = zoneNumber;
            }
        }
    }
}

function FillWhite(zoneGrid) {
    let whiteSquares = [];
    
    for (y = 0; y < 8; y++) {
        for (x = 0; x < 8; x++) {
            if (zoneGrid[x][y] == 0) {                
                whiteSquares.push([x, y]);
            }
        }
    }

    while (whiteSquares.length > 0)
    {
        let i = whiteSquares.length;
        while(i--) {
            if (ZoneSquare(whiteSquares[i][0], whiteSquares[i][1], zoneGrid)) {
                whiteSquares.splice(i, 1);
            }
        }
    }
}

function ZoneSquare(x, y, zoneGrid) {
    let possibleZones = [];

    for (let offset of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
        if (zoneGrid[x + offset[0]] == undefined) {
            continue;
        }

        let thisZone = zoneGrid[x + offset[0]][y + offset[1]];
        if (thisZone != 0 && thisZone != undefined && !possibleZones.includes(thisZone)) {
            possibleZones.push(thisZone);
        }
    }
    //console.log("possible zones: " + possibleZones);

    if (possibleZones.length == 0) {
        return false;
    }
    
    else {
        zoneGrid[x][y] = possibleZones[Math.floor(Math.random() * possibleZones.length)];
        //console.log("changed to " + zoneGrid[x][y]);
        return true;
    }
}

function DrawThickLines(zoneGrid) {
    ctx.lineWidth = 8;
    ctx.lineCap = "round";

    for (let y = 0; y < zoneGrid.length; y++) {
        for (let x = 0; x < zoneGrid.length; x++) {
            // vertical                
            if (x < zoneGrid.length - 1 && zoneGrid[x][y] != zoneGrid[x + 1][y]) {
                ctx.beginPath();
                ctx.moveTo(100 + x * 100, y * 100);
                ctx.lineTo(100 + x * 100, 100 + y * 100);        
                ctx.stroke();
            }

            // horizontal
            if (y < zoneGrid.length - 1 && zoneGrid[x][y] != zoneGrid[x][y + 1]) {
                ctx.beginPath();
                ctx.moveTo(x * 100, 100 + y * 100);
                ctx.lineTo(100 + x * 100, 100 + y * 100);        
                ctx.stroke();                
            }
            /*
            if (x == 0) {
                ctx.beginPath();
                ctx.moveTo(x * 100, y * 100);
                ctx.lineTo(x * 100, 100 + y * 100);        
                ctx.stroke();                
            }

            if (y == 0) {
                ctx.beginPath();
                ctx.moveTo(x * 100, y * 100);
                ctx.lineTo(100 + x * 100, y * 100);        
                ctx.stroke();                
            }
            */
        }   
    }

    ctx.lineCap = "butt";
    
    // draw border
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(800, 0);        
    ctx.stroke();                
    ctx.beginPath();
    ctx.moveTo(0, 800);
    ctx.lineTo(800, 800);        
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 800);        
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(800, 0);
    ctx.lineTo(800, 800);        
    ctx.stroke();
}

function CheckInputText(event) {
    if (event.keyCode == 49)
    {
        document.getElementById('text_plural').innerHTML = "";
    }
    else {
        document.getElementById('text_plural').innerHTML = "s";    
    }
}