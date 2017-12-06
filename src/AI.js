network = {
    init:function(){
        this.gene = {
            linesCleared: 0,
            holesCreated: 0,
            linesCreated: 0,
            barricades: 0
        }

        for (var weight in this.gene) {
            weight = Math.floor(Math.random()*101);
        }
        return this.gene;
    }
}