function vec3ToVec4(given){
    var x = given[0];
    var y = given[1];
    var z = given[2];
    var v4 = vec4(x, y, z, 1.0);
    //console.log(v4);
    return v4;
}
