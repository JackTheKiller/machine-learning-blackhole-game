var GAME = new Game();

window.addEventListener('DOMContentLoaded', function () {

    var canvas = document.getElementById("render-canvas");
    var engine = new BABYLON.Engine(canvas, true);

    GAME.scenes = {
        'menuScene': createMenuScene(engine),
        'gameScene': createGameScene(engine)
    };

    engine.runRenderLoop(function () {
        GAME.scenes[GAME.activeScene].render();

        var fpsLabel = document.getElementById("fps");
        fpsLabel.innerHTML = engine.getFps().toFixed() + " fps";

        if (GAME.gameMode == GAME.TRAINNING) {
            updateStats();
        }
    });

    window.addEventListener("resize", function () { // Watch for browser/canvas resize events
        engine.resize();
    });

    // Handlebars setup
    var source = document.getElementById("bots-template").innerHTML;
    GAME.template = Handlebars.compile(source);

    Handlebars.registerHelper('toFixed', function (value, decimals) {
        if (value)
            return value.toFixed(decimals);
        else return 0;
    });

    var updateStats = function () {
        var html = GAME.template({
            lastGeneration: GAME.ga.iteration - 1,
            currentGeneration: GAME.ga.iteration,
            bestGeneration: GAME.ga.best_population,
            bestScore: GAME.ga.best_score,
            bots: GAME.players
        });
        document.getElementById("bot-stats").innerHTML = html;
    }
});