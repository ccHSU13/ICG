
/**
 * @file A simple WebGL example drawing a triangle with colors
 * @author Eric Shaffer <shaffer1@eillinois.edu>  
 */

/** @global The WebGL context */
var gl;

/** @global The WebGL context */
var gl2;

/** @global The HTML5 canvas we draw on */
var canvas;

/** @global The HTML5 canvas we draw on */
var canvas2;

/** @global A simple GLSL shader program */
var shaderProgram;

/** @global The WebGL buffer holding the triangle */
var vertexPositionBuffer;

/** @global The WebGL buffer holding the vertex colors */
var vertexColorBuffer;

/** @global The ModelView matrix contains any modeling and viewing transformations */
var mvMatrix = glMatrix.mat4.create();

/** @global The Projection matrix contains the ortho or perspective metrix we use */
var pMatrix = glMatrix.mat4.create();

/** @global Records time last frame was rendered */
var previousTime = 0;

/** @global Time since last deformation of circle */
var rotAngle = 0;

/** @global Bool to determine reverse or not */
var reverse = false;

/** @global Scale the logo */
var scale = 0;

/** @global Determine load wich animation */
var change = false;

/** @global Ramdonly generate color */
var colorR = 0.9;
var colorG = 0.6;

/**
 * Translates degrees to radians
 * @param {Number} degrees Degree input to function
 * @return {Number} The radians that correspond to the degree input
 */
function degToRad(degrees) {
        return degrees * Math.PI / 180;
}

/**
 * Creates a context for WebGL
 * @param {element} canvas WebGL canvas
 * @return {Object} WebGL context
 */
function createGLContext(canvas) {
  var context = null;
  context = canvas.getContext("webgl2");
  if (context) {
    context.viewportWidth = canvas.width;
    context.viewportHeight = canvas.height;
  } else {
    alert("Failed to create WebGL context!");
  }
  return context;
}

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
    
  // Get the positions of the atytributes and uniforms in the shader program     
  shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
  shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor"); 
  shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMvMatrix"); 
  shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
  //Enable the attribute variables we will send data to....     
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
  gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);
}

/**
 * Populate vertex buffer with data
  @param {number} number of vertices to use around the circle boundary
 */
function loadLogo(scale) {
  //Generate the vertex positions    
  vertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
  var triangleVertices = []
  if (!change) {
    //Triangle Vertices of the logo
    triangleVertices = [
        //Top
        -0.4,  0.3, 0.0,
        -0.4,  0.6, 0.0,
        -0.2,  0.3, 0.0,
        -0.2,  0.3, 0.0,
        -0.4,  0.6, 0.0,
        -0.2,  0.6, 0.0,

        -0.2,  0.6, 0.0,
        -0.2,  0.3, 0.0,
         0.2,  0.6, 0.0,
         0.2,  0.6, 0.0,
         0.2,  0.3, 0.0,
        -0.2,  0.3, 0.0,

         0.2,  0.3, 0.0,
         0.2,  0.6, 0.0,
         0.4,  0.6, 0.0,
         0.4,  0.6, 0.0,
         0.4,  0.3, 0.0,
         0.2,  0.3, 0.0,

         //Body
        -0.2,  0.3, 0.0,
        -0.2,  0.0, 0.0,
         0.2,  0.3, 0.0,
         0.2,  0.3, 0.0,
         0.2,  0.0, 0.0,
        -0.2,  0.0, 0.0,

        -0.2,  0.0, 0.0,
        -0.2, -0.3, 0.0,
         0.2,  0.0, 0.0,
         0.2,  0.0, 0.0,
         0.2, -0.3, 0.0,
        -0.2, -0.3, 0.0,

         //Bottom
        -0.4, -0.3, 0.0,
        -0.4, -0.6, 0.0,
        -0.2, -0.3, 0.0,
        -0.2, -0.3, 0.0,
        -0.4, -0.6, 0.0,
        -0.2, -0.6, 0.0,

        -0.2, -0.6, 0.0,
        -0.2, -0.3, 0.0,
         0.2, -0.6, 0.0,
         0.2, -0.6, 0.0,
         0.2, -0.3, 0.0,
        -0.2, -0.3, 0.0,

         0.2, -0.3, 0.0,
         0.2, -0.6, 0.0,
         0.4, -0.6, 0.0,
         0.4, -0.6, 0.0,
         0.4, -0.3, 0.0,
         0.2, -0.3, 0.0,
        ];

    for (var i = 0; i < triangleVertices.length; i++) {
      if( (i+1) % 3 != 0) {
        triangleVertices[i] *= scale;
      }
    }
  }
  
  else {
    triangleVertices = [
        -0.3, -0.3, 0.0,
        -0.3,  0.3, 0.0,
         0.3,  0.3, 0.0,
         
         0.3,  0.3, 0.0,
         0.3, -0.3, 0.0,
        -0.3, -0.3, 0.0
        ];
        
    for (var i = 0; i < triangleVertices.length; i++) {
      if( (i+1) % 3 != 0) {
        if (i < 9)
          triangleVertices[i] -= scale;
        else
        triangleVertices[i] += scale;
      }
    }
  }
    
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVertices), gl.DYNAMIC_DRAW);
  vertexPositionBuffer.itemSize = 3;
  vertexPositionBuffer.numberOfItems = triangleVertices.length/3;
}

/**
 * Populate color buffer with data
  @param {number} number of vertices to use around the circle boundary
 */
function loadLogoColors() {
  vertexColorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
  colors =[]
  
  if (!change) {
    // Set the color of Buffer 
    for (var i = 0; i < vertexPositionBuffer.numberOfItems; i++) {
      colors.push(250/255);
      colors.push(92/255);
      colors.push(0.0);
      colors.push(1.0);
    }
  }
  
  else {
    for (var i = 0; i < vertexPositionBuffer.numberOfItems; i++) {
      if (reverse)
      {
        colors.push(colorR);
        colors.push(colorG);
        colors.push(0.0);
        colors.push(0.8);
      }

      else
      {
        colors.push(0.1);
        colors.push(colorR);
        colors.push(colorG);
        colors.push(0.6);
      }
      
    }
  }
  
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    vertexColorBuffer.itemSize = 4;
    vertexColorBuffer.numItems = vertexPositionBuffer.numberOfItems;
}

/**
 * Populate buffers with data
   @param {number} number of vertices to use around the circle boundary
 */
function setupLogoBuffers() {
  //Generate the vertex positions    
  loadLogo(scale);

  //Generate the vertex colors
  loadLogoColors(); 
}

/**
 * Initialize modelview and projection matrices
 */
function setupUniforms(){
    glMatrix.mat4.ortho(pMatrix,-1,1,-1,1,-1,1);
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix); 
    
    // Send the current  ModelView matrix to the vertex shader
    glMatrix.mat4.identity(mvMatrix);
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix); 
}

/**
 * Draw model...render a frame
 */
function drawLogo() { 
  //Change the scence
  change = document.getElementById("M").checked;
  
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight); 
  gl.clear(gl.COLOR_BUFFER_BIT);

  // If these buffers don't change, you can set the atribute pointer just once at 
  //  rather than each frame      
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 
                         vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, 
                            vertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
  // Send the current  ModelView matrix to the vertex shader
  gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
  
  // Render the triangle    
  gl.drawArrays(gl.TRIANGLES, 0, vertexPositionBuffer.numberOfItems);
}

/**
 * Function updates geometry and repeatedly renders frames.
 */
 function animate(now) {
    drawLogo();
     
    // Convert the time to seconds
    now *= 0.001;
    // Subtract the previous time from the current time
    var deltaTime = now - previousTime;
    // Remember the current time for the next frame.
    previousTime = now;

    //Update geometry to rotate speed degrees per second

    rotAngle += 90 * deltaTime;
    if (rotAngle > 360.0) {
      rotAngle = 0;
      if (reverse){
        reverse = false;
        colorR = Math.random()* 0.5;
      } 
      else {
        reverse = true;
        colorG = Math.random()* 0.7;
      }        
    }

    if (!change) {
      //Clockwise or anticlockwise
      if (reverse) {
        glMatrix.mat4.fromZRotation(mvMatrix, degToRad(-rotAngle));
        scale = (360-rotAngle)/360;
      }

      else {
        glMatrix.mat4.fromZRotation(mvMatrix, degToRad(rotAngle));
        scale = rotAngle/360;
      }
      // Update deformation
      loadLogo(scale);
      loadLogoColors();
    }
   
    else {
      mvMatrix = glMatrix.mat4.create();
      if (!reverse)
        scale = 0.7*rotAngle/360;
      else 
        scale = 0.7*(360-rotAngle)/360;
      loadLogo(scale);
      loadLogoColors();
    }
    
   
    // ....next frame
    requestAnimationFrame(animate);
}

/** Swtich the scence */
function changeScence() {
  var checkbox = document.getElementBid("switch");
  requestAnimFrame(changeScence);
  
  if (checkbox.check) {
    change = true;
  }
  else {
    change = false;
  }
  
}

/**
 * Startup function called from html code to start program.
 */
 function startup() {
  console.log("No bugs so far...");
  canvas = document.getElementById("myGLCanvas");
  gl = createGLContext(canvas);
  setupShaders(); 
  setupLogoBuffers();
  setupUniforms();
  gl.clearColor(1.0, 1.0, 1.0, 1.0);
  requestAnimationFrame(animate);
  changeScence();
}

