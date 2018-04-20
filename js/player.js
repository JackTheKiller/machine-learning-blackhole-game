var Player = function (body, color, isHuman) {

    this.body = body;
    this.color = color;
    this.isHuman = isHuman;
    this.isCrashed = false;
    this.score = {
        fitness: 0,
        distancePassed: 0,
        obstaclesPassed: 0,
        speedReached: 0
    };
}

Player.prototype = {

    move: function (targetX, targetY) {
        if (!this.isHuman) {
            this.moving = {
                x: targetX,
                y: targetY
            };
        }

        var limiterRadius = 3;

        var yScale = 0.01;
        var xScale = 0.01;

        targetX = xScale * 1.0 * (targetX - this.body.getScene().getEngine().getRenderWidth() / 2);
        targetY = yScale * -1.0 * (targetY - this.body.getScene().getEngine().getRenderHeight() / 2);

        var radius = Math.sqrt(targetX * targetX + targetY * targetY);
        var newRadius = Math.min(limiterRadius, radius);

        targetX = (radius === 0) ? 0 : targetX * newRadius / radius;
        targetY = (radius === 0) ? 0 : targetY * newRadius / radius;

        this.body.position.x = targetX;
        this.body.position.y = targetY;
    },

    crash: function (hit) {
        this.isCrashed = true;

        if (!this.isHuman) {
            this.score.fitness += 100 - BABYLON.Vector3.Distance(this.body.position, this.target.position);
            this.guideLine.linkWithMesh(this.body);
            this.target = null;
        }
    },

    reset: function () {
        this.lastScore = JSON.parse(JSON.stringify(this.score));
        this.isCrashed = false;
        for (var key in this.score) {
            this.score[key] = 0;
        }
    },

    detectCollision: function (radius, range) {
        var hit;
        var raysCount = 3;

        var angle = (Math.PI * 2) / raysCount;

        var cx = this.body.position.x;
        var cy = this.body.position.y;

        // visual aid ---
        // if (!window.tempLines) window.tempLines = [];
        // window.tempLines.map(line => line.dispose());
        // window.tempLines = [];
        // --------------

        for (let i = 0; i < raysCount; i++) {
            // visual aid ---
            // var myPoints = [];
            // var myColors = [];
            // --------------

            var x = cx + radius * Math.cos(angle * i);
            var y = cy + radius * Math.sin(angle * i);

            var ray = new BABYLON.Ray(new BABYLON.Vector3(x, y, 1), BABYLON.Axis.Z, range);

            var result = this.body.getScene().pickWithRay(ray);

            if (result.pickedMesh) {
                hit = result;
                // myColors.push(new BABYLON.Color4(1, 0, 0, 1));
            } else {
                // myColors.push(new BABYLON.Color4(1, 1, 1, 1));
            }

            // visual aid ---
            // myPoints.push(new BABYLON.Vector3(x, y, 0));
            // myPoints.push(new BABYLON.Vector3(cx, cy, 2));

            // myColors.push(new BABYLON.Color4(0, 0, 0, 1));

            // var line = BABYLON.MeshBuilder.CreateLines(name, {
            //     points: myPoints,
            //     colors: myColors
            // }, this.body.getScene());
            // line.isPickable = false;

            // window.tempLines.push(line);
            // --------------
        }

        if (hit) {
            this.crash(hit);
        }
    },

    update: function () {
        if (this.isCrashed) return;

        this.score.distancePassed = GAME.distancePassed;
        this.score.obstaclesPassed = GAME.obstaclesPassed;
        this.score.speedReached = GAME.speedReached;
        this.score.fitness = this.score.distancePassed + this.score.obstaclesPassed * 500;

        if (!this.isHuman && GAME.om.activeObstacles.length > 0) {
            var obstacleName = GAME.om.activeObstacles[0].id;
            var targetObstacleName = this.target ? this.target.parent.id : '';

            if (targetObstacleName != obstacleName) {
                this.target = this.getNearestTarget();
                this.guideLine.linkWithMesh(this.target);
            }

            if (this.target != null) {
                GAME.ga.activateBrain(this, this.target);
            }
        }

        this.detectCollision(0.1, 1);
    },

    getNearestTarget: function () {
        if (GAME.om.activeObstacles[0]) {
            var meshChildren = GAME.om.activeObstacles[0].getChildMeshes();
            var targets = meshChildren.filter(mesh => mesh.id.match(/^target/));

            var closestDistance = 999;
            var closestTarget = null;

            for (var i = targets.length - 1; i >= 0; i--) {
                var targetDistance = BABYLON.Vector3.Distance(this.body.position, targets[i].position);
                if (targetDistance < closestDistance) {
                    closestDistance = targetDistance;
                    closestTarget = targets[i];
                }
            }
        }
        return closestTarget;
    }
}