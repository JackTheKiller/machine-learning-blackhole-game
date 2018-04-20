var Game = function () {

    this.scenes = {};
    this.activeScene = 'menuScene';

    this.gameMode = null;
    this.players = [];

    this.distancePassed = 0;
    this.obstaclesPassed = 0;
    this.speedReached = 0;
    this.currentSpeed = 0;

    this.om;
    this.ga = new GeneticAlgorithm(10, 4);

    // constants

    this.SPEED = 700;
    this.ACCELERATION = 250;

    this.CYLINDER_DIAMETER = 8;
    this.CYLINDER_LENGTH = 100;

    this.SINGLE_PLAYER = 0;
    this.TRAINNING = 1;

}

Game.prototype = {
    
    setup: function (gameMode) {
        // menu buttons can be clicked when not in menu scene (?)
        if (this.activeScene == 'gameScene') return;

        this.gameMode = gameMode;

        var scene = GAME.scenes.gameScene;

        switch (this.gameMode) {

            case GAME.SINGLE_PLAYER:
                this.players.splice(0, this.players.length);
                this.players = [new Player(scene.cameras[0], "white", true)];
                break;

            case GAME.TRAINNING:
                this.players.splice(0, this.players.length);
                this.players = new Array(this.ga.max_units);
                var bodyModel = scene.getMeshByName("discReticle");

                for (let i = this.players.length - 1; i >= 0; i--) {
                    var rgb = hsvToRgb((360 / (this.players.length - 1)) * i, 100, 100);
                    var color = rgbToHex(rgb[0], rgb[1], rgb[2]);

                    this.players[i] = new Player(bodyModel.clone("Bot " + (i + 1)), color);
                    this.players[i].body.position.z = scene.cameras[0].position.z + 2;
                    this.players[i].index = i;
                    var label = new BABYLON.GUI.Ellipse();
                    label.color = color;
                    label.height = 0.06;
                    label.width = 0.06;
                    label.thickness = 0.5;
                    scene.advancedTexture.addControl(label);
                    label.linkWithMesh(this.players[i].body);

                    var text = new BABYLON.GUI.TextBlock();
                    text.text = this.players[i].body.name;
                    text.color = color;
                    label.addControl(text);

                    var line = new BABYLON.GUI.Line();
                    line.alpha = 0.2;
                    line.lineWidth = 2;
                    line.dash = [5, 5];
                    scene.advancedTexture.addControl(line);
                    line.linkWithMesh(this.players[i].body);
                    line.connectedControl = label;
                    this.players[i].guideLine = line;
                }

                this.ga.createPopulation();

                GAME.scenes.menuScene.advancedTexture.dispose();
                scene.cameras[0].fov = 2;
                bodyModel.setEnabled(false);

                document.getElementsByClassName("single-player")[0]
                    .classList.remove("single-player");
                window.dispatchEvent(new Event('resize'));
                break;
        }

        if (this.om === undefined) {
            this.om = new ObstaclesManager(scene);
        }

        this.reset();

        this.activeScene = 'gameScene';
    },

    reset: function () {
        this.distancePassed = 0;
        this.obstaclesPassed = 0;
        this.speedReached = 0;
        this.currentSpeed = this.SPEED;

        for (let i = this.players.length - 1; i >= 0; i--) {
            this.players[i].reset();
        }

        this.om.reset();

        GAME.scenes.gameScene.cameras[0].position.x = 0;
        GAME.scenes.gameScene.cameras[0].position.y = 0;

        GAME.scenes.gameScene.getMeshByName("discReticle")
            .setAbsolutePosition(GAME.scenes.gameScene.cameras[0].position);
    },

    showMenu: function () {
        this.activeScene = 'menuScene';
    }
};