
/**
 * @file A simple WebGL example drawing central Illinois style terrain
 * @author Eric Shaffer <shaffer1@illinois.edu>  
 */

/** @global The WebGL context */
var gl;

/** @global The HTML5 canvas we draw on */
var canvas;

/** @global A simple GLSL shader program */
var shaderProgram;

/** @global The Modelview matrix */
var mvMatrix = glMatrix.mat4.create();

/** @global The Projection matrix */
var pMatrix = glMatrix.mat4.create();

/** @global The Normal matrix */
var nMatrix = glMatrix.mat3.create();

/** @global A glMatrix vector to use for transformations */
var transformVec = glMatrix.vec3.create();    

// Initialize the vector....
glMatrix.vec3.set(transformVec,0.0,0.0,-2.0);

/** @global An object holding the geometry for a 3D terrain */
var myTerrain;

// View parameters
/** @global Location of the camera in world coordinates */
var eyePt = glMatrix.vec3.fromValues(0.0,-0.1,-0.6);
/** @global Direction of the view in world coordinates */
var viewDir = glMatrix.vec3.fromValues(0.0,0.0,-1.0);
/** @global Up vector for view matrix creation, in world coordinates */
var up = glMatrix.vec3.fromValues(0.0,1.0,0.0);
/** @global Location of a point along viewDir in world coordinates */
var viewPt = glMatrix.vec3.fromValues(0.0,0.0,0.0);

//Light parameters
/** @global Light position in VIEW coordinates */
var lightPosition = [0,3,3];
/** @global Ambient light color/intensity for Phong reflection */
var lAmbient = [0,0,0];
/** @global Diffuse light color/intensity for Phong reflection */
var lDiffuse = [1,1,1];
/** @global Specular light color/intensity for Phong reflection */
var lSpecular =[0,0,0];

//Material parameters
/** @global Ambient material color/intensity for Phong reflection */
var kAmbient = [1.0,1.0,1.0];
/** @global Diffuse material color/intensity for Phong reflection */
var kTerrainDiffuse = [205.0/255.0,163.0/255.0,63.0/255.0];
/** @global Specular material color/intensity for Phong reflection */
var kSpecular = [0.0,0.0,0.0];
/** @global Shininess exponent for Phong reflection */
var shininess = 23;
/** @global Edge color fpr wireframeish rendering */
var kEdgeBlack = [0.0,0.0,0.0];
/** @global Edge color for wireframe rendering */
var kEdgeWhite = [1.0,1.0,1.0];

//Aircraft Movement
/** @global  Speed of orientation */
var speedFactor = 0.001;
/** @global Roll degree of the aircraft */
var rollDegree = 0;
/** @global Pitch degree of the aircraft */
var pitchDegree = 0;


//-------------------------------------------------------------------------
/**
 * Sends Modelview matrix to shader
 */
function uploadModelViewMatrixToShader() {
  gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}

//-------------------------------------------------------------------------
/**
 * Sends projection matrix to shader
 */
function uploadProjectionMatrixToShader() {
  gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, 
                      false, pMatrix);
}

//-------------------------------------------------------------------------
/**
 * Generates and sends the normal matrix to the shader
 */
function uploadNormalMatrixToShader() {
  glMatrix.mat3.fromMat4(nMatrix,mvMatrix);
  glMatrix.mat3.transpose(nMatrix,nMatrix);
  glMatrix.mat3.invert(nMatrix,nMatrix);
  gl.uniformMatrix3fv(shaderProgram.nMatrixUniform, false, nMatrix);
}

//----------------------------------------------------------------------------------
/**
 * Sends projection/modelview matrices to shader
 */
function setMatrixUniforms() {
    uploadModelViewMatrixToShader();
    uploadNormalMatrixToShader();
    uploadProjectionMatrixToShader();
}

//----------------------------------------------------------------------------------
/**
 * Translates degrees to radians
 * @param {Number} degrees Degree input to function
 * @return {Number} The radians that correspond to the degree input
 */
function degToRad(degrees) {
        return degrees * Math.PI / 180;
}

//----------------------------------------------------------------------------------
/**
 * Creates a context for WebGL
 * @param {element} canvas WebGL canvas
 * @return {Object} WebGL context
 */
/**
 * Creates a context for WebGL
 * @param {element} canvas WebGL canvas
 * @return {Object} WebGL context
 */
function createGLContext(canvas) {
  var context = null;
  context = canvas.getContext("webgl");
  if (context) {
    context.viewportWidth = canvas.width;
    context.viewportHeight = canvas.height;
  } else {
    alert("Failed to create WebGL context!");
  }
  return context;
}

//----------------------------------------------------------------------------------
/**
 * Loads Shaders
 * @param {string} id ID string for shader to load. Either vertex shader/fragment shader
 */
function loadShaderFromDOM(id) {
var shaderScript = document.getElementById(id);
  
  // If we don't find an element with the specified id
  // we do an early exit 
  if (!shaderScript) {
    return null;
  }
    
  var shaderSource = shaderScript.text;
 
  var shader;
  if (shaderScript.type == "x-shader/x-fragment") {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if (shaderScript.type == "x-shader/x-vertex") {
    shader = gl.createShader(gl.VERTEX_SHADER);
  } else {
    return null;
  }
 
  gl.shaderSource(shader, shaderSource);
  gl.compileShader(shader);
 
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  } 
  return shader; 
}

//----------------------------------------------------------------------------------
/**
 * Setup the fragment and vertex shaders
 */
function setupShaders() {
  vertexShader = loadShaderFromDOM("shader-vs");
  fragmentShader = loadShaderFromDOM("shader-fs");
  
  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Failed to setup shaders");
  }

  gl.useProgram(shaderProgram);

  shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

  shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
  gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);

  shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
  shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
  shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");
  shaderProgram.uniformLightPositionLoc = gl.getUniformLocation(shaderProgram, "uLightPosition");    
  shaderProgram.uniformAmbientLightColorLoc = gl.getUniformLocation(shaderProgram, "uAmbientLightColor");  
  shaderProgram.uniformDiffuseLightColorLoc = gl.getUniformLocation(shaderProgram, "uDiffuseLightColor");
  shaderProgram.uniformSpecularLightColorLoc = gl.getUniformLocation(shaderProgram, "uSpecularLightColor");
  shaderProgram.uniformShininessLoc = gl.getUniformLocation(shaderProgram, "uShininess");    
  shaderProgram.uniformAmbientMaterialColorLoc = gl.getUniformLocation(shaderProgram, "uKAmbient");  
  shaderProgram.uniformDiffuseMaterialColorLoc = gl.getUniformLocation(shaderProgram, "uKDiffuse");
  shaderProgram.uniformSpecularMaterialColorLoc = gl.getUniformLocation(shaderProgram, "uKSpecular");    
  shaderProgram.uniformSpecularMaterialColorLoc = gl.getUniformLocation(shaderProgram, "uKSpecular");
    
  shaderProgram.uniformMaxZ = gl.getUniformLocation(shaderProgram, "maxZ");
  shaderProgram.uniformMinZ = gl.getUniformLocation(shaderProgram, "minZ");
  shaderProgram.uniformDisplayFog = gl.getUniformLocation(shaderProgram, "displayFog");
}

//-------------------------------------------------------------------------
/**
 * Sends material information to the shader
 * @param {Float32} alpha shininess coefficient
 * @param {Float32Array} a Ambient material color
 * @param {Float32Array} d Diffuse material color
 * @param {Float32Array} s Specular material color
 */
function setMaterialUniforms(alpha,a,d,s) {
  gl.uniform1f(shaderProgram.uniformShininessLoc, alpha);
  gl.uniform3fv(shaderProgram.uniformAmbientMaterialColorLoc, a);
  gl.uniform3fv(shaderProgram.uniformDiffuseMaterialColorLoc, d);
  gl.uniform3fv(shaderProgram.uniformSpecularMaterialColorLoc, s);
}

//-------------------------------------------------------------------------
/**
 * Sends light information to the shader
 * @param {Float32Array} loc Location of light source
 * @param {Float32Array} a Ambient light strength
 * @param {Float32Array} d Diffuse light strength
 * @param {Float32Array} s Specular light strength
 */
function setLightUniforms(loc,a,d,s) {
  gl.uniform3fv(shaderProgram.uniformLightPositionLoc, loc);
  gl.uniform3fv(shaderProgram.uniformAmbientLightColorLoc, a);
  gl.uniform3fv(shaderProgram.uniformDiffuseLightColorLoc, d);
  gl.uniform3fv(shaderProgram.uniformSpecularLightColorLoc, s);
}

//-------------------------------------------------------------------------
/**
 * Sends maxZ and minZ information to the shader
 * @param {Float32} maxZ of the teraain
 * @param {Float32} minZ of the terrain
 */
function setMaxMinZUnniforms(maxZ, minZ) {
    gl.uniform1f(shaderProgram.uniformMaxZ, maxZ);
    gl.uniform1f(shaderProgram.uniformMinZ, minZ);
}

//-------------------------------------------------------------------------
/**
 * Sends displayFog information to the shader
 * @param {Bool} Desplay fog simulation or not
 */
function setDisplayFogUnniforms() {
  if (document.getElementById("switch").checked) {
    gl.uniform1i(shaderProgram.uniformDisplayFog, true);
  }
  else {
    gl.uniform1i(shaderProgram.uniformDisplayFog, false);
  }
}

//----------------------------------------------------------------------------------
/**
 * Populate buffers with data
 */
function setupBuffers() {
    myTerrain = new Terrain(100,-0.8,0.8,-0.8,0.8);
    myTerrain.loadBuffers();
}

//----------------------------------------------------------------------------------
/**
 * Handle user interaction
 */
var currentlyPressedKeys = {};

function handleKeyDown(Event) {
    console.log ("Key down", event.key, " code ", event.code);
    if (event.key == "ArrowDown" || event.key == "ArrowUp" || event.key == "ArrowLeft" || event.key == "ArrowRight")
        event.preventDefault();
    
    if (event.key == "=") // "+"
        speedFactor += 0.001;
    if (event.key == "-")
        speedFactor -= 0.001;
    
    if (event.key == "ArrowUp")
        pitchDegree += 0.05;
    if (event.key == "ArrowDown")
        pitchDegree -= 0.05;
    if (event.key == "ArrowLeft")
        rollDegree -= 0.05;
    if (event.key == "ArrowRight")
        rollDegree += 0.05;
    
    if (event.key == "r") {
        //Reset all the value
        rollDegree = 0;
        pitchDegree = 0;
        speedFactor = 0.001;
        
        eyePt = glMatrix.vec3.fromValues(0.0,-0.1,-0.6);
        viewDir = glMatrix.vec3.fromValues(0.0,0.0,-1.0);
        up = glMatrix.vec3.fromValues(0.0,1.0,0.0);
    }
    
    currentlyPressedKeys[event.key] = true;
}

function handleKeyUp(event) {
    console.log ("Key up", event.key, " code ", event.code);
    currentlyPressedKeys[event.key] = false;
}


//----------------------------------------------------------------------------------
/**
 * Draw call that applies matrix transformations to model and draws model in frame
 */
function draw() { 
    //console.log("function draw()")
    var transformVec = glMatrix.vec3.create();
  
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // We'll use perspective 
    glMatrix.mat4.perspective(pMatrix,degToRad(45), 
                     gl.viewportWidth / gl.viewportHeight,
                     0.1, 200.0);
    
    var normal = glMatrix.vec3.create();
    var quaternion = glMatrix.quat.create();
    
    //Roll
    glMatrix.quat.setAxisAngle(quaternion, viewDir, degToRad(rollDegree));
    glMatrix.vec3.transformQuat(viewDir, viewDir, quaternion);
    glMatrix.vec3.transformQuat(up, up, quaternion);
    
    //Pitch
    glMatrix.vec3.cross(normal, viewDir, up);
    glMatrix.quat.setAxisAngle(quaternion, normal, degToRad(pitchDegree));
    glMatrix.vec3.transformQuat(viewDir, viewDir, quaternion);
    glMatrix.vec3.transformQuat(up, up, quaternion);
    
    //Movement: Control the speedFactor's domain
    if (speedFactor >= 0.006)
        speedFactor = 0.006;
    if (speedFactor < 0.001)
        speedFactor = 0.001;
    
    //Movement: Update eyePt
    var movement = glMatrix.vec3.create();
    glMatrix.vec3.scale(movement, viewDir, speedFactor);
    glMatrix.vec3.add(eyePt, eyePt, movement);
    
    // We want to look down -z, so create a lookat point in that direction    
    glMatrix.vec3.add(viewPt, eyePt, viewDir);
    // Then generate the lookat matrix and initialize the MV matrix to that view
    glMatrix.mat4.lookAt(mvMatrix,eyePt,viewPt,up);    
 
    //Draw Terrain
    glMatrix.vec3.set(transformVec,0.0,-0.5,-2.1);
    glMatrix.mat4.translate(mvMatrix, mvMatrix,transformVec);
    glMatrix.mat4.rotateX(mvMatrix, mvMatrix, degToRad(-75));
    setMatrixUniforms();
    setLightUniforms(lightPosition,lAmbient,lDiffuse,lSpecular);
    setMaxMinZUnniforms(myTerrain.maxZ, myTerrain.minZ);
    setDisplayFogUnniforms();
    
    if ((document.getElementById("polygon").checked) || (document.getElementById("wirepoly").checked))
    { 
      setMaterialUniforms(shininess,kAmbient,kTerrainDiffuse,kSpecular); 
      myTerrain.drawTriangles();
    }
    
    if(document.getElementById("wirepoly").checked)
    {
      setMaterialUniforms(shininess,kAmbient,kEdgeBlack,kSpecular);
      myTerrain.drawEdges();
    }

    if(document.getElementById("wireframe").checked)
    {
      setMaterialUniforms(shininess,kAmbient,kEdgeWhite,kSpecular);
      myTerrain.drawEdges();
    }
    
    // Update value in the document
    document.getElementById("speed").value = speedFactor;
    document.getElementById("pitch").value = pitchDegree;
    document.getElementById("roll").value = rollDegree;
    
    requestAnimationFrame(draw); 
}

//----------------------------------------------------------------------------------
/**
 * Startup function called from html code to start program.
 */
 function startup() {
  canvas = document.getElementById("myGLCanvas");
  gl = createGLContext(canvas);
  setupShaders();
  setupBuffers();
  gl.clearColor(1.0, 1.0, 1.0, 1.0);
  gl.enable(gl.DEPTH_TEST);

  document.onkeydown = handleKeyDown;
  document.onkeyup = handleKeyUp;
  draw();
  
}

