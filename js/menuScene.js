var createMenuScene = function (engine) {
    
    var scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(0, 0, 0, 1);

    var instrumentation = new BABYLON.SceneInstrumentation(scene);
    instrumentation.captureFrameTime = true;

    var camera = new BABYLON.FreeCamera("mainCamera", BABYLON.Vector3.Zero(), scene);

    var light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 0, 10), scene);
    light.diffuse = new BABYLON.Color3(1, 1, 1);
    light.specular = new BABYLON.Color3(0, 0, 0);
    light.groundColor = new BABYLON.Color3(0, 0, 0);

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

    // GUI
    var advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("uiMenu");

    scene.advancedTexture = advancedTexture;

    var panel = new BABYLON.GUI.StackPanel();
    panel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    panel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    panel.width = 0.25;
    advancedTexture.addControl(panel);

    // score
    var distanceScore = new BABYLON.GUI.TextBlock();
    distanceScore.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    distanceScore.height = "40px";
    distanceScore.fontSize = 30;
    distanceScore.color = "white";
    panel.addControl(distanceScore);

    var speedScore = new BABYLON.GUI.TextBlock();
    speedScore.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    speedScore.height = "40px";
    speedScore.fontSize = 30;
    speedScore.color = "white";
    panel.addControl(speedScore);

    var obstaclesScore = new BABYLON.GUI.TextBlock();
    obstaclesScore.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    obstaclesScore.height = "80px";
    obstaclesScore.fontSize = 30;
    obstaclesScore.color = "white";
    panel.addControl(obstaclesScore);

    // buttons
    var singlePlayerButton = BABYLON.GUI.Button.CreateSimpleButton("singlePlayerButton", "Play as Human");
    // singlePlayerButton.width = 0.5;
    singlePlayerButton.height = "60px";
    singlePlayerButton.color = "white";
    singlePlayerButton.cornerRadius = 20;
    singlePlayerButton.paddingBottom = 20;
    singlePlayerButton.onPointerUpObservable.add(function () {
        GAME.setup(GAME.SINGLE_PLAYER);
    });
    panel.addControl(singlePlayerButton);

    var trainMachineButton = BABYLON.GUI.Button.CreateSimpleButton("singlePlayerButton", "Train the Machine");
    // trainMachineButton.width = 0.5;
    trainMachineButton.height = "40px";
    trainMachineButton.color = "white";
    trainMachineButton.cornerRadius = 20;
    trainMachineButton.onPointerUpObservable.add(function () {
        GAME.setup(GAME.TRAINNING);
    });
    panel.addControl(trainMachineButton);

    // loop?
    scene.registerBeforeRender(function () {
        var deltaTime = instrumentation.frameTimeCounter.current * 0.0001;

        if (GAME.gameMode === GAME.SINGLE_PLAYER) {
            distanceScore.text = "📏 " + GAME.players[0].score.distancePassed.toFixed();
            speedScore.text = "🚀 " + GAME.players[0].score.speedReached.toFixed();
            obstaclesScore.text = "🎯 " + GAME.players[0].score.obstaclesPassed;

            singlePlayerButton.children[0].text = "try again...";
        }

        // rotate spirals
        for (var i = spirals.length - 1; i >= 0; i--) {
            spirals[i].rotate(BABYLON.Axis.Y, GAME.SPEED * 0.03 * deltaTime * (i % 2 ? 1 : 1.2));
        }
    });

    return scene;
}