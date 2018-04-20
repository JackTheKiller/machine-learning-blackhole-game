var GeneticAlgorithm = function (max_units, top_units) {

    this.max_units = max_units;
    this.top_units = top_units;

    if (this.max_units < this.top_units) this.top_units = this.max_units;

    this.Population = [];

    this.SCALE_FACTOR = 100; // the factor used to scale normalized input values


    this.iteration = 1;	// generation
    this.mutateRate = 1; // initial mutation rate

    this.best_population = 0; // the population number of the best unit
    this.best_score = {};	// the score of the best unit ever
}

GeneticAlgorithm.prototype = {

    createPopulation: function () {
        this.Population.splice(0, this.Population.length);

        for (var i = 0; i < this.max_units; i++) {
            // 2 neurons in the input layer, 6 neurons in the hidden layer and 2 neurons in the output layer
            var newUnit = new synaptic.Architect.Perceptron(2, 6, 2);

            // set additional parameters for the new unit
            newUnit.index = i;
            newUnit.score = GAME.players[i].score;
            newUnit.isWinner = false;

            this.Population.push(newUnit);
        }
    },

    // activates the neural network of an unit from the population 
    // to calculate an output action according to the inputs
    activateBrain: function (player, target) {
        var targetDeltaX = this.normalize(target.absolutePosition.x, GAME.CYLINDER_DIAMETER / 3.5) * this.SCALE_FACTOR;
        var targetDeltaY = this.normalize(target.absolutePosition.y, GAME.CYLINDER_DIAMETER / 3.5) * this.SCALE_FACTOR;

        var inputs = [targetDeltaX, targetDeltaY];

        // calculate outputs by activating synaptic neural network of this player
        var outputs = this.Population[player.index].activate(inputs);

        // simulate a cursor location
        var x = outputs[0] * player.body.getScene().getEngine().getRenderWidth();
        var y = outputs[1] * player.body.getScene().getEngine().getRenderHeight();

        player.move(x, y);
    },

    // evolves the population by performing selection, crossover and mutations on the units
    evolvePopulation: function () {
        // select the top units of the current population to get an array of winners
        // (they will be copied to the next population)
        var Winners = this.selection();

        if (this.mutateRate == 1 && GAME.players[Winners[0].index].score.fitness < 0) {
            // If the best unit from the initial population has a negative fitness 
            // then it means there is no any player which reached the first barrier!
            // Playing as the God, we can destroy this bad population and try with another one.
            this.createPopulation();
        } else {
            this.mutateRate = 0.2; // else set the mutatation rate to the real value
        }

        // fill the rest of the next population with new units using crossover and mutation
        for (var i = this.top_units; i < this.max_units; i++) {
            var parentA, parentB, offspring;

            if (i == this.top_units) {
                // offspring is made by a crossover of two best winners
                parentA = Winners[0].toJSON();
                parentB = Winners[1].toJSON();
                offspring = this.crossOver(parentA, parentB);

            } else if (i < this.max_units - 2) {
                // offspring is made by a crossover of two random winners
                parentA = this.getRandomUnit(Winners).toJSON();
                parentB = this.getRandomUnit(Winners).toJSON();
                offspring = this.crossOver(parentA, parentB);

            } else {
                // offspring is a random winner
                offspring = this.getRandomUnit(Winners).toJSON();
            }

            // mutate the offspring
            offspring = this.mutation(offspring);

            // create a new unit using the neural network from the offspring
            var newUnit = synaptic.Network.fromJSON(offspring);
            newUnit.index = this.Population[i].index;
            newUnit.score = GAME.players[newUnit.index].score;
            newUnit.isWinner = false;

            // update population by changing the old unit with the new one
            this.Population[i] = newUnit;
        }

        // if the top winner has the best fitness in the history, store its achievement!
        if (GAME.players[Winners[0].index].score.fitness > this.best_score.fitness) {
            this.best_population = this.iteration;
            this.best_score = JSON.parse(JSON.stringify(Winners[0].score));
        }

        // sort the units of the new population	in ascending order by their index
        this.Population.sort(function (unitA, unitB) {
            return unitA.index - unitB.index;
        });
    },

    // selects the best units from the current population
    selection: function () {
        // sort the units of the current population	in descending order by their fitness
        var sortedPopulation = this.Population.sort(
            function (unitA, unitB) {
                return GAME.players[unitB.index].score.fitness - GAME.players[unitA.index].score.fitness;
            }
        );

        // mark the top units as the winners!
        for (var i = 0; i < this.top_units; i++) this.Population[i].isWinner = true;

        // return an array of the top units from the current population
        return sortedPopulation.slice(0, this.top_units);
    },

    // performs a single point crossover between two parents
    crossOver: function (parentA, parentB) {
        // get a cross over cutting point
        var cutPoint = this.random(0, parentA.neurons.length - 1);

        // swap 'bias' information between both parents:
        // 1. left side to the crossover point is copied from one parent
        // 2. right side after the crossover point is copied from the second parent
        for (var i = cutPoint; i < parentA.neurons.length; i++) {
            var biasFromParentA = parentA.neurons[i]['bias'];
            parentA.neurons[i]['bias'] = parentB.neurons[i]['bias'];
            parentB.neurons[i]['bias'] = biasFromParentA;
        }

        return this.random(0, 1) == 1 ? parentA : parentB;
    },

    // performs random mutations on the offspring
    mutation: function (offspring) {
        // mutate some 'bias' information of the offspring neurons
        for (var i = 0; i < offspring.neurons.length; i++) {
            offspring.neurons[i]['bias'] = this.mutate(offspring.neurons[i]['bias']);
        }

        // mutate some 'weights' information of the offspring connections
        for (var i = 0; i < offspring.connections.length; i++) {
            offspring.connections[i]['weight'] = this.mutate(offspring.connections[i]['weight']);
        }

        return offspring;
    },

    // mutates a gene
    mutate: function (gene) {
        if (Math.random() < this.mutateRate) {
            var mutateFactor = 1 + ((Math.random() - 0.5) * 3 + (Math.random() - 0.5));
            gene *= mutateFactor;
        }

        return gene;
    },

    random: function (min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    },

    getRandomUnit: function (array) {
        return array[this.random(0, array.length - 1)];
    },

    normalize: function (value, max) {
        // clamp the value between its min/max limits
        if (value < -max) value = -max;
        else if (value > max) value = max;

        // normalize the clamped value
        return (value / max);
    }
}