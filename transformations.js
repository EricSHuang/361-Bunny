function vec3ToVec4(given){
    var x = given[0];
    var y = given[1];
    var z = given[2];
    var v4 = vec4(x, y, z, 1.0);
    //console.log(v4);
    return v4;
}

function identity4(){
    var identityMatrix = mat4();
    identityMatrix[0][0] = 1;
    identityMatrix[1][1] = 1;
    identityMatrix[2][2] = 1;
    identityMatrix[3][3] = 1;
    return identityMatrix;
}

//used in the point camera
function wireFrameCubeLines(){
    var vertices = [
        vec4(-0.5, -0.5,  1.5, 1.0),    //front bottom left
        vec4(-0.5,  0.5,  1.5, 1.0),    //front top left
        vec4(0.5,  0.5,  1.5, 1.0),     //front top right
        vec4(0.5, -0.5,  1.5, 1.0),     //front bottom right
        vec4(-0.5, -0.5, 0.5, 1.0),     //back bottom left
        vec4(-0.5,  0.5, 0.5, 1.0),     //back top left
        vec4(0.5,  0.5, 0.5, 1.0),      //back top right
        vec4( 0.5, -0.5, 0.5, 1.0)      //back bottom right
    ];

    var points = [];
    //front bottom-left to front top-left
    points.push(vertices[0]);
    points.push(vertices[1]);
    //front bottom-left to front bottom right
    points.push(vertices[0]);
    points.push(vertices[3]);
    //front bottom-left to back bottom-left
    points.push(vertices[0]);
    points.push(vertices[4]);
    //front top-left to front top-right
    points.push(vertices[1]);
    points.push(vertices[2]);
    //front top-left to back top-left
    points.push(vertices[1]);
    points.push(vertices[5]);
    //front top-right to front bottom-right
    points.push(vertices[2]);
    points.push(vertices[3]);
    //front top-right to back top-right
    points.push(vertices[2]);
    points.push(vertices[6]);
    //front bottom-right to back bottom-right
    points.push(vertices[3]);
    points.push(vertices[7]);
    //back top-left to back-top right
    points.push(vertices[5]);
    points.push(vertices[6]);
    //back top-left to back bottom-left
    points.push(vertices[5]);
    points.push(vertices[4]);
    //back top-right to back bottom-right
    points.push(vertices[6]);
    points.push(vertices[7]);
    //back bottom-left to back bottom-right
    points.push(vertices[4]);
    points.push(vertices[7]);

    //console.log(points.length);
    return points;
}
