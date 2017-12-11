var shapes = require('./shapes.js');

createPopulation = function(popCount){
    var genes = [];
    for(var i = 0; i < popCount; i++){
        genes.push(randomGene());
    }
    return genes;
}

randomGene = function(){
    var gene = {
        linesCleared: 0,
        holesCreated: 0,
        linesCreated: 0,
        barricadesCreated: 0,
    };
    var keys = Object.keys(gene);
    var remainingScale = 1.01;
    for (var i = 0; i < keys.length; i++) {
        if (i === keys.length - 1){
            gene[keys[i]] = remainingScale;
        }
        else {
            var scale = Math.random()*remainingScale;
            remainingScale -= scale;
            gene[keys[i]] = scale;
        }
        gene[keys[i]] = Math.random() < 0.5?gene[keys[i]]:-gene[keys[i]];
    }
    return gene;
};

reproduce = function(genes){
    genes.sort(function (a, b) {
        return b.score - a.score;
    });
    var newGenes = [];
    for(var i = 0; i < 4; i++) {
        var newGene = {};
        var keys = Object.keys(genes[i]);
        for (var kIndex = 0; kIndex <keys.length; kIndex++){
            newGene[keys[kIndex]] = Math.random()<0.5?genes[0][keys[kIndex]]:genes[i][keys[kIndex]];
        }
        newGenes.push(newGene);
    }
    for (var i = 0; i < 4; i++) {
        newGenes.push(randomGene());
    }
    return newGenes;
};

calculateMove = function(originalMatrix, originalShape, gene) {
    var bestMove = {
        scaledFitness: Number.NEGATIVE_INFINITY
    };
    var totalLines = countTotalLines(originalMatrix);
    for (var i = 0; i < 2; i++) {
        var matrix = copyMatrix(originalMatrix);
        var shape = shapes.copyShape(originalShape);
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
            matrix = copyMatrix(originalMatrix);
            shape = shapes.copyShape(originalShape);
            shape.x = xIndex;
            canMove = canTranslate(i, shape, matrix);
        }
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
    }
    return move;
}
scaleFitness = function(fitness, gene) {
    var scaledFitness = 0;
    for (var weight in gene){
        if (weight == 'score') {
            continue;
        }
        scaledFitness += gene[weight]*fitness[weight];
    }
    return scaledFitness;
};
calculateFitness = function(matrix, shape, totalLines) {
    var linesCleared, linesCreated, holesCreated, barricadesCreated;
    linesCleared = linesCreated = 0
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

    var values = {
        linesCleared: linesCleared,
        holesCreated: holesCreated,
        linesCreated: linesCreated,
        barricadesCreated: barricadesCreated
    };
    return values;
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
        if ((y >= matrix.length) || (matrix[y][x] != 0)) {
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
            if ((y + i >= matrix.length) || (matrix[y][x] != 0)) {
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