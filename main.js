var canvas;
var gl;
var program;

var points = [];
var colors = [];
var normals = [];
var numFaces;

var eye;
const at = vec3(0.0, 0.0, 0.0);
const up = vec3(0.0, 1.0, 0.0);
var aspect; //viewport aspect ratio
var modelView, projection;

var rotationStack = [];
var translationStack = [];

var clickedX, clickedY;


//lighting
var startinglightPosition = vec4(5.0, 5.0, 0.0, 0.0 );
var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0 );
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

var materialAmbient = vec4( 1.0, 1.0, 0.09, 1.0 );
var materialDiffuse = vec4( 1.0, 1.0, 0.09, 1.0 );
var materialSpecular = vec4( 0, 0, 0.0, 1.0 );
var materialShininess = 100.0;

var lightTheta = 0; //used in rotating point light source
var pointLightMovement = true;

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

    var nBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW );

    var vNormal = gl.getAttribLocation( program, "vNormal" );
    gl.vertexAttribPointer( vNormal, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vNormal);

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    modelViewLocation = gl.getUniformLocation(program, "modelViewMatrix");
    projectionLocation = gl.getUniformLocation(program, "projectionMatrix");
    normalMatrixLocation = gl.getUniformLocation(program, "normalMatrix");

    //lighting
    var ambientProduct = mult(lightAmbient, materialAmbient);
    var diffuseProduct = mult(lightDiffuse, materialDiffuse);
    var specularProduct = mult(lightSpecular, materialSpecular);

    var ambientLocation = gl.getUniformLocation(program, "ambientProduct");
    gl.uniform4fv(ambientLocation, flatten(ambientProduct));
    var diffuseLocation = gl.getUniformLocation(program, "diffuseProduct");
    gl.uniform4fv(diffuseLocation, flatten(diffuseProduct));
    var specularLocation = gl.getUniformLocation(program, "specularProduct");
    gl.uniform4fv(specularLocation, flatten(specularProduct));
    var shininessLocation = gl.getUniformLocation(program, "shininess");
    gl.uniform1f(shininessLocation, materialShininess);

    //Translation and Rotation Event Listeners
    //Mouse movement Event listeners
    canvas.addEventListener("mousedown", function(event){
        clickedX = event.clientX;
        clickedY = event.clientY;
        //console.log(clickedX + " , " + clickedY);

        var identity = identity4();
        var mouseButton = event.which;
        switch(mouseButton){
            case 1: //left mouse button (xy translation)
                //XYTranslationMatrix() pops the previous XYtranslation matrix
                //on each mouse move. But it has nothing to pop on initial move.
                //identity is fluff so its inital pop doesn't effect CTM.
                translationStack.push(identity);
                window.addEventListener("mousemove", XYTranslationMatrix);
                break;

            case 3: //right mouse button (rotations)
                //2 matrices for rotate so double the fluff
                rotationStack.push(identity);
                rotationStack.push(identity);
                window.addEventListener("mousemove", rotationMatrix);
                break;

            default:
                console.log("Dev Note: This mouse button has not been mapped.");
        }

    })
    //after releasing a mouse button, remove the movement listeners
    window.addEventListener("mouseup", function(event){
        window.removeEventListener("mousemove", XYTranslationMatrix);
        window.removeEventListener("mousemove", rotationMatrix);
    })

    //Z-movement event listener (up/down arrow keys) AND
    //resetting bunny location and orientation (r)
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

    if (pointLightMovement){
        lightTheta += 0.02;
    }

    var lightPosition = [0, 0, 0, 1];
    lightPosition[0] = startinglightPosition[0] * Math.cos(lightTheta) +
                    startinglightPosition[2] * Math.sin(lightTheta);
    lightPosition[1] = -startinglightPosition[1];
    lightPosition[2] = startinglightPosition[0] * Math.sin(lightTheta) +
                    startinglightPosition[2] * Math.cos(lightTheta);

/*
    //light moving formula for the spotlight later on ****KEEP IT****
    var lightPosition = [0, 0, 0, 1];
    lightPosition[0] = Math.cos(lightTheta) * startinglightPosition[0];
    lightPosition[1] = -startinglightPosition[1];
    lightPosition[2] = startinglightPosition[2];
    //console.log(lightPosition);
*/

    eye = vec3(0, 0, 10);
    modelViewMatrix = lookAt(eye, at, up);
    projectionMatrix = perspective(fovy, aspect, near, far);

    for(var i = 0; i < translationStack.length; i++){
        modelViewMatrix = mult(modelViewMatrix, translationStack[i]);
    }
    for(var i = 0; i < rotationStack.length; i++){
        modelViewMatrix = mult(modelViewMatrix, rotationStack[i]);
    }

    //lighting
    normalMatrix = [
        vec3(modelViewMatrix[0][0], modelViewMatrix[0][1], modelViewMatrix[0][2]),
        vec3(modelViewMatrix[1][0], modelViewMatrix[1][1], modelViewMatrix[1][2]),
        vec3(modelViewMatrix[2][0], modelViewMatrix[2][1], modelViewMatrix[2][2])
    ];
    gl.uniformMatrix4fv(modelViewLocation, false, flatten(modelViewMatrix) );
    gl.uniformMatrix4fv(projectionLocation, false, flatten(projectionMatrix) );
    gl.uniformMatrix3fv(normalMatrixLocation, false, flatten(normalMatrix) );
    gl.uniform4fv( gl.getUniformLocation(program, "lightPosition"),flatten(lightPosition) );



    gl.drawArrays(gl.TRIANGLES, 0, numFaces*3);
    requestAnimFrame(render);
}

function drawBunny(){
    var vertices = get_vertices();
    var faces = get_faces();
    numFaces = faces.length;
    //console.log(numFaces);

    for(var i = 0; i < numFaces; i++){
        //vertices/face
        var v1Index = faces[i][0] - 1;
        var v2Index = faces[i][1] - 1;
        var v3Index = faces[i][2] - 1;
        var v1 = vec3ToVec4( vertices[v1Index] );
        var v2 = vec3ToVec4( vertices[v2Index] );
        var v3 = vec3ToVec4( vertices[v3Index] );
        points.push(v1);
        points.push(v2);
        points.push(v3);

        //normal
        var u = subtract(v2, v1);
        var w = subtract(v3, v1);
        var normal = normalize(cross(w, u));
        normal = vec4(normal);
        normal[3] = 0.0;
        normals.push(normal);
        normals.push(normal);
        normals.push(normal);
    }
    //console.log(points.length);
    //console.log(normals.length);
}

function XYTranslationMatrix(event){
    var minimizer = 0.01;   //slows down translation speed to suit mouse movement
    var currentX = event.clientX;
    var currentY = event.clientY;
    var xTranslation = (currentX - clickedX) * minimizer;
    var yTranslation = (currentY - clickedY) * minimizer;

    var translationMatrix = translate(xTranslation, -yTranslation, 0.0);
    translationStack.pop();
    translationStack.push(translationMatrix);
}

function rotationMatrix(event){
    var minimizer = 0.1;
    var currentX = event.clientX;
    var currentY = event.clientY;
    //Translation as in mouse movement from clicked point (not bunny translation)
    var xTranslation = (currentX - clickedX) * minimizer;
    var yTranslation = (currentY - clickedY) * minimizer;

    //Pop off the previous 2 rotation matrices
    rotationStack.pop();
    rotationStack.pop();

    //Rotation about y-axis = left-right mouse movement
    var yAxis = vec3(0.0, 1.0, 0.0);
    var yRotationMatrix = rotate(xTranslation, yAxis);
    rotationStack.push(yRotationMatrix);

    //Rotation about x-axis = up-down mouse movement
    var xAxis = vec3(1.0, 0.0, 0.0);
    var xRotationMatrix = rotate(yTranslation, xAxis);
    rotationStack.push(xRotationMatrix);
}

function keyCommands(key){
    switch(key.keyCode){
        case 38:    //up arrow key: translate bunny away from camera on z-axis
            var translateMatrix = translate(0.0, 0.0, -1.0);
            translationStack.push(translateMatrix);
            break;

        case 40:    //down arrow key: translate bunny towards camera on z-axis
            var translateMatrix = translate(0.0, 0.0, 1.0);
            translationStack.push(translateMatrix);
            break;

        case 80:    //"p" starts/stops the point light rotation
            pointLightMovement = !pointLightMovement;
            break;

        case 82:    //"r" resets the bunny's location and orientation
            while(rotationStack.length != 0){
                rotationStack.pop();
            }
            while(translationStack.length != 0){
                translationStack.pop();
            }
            break;

        default:
            console.log("Dev Note: This button has not been mapped.");
            break;
    }
}
