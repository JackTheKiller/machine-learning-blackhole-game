var createGameScene = function (engine) {
    
    var scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(0, 0, 0, 1);

    var instrumentation = new BABYLON.SceneInstrumentation(scene);
    instrumentation.captureFrameTime = true;

    var camera = new BABYLON.FreeCamera("mainCamera", BABYLON.Vector3.Zero(), scene);
    // camera.attachControl(engine.getRenderingCanvas(), true);

    var light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 0, 10), scene);
    light.diffuse = new BABYLON.Color3(1, 1, 1);
    light.specular = new BABYLON.Color3(0, 0, 0);
    light.groundColor = new BABYLON.Color3(0, 0, 0);

    var reticleMat = new BABYLON.StandardMaterial("reticleMat", scene);
    reticleMat.emissiveColor = new BABYLON.Color3(1, 1, 1);
    reticleMat.alpha = 0.05;

    var alpha20Mat = new BABYLON.StandardMaterial("alpha20Mat", scene);
    alpha20Mat.emissiveColor = new BABYLON.Color3(0, 0, 0);
    alpha20Mat.alpha = 0.2;

    // fog discs
    var discs = new Array(20);
    var discsDepth = GAME.CYLINDER_LENGTH;
    var distanceBetweenDiscs = discsDepth * 0.9 / discs.length;

    var discModel = BABYLON.MeshBuilder.CreateDisc("discModel", { radius: GAME.CYLINDER_DIAMETER / 2 }, scene);
    discModel.material = alpha20Mat;
    discModel.setEnabled(false);

    for (var i = discs.length - 1; i >= 0; i--) {
        var disc = discModel.createInstance("disc" + i);
        disc.isPickable = false;
        disc.setAbsolutePosition(new BABYLON.Vector3(0, 0, (i + 1) * distanceBetweenDiscs));
        discs[i] = disc;
    }

    // spirals
    var spiralChunks = 10;
    var spiralChunkLines = 6;
    var spirals = [];
    for (var j = spiralChunkLines - 1; j >= 0; j--) {
        for (var i = spiralChunks - 1; i >= 0; i--) {
            var spiral = createSpiral("spiral" + i, (GAME.CYLINDER_DIAMETER / 2) * 0.99, 100, 0.1, 1, scene);
            spiral.rotate(BABYLON.Axis.X, Math.PI / 2);
            spiral.rotate(BABYLON.Axis.Y, (Math.PI / spiralChunks) * i * 2 + j * 0.01);
            spiral.setAbsolutePosition(new BABYLON.Vector3(0, 0, 0));
            spirals.push(spiral);
        }
    }

    // players body
    var discReticle = BABYLON.MeshBuilder.CreateDisc("discReticle", { radius: 0.2 }, scene);
    discReticle.material = reticleMat;
    discReticle.setAbsolutePosition(new BABYLON.Vector3(0, 0, 4));
    discReticle.isPickable = false;

    // GUI
    var advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("uiGame");

    scene.advancedTexture = advancedTexture;

    var panel = new BABYLON.GUI.StackPanel();
    panel.width = 0.5;
    panel.height = 1;
    panel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    panel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    panel.paddingLeft = 10;
    advancedTexture.addControl(panel);

    var distanceScore = new BABYLON.GUI.TextBlock();
    distanceScore.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    distanceScore.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
    distanceScore.height = "30px";
    distanceScore.fontSize = 20;
    distanceScore.color = "gray";
    panel.addControl(distanceScore);

    var speedScore = new BABYLON.GUI.TextBlock();
    speedScore.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    speedScore.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
    speedScore.height = "30px";
    speedScore.fontSize = 20;
    speedScore.color = "gray";
    panel.addControl(speedScore);

    var obstaclesScore = new BABYLON.GUI.TextBlock();
    obstaclesScore.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    obstaclesScore.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
    obstaclesScore.height = "30px";
    obstaclesScore.fontSize = 20;
    obstaclesScore.color = "gray";
    panel.addControl(obstaclesScore);

    // camera/player movement
    scene.onPointerMove = function (evt, pic) {
        if (GAME.gameMode === GAME.SINGLE_PLAYER) {
            GAME.players[0].move(evt.clientX, evt.clientY);
            // var position = new BABYLON.Vector3(GAME.players[0].body.position.x, GAME.players[0].body.position.y, 4);
            // discReticle.setAbsolutePosition(position);
        }
    };

    // loop?
    scene.registerBeforeRender(function () {
        var deltaTime = instrumentation.frameTimeCounter.current * 0.0001;

        if (GAME.obstaclesPassed > 0 && GAME.currentSpeed > 0) {
            GAME.currentSpeed += GAME.ACCELERATION * deltaTime;
        }

        // player logic
        for (let i = GAME.players.length - 1; i >= 0; i--) {
            GAME.players[i].update();
        }

        // check if all players crashed
        var playersAlive = GAME.players.filter(player => !player.isCrashed).length;
        if (playersAlive === 0) {
            if (GAME.gameMode === GAME.SINGLE_PLAYER) {
                GAME.showMenu();
            } else if (GAME.gameMode === GAME.TRAINNING) {
                GAME.ga.evolvePopulation();
				GAME.ga.iteration++;
                GAME.reset();
            }
            return;
        }

        // rotate spirals
        for (var i = spirals.length - 1; i >= 0; i--) {
            spirals[i].rotate(BABYLON.Axis.Y, GAME.SPEED * 0.03 * deltaTime * (i % 2 ? 1 : 1.2));
        }

        // move obstacles
        GAME.om.update(deltaTime);

        // score / activating obstacles
        GAME.distancePassed += GAME.currentSpeed * deltaTime;
        GAME.speedReached = GAME.currentSpeed == 0 ? GAME.speedReached : GAME.currentSpeed;

        if (Math.floor(GAME.distancePassed) / GAME.om.distanceBetweenObstacles > GAME.om.obstaclesQueued) {
            GAME.om.spawnNext();

            if (GAME.distancePassed > GAME.CYLINDER_LENGTH + GAME.om.distanceBetweenObstacles) {
                GAME.obstaclesPassed++;
            }
        }

        distanceScore.text = "📏 " + GAME.distancePassed.toFixed(2);
        speedScore.text = "🚀 " + GAME.speedReached.toFixed(2);
        obstaclesScore.text = "🎯 " + GAME.obstaclesPassed;
    });

    return scene;
}