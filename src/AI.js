var shapes = require('./shapes.js');
var consts = require('./consts.js');

createPopulation = function(popCount){
    var genes = [];

    for(var i = 0; i < popCount/2; i++){
        genes.push(initialGene());
    }
    for(var i = 0; i < popCount/2; i++){
        genes.push(randomGene());
    }
    return genes;
};

initialGene = function() {
    var gene = {
        linesCleared: 95,//100
        holesCreated: 21,//-100
        linesCreated: -20,//-50
        barricadesCreated: -67,//-100
        floorHugged: 50,//50
        leftWallHugged: 23,//20
        rightWallHugged: 21,//20
        hugsAnotherPiece: 23//70
    };

    return gene;
};

randomGene = function(){
    var gene = {
        linesCleared: 0,
        holesCreated: 0,
        linesCreated: 0,
        barricadesCreated: 0,
        floorHugged: 0,
        leftWallHugged: 0,
        rightWallHugged: 0,
        hugsAnotherPiece: 0
    };

    for (var key in gene) {
        gene[key] = generateRandomValue();
    }
    return gene;
};

var generateRandomValue = function() {
    return Math.floor(Math.random()*201) - 100;
};

reproduce = function(genes){
    genes.sort(function (a, b) {
        return b.score - a.score;
    });
    var newGenes = [];

    newGenes.push(genes[0]);
    for(var i = 0; i < consts.POPULATIONSIZE/2 - 1; i++) {
        var newGene = {};
        var keys = Object.keys(genes[i]);
        for (var kIndex = 0; kIndex <keys.length; kIndex++) {
            newGene[keys[kIndex]] = (genes[i+1][keys[kIndex]] + genes[0][keys[kIndex]]) / 2;
            newGene[keys[kIndex]] = Math.random() < consts.MUTATIONPROBABILITY ? generateRandomValue():newGene[keys[kIndex]];
        }
        newGenes.push(newGene);
    }


    for (var i = 0; i < consts.POPULATIONSIZE/2; i++) {
        newGenes.push(randomGene());
    }
    return newGenes;
};

calculateAllMoves = function(originalMatrix, originalShape, gene) {
    var bestMove = {
        scaledFitness: Number.NEGATIVE_INFINITY
    };
    var rotatedShape = shapes.copyShape(originalShape);
    var rotatedMatrix = copyMatrix(originalMatrix);
    var totalLines = countTotalLines(rotatedMatrix);
    for (var r = 0; r < rotatedShape.states.length; r++) {
        if (rotatedShape.canRotate(rotatedMatrix) && r !== 0) {
            rotatedShape.rotate(rotatedMatrix);
        }
        for (var i = 0; i < 2; i++) {
            var matrix = copyMatrix(rotatedMatrix);
            var shape = shapes.copyShape(rotatedShape);
            var xIndex = i === 0?shape.x + 1:shape.x;
            shape.x = xIndex;
            var canMove = canTranslate(i, shape, matrix);

            while (canMove) {
                if (i === 0) {
                    shape.goLeft(matrix);
                }
                else {
                    shape.goRight(matrix);
                }
                xIndex = shape.x;
                while (shape.canDown(matrix)) {
                    shape.goDown(matrix);
                }
                shape.copyTo(matrix);
                var fitness = calculateFitness(matrix, shape, totalLines);
                var scaledFitness = scaleFitness(fitness, gene);
                bestMove = bestMove['scaledFitness']<scaledFitness?saveBestMove(scaledFitness, shape):bestMove;
                matrix = copyMatrix(rotatedMatrix);
                shape = shapes.copyShape(rotatedShape);
                shape.x = xIndex;
                canMove = canTranslate(i, shape, matrix);
            }
        }
    }

    if (bestMove['scaledFitness'] == Number.NEGATIVE_INFINITY){
        console.log('here');
    }
    return bestMove;
};

canTranslate = function(index, shape, matrix) {
    var canMove;
    if (index === 0) {
        canMove = shape.canLeft(matrix);
    }
    else {
        canMove = shape.canRight(matrix);
    }
    return canMove;
};
saveBestMove = function(scaledFitness, shape) {
    var move = {
        scaledFitness: scaledFitness,
        shape: shape
    };
    return move;
};
scaleFitness = function(fitness, gene) {
    var scaledFitness = 0;
    for (var weight in gene){
        if (weight == 'score') {
            continue;
        }
        scaledFitness += gene[weight]*fitness[weight];
    }
    if (isNaN(scaledFitness)){
        console.log('here');
    }
    return scaledFitness;
};
calculateFitness = function(matrix, shape, totalLines) {
    var linesCleared, linesCreated, holesCreated, barricadesCreated,
        floorHugged, leftWallHugged, rightWallHugged, hugsAnotherPiece;
    linesCleared = linesCreated = floorHugged = leftWallHugged = rightWallHugged = hugsAnotherPiece = 0;
    var lines = countTotalLines(matrix);
    var deltaLines = totalLines - lines;
    if (deltaLines >= 0) {
        linesCleared = deltaLines;
    }
    else {
        linesCreated = -deltaLines;
    }
    holesCreated = countHoles(matrix, shape);
    barricadesCreated = countBarricades(matrix, shape);
    floorHugged = countFloorHugged(matrix, shape);
    leftWallHugged = countLeftWallHugged(matrix, shape);
    rightWallHugged = countRightWallHugged(matrix, shape);
    hugsAnotherPiece = countHugsAnotherPiece(matrix, shape);

    var values = {
        linesCleared: linesCleared,
        holesCreated: holesCreated,
        linesCreated: linesCreated,
        barricadesCreated: barricadesCreated,
        floorHugged: floorHugged,
        leftWallHugged: leftWallHugged,
        rightWallHugged: rightWallHugged,
        hugsAnotherPiece: hugsAnotherPiece
    };
    return values;
};

countHugsAnotherPiece = function (matrix, shape) {
    var totalHugsAnotherPiece = 0;
    var shapeMatrix = shape.states[shape.state];

    countTotalHugsAnotherPiece = function (matrix, shape, shapeMatrix, y, x) {
        if (x >= 0 && x < shapeMatrix[0].length && y >= 0 && y < shapeMatrix.length) {
            if (shapeMatrix[y][x] === 1) {
                return 0;
            }
        }
        x += shape.x;
        y += shape.y;
        if ((x >= 0) && (x < matrix[0].length) && (y < matrix.length) &&
            (matrix[y][x] !== 0)) {
            return 1;
        }
        return 0;
    };

    for (var row = 0; row < shapeMatrix.length; row++) {
        for (var col = 0; col < shapeMatrix[row].length; col++) {
            if (shapeMatrix[row][col] === 1){
                totalHugsAnotherPiece += countTotalHugsAnotherPiece(matrix, shape, shapeMatrix, row + 1, col);
                totalHugsAnotherPiece += countTotalHugsAnotherPiece(matrix, shape, shapeMatrix, row, col - 1);
                totalHugsAnotherPiece += countTotalHugsAnotherPiece(matrix, shape, shapeMatrix, row, col + 1);
            }
        }
    }

    return totalHugsAnotherPiece;
};

countRightWallHugged = function(matrix, shape) {
    var isHuggingRightWall = function(box){
        var x = shape.x + box.x;
        if (x === matrix[0].length - 1) {
            return 1;
        }
        return 0;
    };
    var totalRightWallHugged = 0;
    var shapeBox = shape.getBoxes(shape.state);
    for(var i in shapeBox) {
        totalRightWallHugged += isHuggingRightWall(shapeBox[i]);
    }
    return totalRightWallHugged;
};

countLeftWallHugged = function(matrix, shape) {
    var isHuggingLeftWall = function(box){
        var x = shape.x + box.x;
        if (x === 0) {
            return 1;
        }
        return 0;
    };
    var totalLeftWallHugged = 0;
    var shapeBox = shape.getBoxes(shape.state);
    for(var i in shapeBox){
        totalLeftWallHugged += isHuggingLeftWall(shapeBox[i]);
    }
    return totalLeftWallHugged;
};

countFloorHugged = function(matrix, shape) {
    var isHuggingFloor = function(box){
        var y = shape.y + box.y;
        if (y === matrix.length - 1) {
            return 1;
        }
        return 0;
    };
    var totalFloorHugged = 0;
    var shapeBox = shape.getBoxes(shape.state);
    for(var i in shapeBox){
        totalFloorHugged += isHuggingFloor(shapeBox[i]);
    }
    return totalFloorHugged;
};

countTotalLines = function(matrix) {
    var rowNumbers = 0;
    for(var i = 0;i<matrix.length;i++){
        var row = matrix[i];
        var occupied = false;
        for(var j = 0;j<row.length;j++){
            occupied = row[j]!==0;
            if (occupied) {
                rowNumbers++;
                break;
            }
        }
    }
    return rowNumbers;
};

countHoles = function(matrix, shape) {
    var shapeBox = shape.getBoxes(shape.state);

    var isHole = function(box){
        var x = shape.x + box.x;
        var y = shape.y + box.y + 1; //+1 to check under block for hole
        if ((y >= matrix.length) || (matrix[y][x] !== 0)) {
            return 0;
        }
        return 1;
    };
    var totalHoles = 0;
    for(var i in shapeBox){
        totalHoles += isHole(shapeBox[i]);
    }
    return totalHoles;
};

countBarricades = function(matrix, shape) {
    var shapeBox = shape.getBoxes(shape.state);

    var isBarricade = function(box){
        var x = shape.x + box.x;
        var y = shape.y + box.y + 1; //+1 to check under block for hole
        for (var i = 1; i <= matrix.length; i++) {
            if ((y + i >= matrix.length) || (matrix[y][x] !== 0)) {
                return 0;
            }
            return 1;
        }
    };
    var totalBarricades = 0;
    for(var i in shapeBox){
        totalBarricades += isBarricade(shapeBox[i]);
    }
    return totalBarricades;
};

var copyMatrix = function(matrix){
    var copiedMatrix = [];
    for (var i = 0; i<matrix.length;i++){
        var row = [];
        copiedMatrix.push(row);
        for(var j = 0;j<matrix[i].length;j++){
            row.push(matrix[i][j]);
        }
    }

    return copiedMatrix;
};

module.exports.createPopulation = createPopulation;
module.exports.reproduce = reproduce;
module.exports.calculateAllMoves = calculateAllMoves;