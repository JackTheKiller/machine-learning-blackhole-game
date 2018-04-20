var ObstaclesManager = function (scene) {

    this.distanceBetweenObstacles = 50;

    // this.obstacleModels = {
    //     easy: [{ model: null, targets: [], pool: [] }],
    //     medium: [{ model: null, targets: [], pool: [] }],
    //     hard: [{ model: null, targets: [], pool: [] }]
    // };
    this.obstacleModels = {
        easy: new Array(),
        medium: new Array(),
        hard: new Array()
    };

    this.obstaclesQueue = [];
    this.activeObstacles = [];

    this.obstaclesQueued = 0;
    this.maxActiveObstacles = Math.floor(GAME.CYLINDER_LENGTH / this.distanceBetweenObstacles + 1);

    // build the models and object pools
    var targetMat = new BABYLON.StandardMaterial("redMat", scene);
    targetMat.emissiveColor = new BABYLON.Color3(1, 0, 0);
    targetMat.alpha = 0.0;

    var targetModel = BABYLON.MeshBuilder.CreateDisc("targetModel", { radius: GAME.CYLINDER_DIAMETER / 32 }, scene);
    targetModel.material = targetMat;
    targetModel.isPickable = false;

    var obstacleBlank = BABYLON.MeshBuilder.CreateCylinder("obstacleBlank", {
        diameter: GAME.CYLINDER_DIAMETER,
        height: 0.05,
        tessellation: 24
    }, scene);

    obstacleBlank.rotate(BABYLON.Axis.X, Math.PI / 2);
    obstacleBlank.setEnabled(false);

    // creating the 3 holes obstacle model
    var holePiece = BABYLON.MeshBuilder.CreateCylinder("holePiece", {
        diameter: (GAME.CYLINDER_DIAMETER / 6) * 2,
        height: 0.1,
        tessellation: 24
    }, scene);

    holePiece.rotate(BABYLON.Axis.X, Math.PI / 2);
    holePiece.position.y = GAME.CYLINDER_DIAMETER / 3.5;
    holePiece.setEnabled(false);

    var obstacleCSG = BABYLON.CSG.FromMesh(obstacleBlank);

    // targets for the machine learning
    var targets = [];

    for (var i = 3; i > 0; i--) {
        var hole = holePiece.clone("hole" + i);
        hole.rotateAroundPivot(BABYLON.Vector3.Zero(), BABYLON.Axis.Z, (Math.PI / 3) * i * 2);
        // TODO: rotateAroundPivot is messing up previus rotations
        hole.rotate(BABYLON.Axis.X, Math.PI / 2);

        var target = targetModel.clone("target_3_" + i);
        target.setAbsolutePosition(hole.position);
        targets.push(target);

        obstacleCSG.subtractInPlace(BABYLON.CSG.FromMesh(hole));

        hole.dispose();
    }

    var obstacleDone = obstacleCSG.toMesh("obstacle3holes", obstacleBlank.material, scene, false);
    obstacleDone.setEnabled(false);

    this.obstacleModels.easy.push({ model: obstacleDone, targets: targets, pool: [] });

    // creating the 2 holes obstacle model
    var obstacleCSG = BABYLON.CSG.FromMesh(obstacleBlank);

    // targets for the machine learning
    var targets = [];

    for (var i = 2; i > 0; i--) {
        var hole = holePiece.clone("hole" + i);
        hole.rotateAroundPivot(BABYLON.Vector3.Zero(), BABYLON.Axis.Z, (Math.PI / 2) * i * 2);
        // TODO: rotateAroundPivot is messing up previus rotations
        hole.rotate(BABYLON.Axis.X, Math.PI / 2);

        var target = targetModel.clone("target_2_" + i);
        target.setAbsolutePosition(hole.position);
        targets.push(target);

        obstacleCSG.subtractInPlace(BABYLON.CSG.FromMesh(hole));

        hole.dispose();
    }

    var obstacleDone = obstacleCSG.toMesh("obstacle2holes", obstacleBlank.material, scene, false);
    obstacleDone.setEnabled(false);

    this.obstacleModels.medium.push({ model: obstacleDone, targets: targets, pool: [] });

    // creating the 1 hole obstacle model
    var obstacleCSG = BABYLON.CSG.FromMesh(obstacleBlank);

    obstacleCSG.subtractInPlace(BABYLON.CSG.FromMesh(holePiece));

    // targets for the machine learning
    var targets = [];
    var target = targetModel.clone("target_1_1");
    target.setAbsolutePosition(holePiece.position);
    targets.push(target);

    holePiece.dispose();
    targetModel.dispose();

    var obstacleDone = obstacleCSG.toMesh("obstacle2holes", obstacleBlank.material, scene, false);
    obstacleDone.setEnabled(false);

    this.obstacleModels.hard.push({ model: obstacleDone, targets: targets, pool: [] });

    obstacleBlank.dispose();

    // fill the pools
    for (var difficulty in this.obstacleModels) {
        for (let j = this.obstacleModels[difficulty].length - 1; j >= 0; j--) {
            for (let i = 0; i < this.maxActiveObstacles * 2; i++) {
                var container = new BABYLON.TransformNode("container_" + difficulty + '_' + i);

                var obstacle = this.obstacleModels[difficulty][j].model.clone(difficulty + '_' + i, container);

                for (var t = this.obstacleModels[difficulty][j].targets.length - 1; t >= 0; t--) {
                    this.obstacleModels[difficulty][j].targets[t].clone("target_" + difficulty + "_" + i, container);
                }

                container.rotate(BABYLON.Axis.Z, Math.random() * 100);
                container.setAbsolutePosition(new BABYLON.Vector3(0, 0, this.distanceBetweenObstacles * this.maxActiveObstacles));
                container.rotateClockwise = i % 2;
                container.difficulty = difficulty;
                container.poolIndex = j;
                this.obstacleModels[difficulty][j].pool.push(container);
            }
        }
    }
}

ObstaclesManager.prototype = {

    reset: function () {
        for (let i = this.activeObstacles.length - 1; i >= 0; i--) {
            this.activeObstacles[i].setAbsolutePosition(new BABYLON.Vector3(0, 0, this.distanceBetweenObstacles * this.maxActiveObstacles))
            this.obstacleModels[this.activeObstacles[i].difficulty][this.activeObstacles[i].poolIndex].pool.push(this.activeObstacles.splice(i, 1)[0]);
        }

        for (let i = this.obstaclesQueue.length - 1; i >= 0; i--) {
            this.obstaclesQueue[i].setAbsolutePosition(new BABYLON.Vector3(0, 0, this.distanceBetweenObstacles * this.maxActiveObstacles))
            this.obstacleModels[this.obstaclesQueue[i].difficulty][this.obstaclesQueue[i].poolIndex].pool.push(this.obstaclesQueue.splice(i, 1)[0]);
        }

        this.obstaclesQueued = 0;

        this.startQueue();
    },

    startQueue: function () {
        var difficulty = GAME.gameMode === GAME.TRAINNING ? this.obstacleModels.hard : this.obstacleModels.easy;

        for (let i = difficulty.length - 1; i >= 0; i--) {
            this.obstaclesQueue = this.obstaclesQueue.concat(difficulty[i].pool);
            difficulty[i].pool = [];
        }

        shuffleArray(this.obstaclesQueue);
    },

    update: function (deltaTime) {
        for (let i = this.activeObstacles.length - 1; i >= 0; i--) {
            this.activeObstacles[i].position.z -= GAME.currentSpeed * deltaTime;
            this.activeObstacles[i].rotate(BABYLON.Axis.Z, GAME.SPEED * 0.05 * deltaTime * (this.activeObstacles[i].rotateClockwise ? -1 : 1));

            if (this.activeObstacles[i].position.z < 0) {
                this.activeObstacles[i].setAbsolutePosition(new BABYLON.Vector3(0, 0, this.distanceBetweenObstacles * this.maxActiveObstacles))
                this.obstaclesQueue.push(this.activeObstacles.splice(i, 1)[0]);
            }
        }
    },

    spawnNext: function () {
        if (this.obstaclesQueue[0] === undefined) {
            console.error("empty queue");
            return;
        }

        this.activeObstacles.push(this.obstaclesQueue.splice(0, 1)[0]);
        this.obstaclesQueued++;

        this.updateDifficulty();
    },

    updateDifficulty: function () {
        if (GAME.gameMode === GAME.TRAINNING) return;

        var previousLength = this.obstaclesQueue.length;

        if (GAME.obstaclesPassed >= 40) {
            // force shuffle for each 5 obstacles passed
            if (GAME.obstaclesPassed % 5) {
                previousLength = 0;
            }

        } else if (GAME.obstaclesPassed >= 35) {
            // remove medium
            for (let i = this.obstaclesQueue.length - 1; i >= 0; i--) {
                if (this.obstaclesQueue[i].difficulty == "medium") {
                    this.obstacleModels.medium[this.obstaclesQueue[i].poolIndex].pool.push(this.obstaclesQueue.splice(i, 1)[0]);
                }
            }

        } else if (GAME.obstaclesPassed == 25) {
            // include hard
            for (let i = this.obstacleModels.hard.length - 1; i >= 0; i--) {
                if (this.obstacleModels.hard[i].pool.length > 0) {
                    this.obstaclesQueue = this.obstaclesQueue.concat(this.obstacleModels.hard[i].pool);
                    this.obstacleModels.hard[i].pool = [];
                }
            }

        } else if (GAME.obstaclesPassed >= 15) {
            // remove easy
            for (let i = this.obstaclesQueue.length - 1; i >= 0; i--) {
                if (this.obstaclesQueue[i].difficulty == "easy") {
                    this.obstacleModels.easy[this.obstaclesQueue[i].poolIndex].pool.push(this.obstaclesQueue.splice(i, 1)[0]);
                }
            }

        } else if (GAME.obstaclesPassed == 5) {
            // include medium
            for (let i = this.obstacleModels.medium.length - 1; i >= 0; i--) {
                if (this.obstacleModels.medium[i].pool.length > 0) {
                    this.obstaclesQueue = this.obstaclesQueue.concat(this.obstacleModels.medium[i].pool);
                    this.obstacleModels.medium[i].pool = [];
                }
            }

        }

        if (previousLength != this.obstaclesQueue.length) {
            shuffleArray(this.obstaclesQueue);
        }
    }
}