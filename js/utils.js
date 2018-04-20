var createSpiral = function (name, radius, length, deltaTheta, deltaY, scene) {
    var myPoints = [];
    var myColors = [];
    var theta = 0;
    var Y = 0;

    for (var i = length - 1; i >= 0; i--) {
        myPoints.push(new BABYLON.Vector3(radius * Math.cos(theta), Y, radius * Math.sin(theta)));
        theta += deltaTheta;
        Y += deltaY;
        myColors.push(new BABYLON.Color4(1, 1, 1, (0.1 / length) * i));
    }

    var lines = BABYLON.MeshBuilder.CreateLines(name, {
        points: myPoints,
        colors: myColors
    }, scene);
    lines.isPickable = false;

    return lines;
};

/**
 * Randomize array element order in-place.
 * Using Durstenfeld shuffle algorithm.
 */
var shuffleArray = function (array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}

/**
 * HSV to RGB color conversion
 *
 * H runs from 0 to 360 degrees
 * S and V run from 0 to 100
 * 
 * Ported from the excellent java algorithm by Eugene Vishnevsky at:
 * http://www.cs.rit.edu/~ncs/color/t_convert.html
 */
function hsvToRgb(h, s, v) {
    var r, g, b;
    var i;
    var f, p, q, t;

    // Make sure our arguments stay in-range
    h = Math.max(0, Math.min(360, h));
    s = Math.max(0, Math.min(100, s));
    v = Math.max(0, Math.min(100, v));

    // We accept saturation and value arguments from 0 to 100 because that's
    // how Photoshop represents those values. Internally, however, the
    // saturation and value are calculated from a range of 0 to 1. We make
    // That conversion here.
    s /= 100;
    v /= 100;

    if (s == 0) {
        // Achromatic (grey)
        r = g = b = v;
        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    }

    h /= 60; // sector 0 to 5
    i = Math.floor(h);
    f = h - i; // factorial part of h
    p = v * (1 - s);
    q = v * (1 - s * f);
    t = v * (1 - s * (1 - f));

    switch (i) {
        case 0:
            r = v;
            g = t;
            b = p;
            break;

        case 1:
            r = q;
            g = v;
            b = p;
            break;

        case 2:
            r = p;
            g = v;
            b = t;
            break;

        case 3:
            r = p;
            g = q;
            b = v;
            break;

        case 4:
            r = t;
            g = p;
            b = v;
            break;

        default: // case 5:
            r = v;
            g = p;
            b = q;
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

BABYLON.Mesh.prototype.rotateAroundPivot = function(pivotPoint, axis, angle) {
    if(!this._rq) {
        this._rq = BABYLON.Quaternion.Identity();
    }		
    var _p = new BABYLON.Quaternion(this.position.x - pivotPoint.x, this.position.y - pivotPoint.y, this.position.z - pivotPoint.z, 0);
    axis.normalize();
    var _q = BABYLON.Quaternion.RotationAxis(axis,angle);  //form quaternion rotation		
    var _qinv = BABYLON.Quaternion.Inverse(_q);	
    var _pdash = _q.multiply(_p).multiply(_qinv);
    this.position = new BABYLON.Vector3(pivotPoint.x + _pdash.x, pivotPoint.y + _pdash.y, pivotPoint.z + _pdash.z);
    this.rotationQuaternion = this._rq.multiply(_q);
    this._rq = this.rotationQuaternion;
}