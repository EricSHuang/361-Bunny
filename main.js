var canvas;
var gl;
var program;

var points = [];
var colors = [];
var numFaces;

var eye;
const at = vec3(0.0, 0.0, 0.0);
const up = vec3(0.0, 1.0, 0.0);
var aspect; //viewport aspect ratio
var modelView, projection;

var stack = [];
var mouseIsDown = false;
var clickedX, clickedY;

window.onload = function init(){
    canvas = document.getElementById("gl-canvas");

    //Create the WebGL rendering context
    gl = WebGLUtils.setupWebGL(canvas);
    if(!gl){
        alert("WebGL isn't available.");
    }
    aspect = canvas.width / canvas.height;
    drawBunny();

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    //Shaders and attribute buffers
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    var cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

    var vColor = gl.getAttribLocation(program, "vColor");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    modelViewLocation = gl.getUniformLocation(program, "modelViewMatrix");
    projectionLocation = gl.getUniformLocation(program, "projectionMatrix");


    //Bunny X,Y,Z Translation Event Listeners

    //XY mouse movement listeners
    canvas.addEventListener("mousedown", function(event){
        //gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
        mouseIsDown = true;
        clickedX = event.clientX;
        clickedY = event.clientY;
        console.log(clickedX + " , " + clickedY);
        document.getElementById("mouseClickStatus").innerHTML = "clicked!";

        //XYTranslationMatrix() pops the previous XYtranslation matrix
        //on each mouse move. But it has nothing to pop on initial move,
        //so identity is fluff so its inital pop doesn't effect CTM.
        var identity = identity4();
        stack.push(identity);
        window.addEventListener("mousemove", XYTranslationMatrix);
    })
    window.addEventListener("mouseup", function(event){
        /*
        mouseIsDown = false;
        console.log("mouseup now");
        document.getElementById("mouseClickStatus").innerHTML = "not clicked";
        */
        window.removeEventListener("mousemove", XYTranslationMatrix);
    })

    //Z-movement event listener (up/down arrow keys)
    window.addEventListener("keydown", keyCommands);




    render();
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var near = 0.3;
    var far = 15.0;
    var radius = 10.0;   //distance from the origin
    var theta = 0.0;
    var phi = 0.0;
    var fovy = 45.0;

    eye = vec3(radius * Math.sin(theta) * Math.cos(phi),
                radius * Math.sin(theta) * Math.sin(phi),
                radius * Math.cos(theta));
    modelViewMatrix = lookAt(eye, at, up);
    projectionMatrix = perspective(fovy, aspect, near, far);

/*
    if (mouseIsDown){
        window.addEventListener("mousemove", XYTranslationMatrix);

        //document.getElementById("gl-canvas").onmousemove = function(event){
        //    XYTranslationMatrix(event)};
        //console.log("yy");

    }
*/

    for(var i = 0; i < stack.length; i++){
        modelViewMatrix = mult(stack[i] , modelViewMatrix);
    }

    gl.uniformMatrix4fv(modelViewLocation, false, flatten(modelViewMatrix));
    gl.uniformMatrix4fv(projectionLocation, false, flatten(projectionMatrix));

    gl.drawArrays(gl.TRIANGLES, 0, numFaces*3);
    requestAnimFrame(render);
}

function drawBunny(){
    var vertices = get_vertices();
    var faces = get_faces();
    numFaces = faces.length;
    console.log(numFaces);
    var tempBlueColor = [0.0, 0.0, 1.0, 1.0];

    for(var i = 0; i < numFaces; i++){
        var v1Index = faces[i][0] - 1;
        var v2Index = faces[i][1] - 1;
        var v3Index = faces[i][2] - 1;
        var v1 = vec3ToVec4( vertices[v1Index] );
        var v2 = vec3ToVec4( vertices[v2Index] );
        var v3 = vec3ToVec4( vertices[v3Index] );

        points.push(v1);
        colors.push(tempBlueColor);
        points.push(v2);
        colors.push(tempBlueColor);
        points.push(v3);
        colors.push(tempBlueColor);
    }
}

function XYTranslationMatrix(event){
    var minimizer = 0.01;   //slows down the translation to suit mouse movement
    var currentX = event.clientX;
    var currentY = event.clientY;
    var xTranslation = (currentX - clickedX) * minimizer;
    var yTranslation = (currentY - clickedY) * minimizer;

    var translationMatrix = translate(xTranslation, -yTranslation, 0.0);
    stack.pop();
    stack.push(translationMatrix);
    //return translationMatrix;
}

function keyCommands(key){
    switch(key.keyCode){
        case 38:    //up arrow key: translate bunny away from camera on z-axis
            var translateMatrix = translate(0.0, 0.0, -1.0);
            stack.push(translateMatrix);
            break;

        case 40:    //down arrow key: translate bunny towards camera on z-axis
            var translateMatrix = translate(0.0, 0.0, 1.0);
            stack.push(translateMatrix);
            break;

        default:
            console.log("Dev Note: This button has not been mapped.");
            break;
    }
}
