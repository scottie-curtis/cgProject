//https://mdn.github.io/webgl-examples/tutorial/sample5/
//A number which is basically 0
const minDifference = 0.00000000001

var cubeRotation = 0.0;

let buffers
let vertexCount

main();

//
// Start here
//
function main() {
  const canvas = document.querySelector('#glCanvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

  // If we don't have a GL context, give up now

  if (!gl) {
    alert('Unable to initialize WebGL. Your browser or machine may not support it.');
    return;
  }

  // Vertex shader program

  const vsSource = `
    attribute vec4 aVertexPosition;
    attribute vec4 aVertexColor;

    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;

    varying lowp vec4 vColor;

    void main(void) {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
      vColor = aVertexColor;
    }
  `;

  // Fragment shader program

  const fsSource = `
    varying lowp vec4 vColor;

    void main(void) {
      gl_FragColor = vColor;
    }
  `;

  // Initialize a shader program; this is where all the lighting
  // for the vertices and so forth is established.
  const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

  // Collect all the info needed to use the shader program.
  // Look up which attributes our shader program is using
  // for aVertexPosition, aVertexColor and also
  // look up uniform locations.
  const programInfo = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
      vertexColor: gl.getAttribLocation(shaderProgram, 'aVertexColor'),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
      modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
    }
  };

  // Here's where we call the routine that builds all the
  // objects we'll be drawing.
  setModel("M 0 0 L 10 10 20 10 L 0 20 Z", "M 0 0 L 10 10 20 10 L 0 20 Z", 2, 1)

  var then = 0;

  // Draw the scene repeatedly
  function render(now) {
    now *= 0.001;  // convert to seconds
    const deltaTime = now - then;
    then = now;

    drawScene(gl, programInfo, buffers, deltaTime);

    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}

//
// Draw the scene.
//
function drawScene(gl, programInfo, buffers, deltaTime) {
  gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
  gl.clearDepth(1.0);                 // Clear everything
  gl.enable(gl.DEPTH_TEST);           // Enable depth testing
  gl.depthFunc(gl.LEQUAL);            // Near things obscure far things
  gl.lineWidth(5)

  // Clear the canvas before we start drawing on it.

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Create a perspective matrix, a special matrix that is
  // used to simulate the distortion of perspective in a camera.
  // Our field of view is 45 degrees, with a width/height
  // ratio that matches the display size of the canvas
  // and we only want to see objects between 0.1 units
  // and 100 units away from the camera.
  const zNear = 0.1;
  const zFar = 100.0;
  const projectionMatrix = mat4.create();

  // note: glmatrix.js always has the first argument
  // as the destination to receive the result.
  mat4.ortho(projectionMatrix,
                   -2, 2, -1, 3,
                   zNear,
                   zFar);
  //mat4.rotate(projectionMatrix, projectionMatrix, -1, [1, 0, 0])

  // Set the drawing position to the "identity" point, which is
  // the center of the scene.
  const modelViewMatrix = mat4.create();

  // Now move the drawing position a bit to where we want to
  // start drawing the square.

  mat4.translate(modelViewMatrix,     // destination matrix
                 modelViewMatrix,     // matrix to translate
                 [-0.0, 0.0, -6.0]);  // amount to translate
  mat4.rotate(modelViewMatrix, modelViewMatrix, parseFloat(document.getElementById("vAngle").value) / 180 * Math.PI, [1, 0, 0]);
  mat4.rotate(modelViewMatrix,  // destination matrix
              modelViewMatrix,  // matrix to rotate
              cubeRotation,     // amount to rotate in radians
              [0, 1, 0]);
  

  // Tell WebGL how to pull out the positions from the position
  // buffer into the vertexPosition attribute
  {
    const numComponents = 3;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexPosition,
        numComponents,
        type,
        normalize,
        stride,
        offset);
    gl.enableVertexAttribArray(
        programInfo.attribLocations.vertexPosition);
  }

  // Tell WebGL how to pull out the colors from the color buffer
  // into the vertexColor attribute.
  {
    const numComponents = 4;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexColor,
        numComponents,
        type,
        normalize,
        stride,
        offset);
    gl.enableVertexAttribArray(
        programInfo.attribLocations.vertexColor);
  }

  // Tell WebGL which indices to use to index the vertices
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);

  // Tell WebGL to use our program when drawing

  gl.useProgram(programInfo.program);

  // Set the shader uniforms

  gl.uniformMatrix4fv(
      programInfo.uniformLocations.projectionMatrix,
      false,
      projectionMatrix);
  gl.uniformMatrix4fv(
      programInfo.uniformLocations.modelViewMatrix,
      false,
      modelViewMatrix);

  {
    const type = gl.UNSIGNED_SHORT;
    const offset = 0;
    gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
  }

  // Update the rotation for the next draw

  cubeRotation += deltaTime * parseFloat(document.getElementById("rSpeed").value ? document.getElementById("rSpeed").value : "0");
}

//
// Initialize a shader program, so WebGL knows how to draw our data
//
function initShaderProgram(gl, vsSource, fsSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  // Create the shader program

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  // If creating the shader program failed, alert

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
    return null;
  }

  return shaderProgram;
}

//
// creates a shader of the given type, uploads the source and
// compiles it.
//
function loadShader(gl, type, source) {
  const shader = gl.createShader(type);

  // Send the source to the shader object

  gl.shaderSource(shader, source);

  // Compile the shader program

  gl.compileShader(shader);

  // See if it compiled successfully

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

function setModel(data1, data2, perspectiveDistance, extrusionDistance) {
    //Display the path data in the SVGs
    let path1 = document.getElementById("pathTest1");
    path1.setAttribute("d", data1)
    let path2 = document.getElementById("pathTest2");
    path2.setAttribute("d", data2)

    //Collect the points of the first path and scale them to fit vertically
    let minX = null
    let minY = null
    let maxX = null
    let maxY = null
    let points1 = []
    //For every point command
    for (let i of path1.getPathData({normalize: true})) {
        //If it's a curve point
        if (i.type === "C") {
            //Invert the Y to go from SVG coordinates to "real" coordinates
            i.values[5] *= -1
            //Collect mins and maxes
            if (minX == null || minX > i.values[4]) {
                minX = i.values[4]
            }
            if (minY == null || minY > i.values[5]) {
                minY = i.values[5]
            }
            if (maxX == null || maxX < i.values[4]) {
                maxX = i.values[4]
            }
            if (maxY == null || maxY < i.values[5]) {
                maxY = i.values[5]
            }
            //Save the values
            points1.push(i.values[4], i.values[5])
        } else if (i.type == "M" || i.type == "L") {
          //Invert the Y to go from SVG coordinates to "real" coordinates
            i.values[1] *= -1
            //Collect mins and maxes
            if (minX == null || minX > i.values[0]) {
                minX = i.values[0]
            }
            if (minY == null || minY > i.values[1]) {
                minY = i.values[1]
            }
            if (maxX == null || maxX < i.values[0]) {
                maxX = i.values[0]
            }
            if (maxY == null || maxY < i.values[1]) {
                maxY = i.values[1]
            }
            //Save the values
            points1.push(i.values[0], i.values[1])
        }
    }
    //Calculate the (vertical) range
    //let maxScale = Math.max(maxX - minX, maxY - minY)
    let scaleFactor = maxY - minY
    //Set the view box of the preview elements
    document.getElementById("svgViewer1").setAttribute("viewBox", `${minX} ${-minY - scaleFactor} ${maxX} ${-minY}`)
    //Scale the points to fit the right range
    for (let i in points1) {
      //Translate to set the bottom middle point to 0
      if (i % 2 == 0) {
          points1[i] -= minX
          points1[i] -= 0.5 * (maxX - minX)
      } else {
        points1[i] -= minY
      }
      //Divide by the range, making the vertical range now [0, 1]
      points1[i] /= scaleFactor
    }
    console.log(points1)
    console.log(earcut(points1))

    //Do the exact same thing, but for the second profile
    //Collect the points of the second path and scale them to fit vertically
    minX = null
    minY = null
    maxX = null
    maxY = null
    let points2 = []
    //For every point command
    for (let i of path2.getPathData({normalize: true})) {
        //If it's a curve point
        if (i.type === "C") {
            //Invert the Y to go from SVG coordinates to "real" coordinates
            i.values[5] *= -1
            //Collect mins and maxes
            if (minX == null || minX > i.values[4]) {
                minX = i.values[4]
            }
            if (minY == null || minY > i.values[5]) {
                minY = i.values[5]
            }
            if (maxX == null || maxX < i.values[4]) {
                maxX = i.values[4]
            }
            if (maxY == null || maxY < i.values[5]) {
                maxY = i.values[5]
            }
            //Save the values
            points2.push(i.values[4], i.values[5])
        } else if (i.type == "M" || i.type == "L") {
          //Invert the Y to go from SVG coordinates to "real" coordinates
            i.values[1] *= -1
            //Collect mins and maxes
            if (minX == null || minX > i.values[0]) {
                minX = i.values[0]
            }
            if (minY == null || minY > i.values[1]) {
                minY = i.values[1]
            }
            if (maxX == null || maxX < i.values[0]) {
                maxX = i.values[0]
            }
            if (maxY == null || maxY < i.values[1]) {
                maxY = i.values[1]
            }
            //Save the values
            points2.push(i.values[0], i.values[1])
        }
    }
    //Calculate the (vertical) range
    //let maxScale = Math.max(maxX - minX, maxY - minY)
    scaleFactor = maxY - minY
    //Set the view box of the preview elements
    document.getElementById("svgViewer2").setAttribute("viewBox", `${minX} ${-minY - scaleFactor} ${maxX} ${-minY}`)
    //Scale the points to fit the right range
    for (let i in points2) {
        //Translate to set the bottom middle point to 0
        if (i % 2 == 0) {
            points2[i] -= minX
            points2[i] -= 0.5 * (maxX - minX)
        } else {
          points2[i] -= minY
        }
        //Divide by the range, making the vertical range now [0, 1]
        points2[i] /= scaleFactor
    }
    console.log(points2)
    console.log(earcut(points2))

    let vertexPoints = []
    let colorPoints = []
    let indices = []

    //Run the core loops
    clipProfileToProfile(points1, points2, vertexPoints, colorPoints, indices, false)
    console.log("Did first one")
    clipProfileToProfile(points2, points1, vertexPoints, colorPoints, indices, true)

    /*let backPoints = []

    for (let i = 0; i < points.length; i += 2) {
        backPoints.push(points[i] * (extrusionDistance + perspectiveDistance) / perspectiveDistance)
        backPoints.push((points[i + 1] + 1) * (extrusionDistance + perspectiveDistance) / perspectiveDistance - 1)
    }

    console.log(backPoints)

    
    for (let i in points) {
        vertexPoints.push(points[i])
        if (i % 2 == 1) {
            vertexPoints.push(0.5 * extrusionDistance)
            colorPoints.push(1.0, 0.0, 0.0, 1.0)
        }
    }

    for (let i in backPoints) {
        vertexPoints.push(backPoints[i])
        if (i % 2 == 1) {
            vertexPoints.push(-0.5 * extrusionDistance)
            colorPoints.push(0.0, 1.0, 0.0, 1.0)
        }
    }

    for (let i in points) {
        vertexPoints.push(points[i])
        if (i % 2 == 1) {
            vertexPoints.push(0.5 * extrusionDistance)
            colorPoints.push(1.0, 1.0, 1.0, 1.0)
        }
    }

    indices.push.apply(indices, earcut(points))
    for (let i = 0; i < points.length / 2; i++) {
        indices.push(i)
        indices.push((i + 1) % (points.length / 2))
        indices.push(i + points.length / 2)

        indices.push((i + 1) % (points.length / 2))
        indices.push(i + points.length / 2)
        indices.push(((i + 1) % (points.length / 2)) + points.length / 2)
    }
    for (let i of earcut(backPoints)) {
        indices.push(i + points.length / 2)
    }
    for (let i of earcut(points)) {
        indices.push(i + points.length)
    }*/

    const canvas = document.querySelector('#glCanvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

    /*
    console.log(vertexPoints)
    console.log(colorPoints)
    console.log(indices)
    */

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexPoints), gl.STATIC_DRAW);
    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colorPoints), gl.STATIC_DRAW);
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    buffers = {
        position: positionBuffer,
        color: colorBuffer,
        indices: indexBuffer,
    }

    vertexCount = indices.length
}

//Core intersection loop
function clipProfileToProfile(points1, points2, vertexPoints, colorPoints, indices, switchXAndZ) {
  //Iterate through each line segment in the first profile
  //For each one, draw the second profile and clip to the range of the segment
  //From these, generate the corresponding 3D points
  for (let i = 0; i < points1.length; i += 2) {
    //Keeps an array of objects representing polygons
    let polygons = []
    //The upper an lower boundaries of this line segment
    minY = Math.min(points1[(i + 1) % points1.length], points1[(i + 3) % points1.length])
    maxY = Math.max(points1[(i + 1) % points1.length], points1[(i + 3) % points1.length])
    console.log(minY, maxY)
    //Entered is treated as an enum tracking whether we've entered the range.
    // entered = 0 means we haven't
    // entered = 1 means we entered from the top
    // entered = -1 means we entered from the bottom
    //We start at 1 in case the entire second profile is contained within the range
    //Below, we set it to 0 if we can start outside the range
    let entered = 1
    //Initialize a Polygon object for the first run
    let polygon = {
      points: [], //Contains a flat array of the points which make up the polygon
      minCrossings: [], //Contains an array of objects of where this profile intersects with minY and the index in the polygon
      maxCrossings: [] //Same as above but for max
    }
    //Try to start with a point outside the range if possible
    let indexOffset = 0
    for (let j = 0; j < points2.length; j += 2) {
      if (points2[j + 1] > maxY || points2[j + 1] < minY) {
        indexOffset = j
        entered = 0
        break
      }
    }
    //If we're starting inside the range, push the first point now because the loop doesn't handle that
    if (entered != 0) {
      let trimmed = trimPoints(points2[0], points2[1], points2[2], points2[3], minY, maxY)
      polygon.points.push(trimmed[0], trimmed[1])
    }
    console.log(entered)
    console.log(indexOffset)
    //Finally, actually loop through the second profile and do the drawing stuff
    for (let j = 0; j < points2.length; j += 2) {
      //We do this because the indices may exceed the length of the array, and we want to loop to the start
      // and I don't want to have to paste this logic every time we use an index
      let j0 = (j + indexOffset) % points2.length
      let j1 = (j + indexOffset + 1) % points2.length
      let j2 = (j + indexOffset + 2) % points2.length
      let j3 = (j + indexOffset + 3) % points2.length
      //Check if this line segment crosses either boundary
      let crossesTop = intervalIncludes(points2[j1], points2[j3], maxY)
      let crossesBottom = intervalIncludes(points2[j1], points2[j3], minY)
      //If it crosses both
      if (crossesTop && crossesBottom) {
        //Clip the points to the range
        let clipped = trimPoints(points2[j0], points2[j1], points2[j2], points2[j3], minY, maxY)
        //If this is actually outside the range, something is wrong... Throw an error
        if (clipped == null) {
          throw new Error("What the heck, I thought this segment crossed top and bottom, but it was outside the range!")
        }
        //Add points to the polygon points list as needed
        // If we've made a polygon already, we only need the second point, as the first is already there.
        if (entered == 0) {
          //Note that this is some syntax sugar to turn an array into a series of arguments
          polygon.points.push(...clipped)
        } else {
          polygon.points.push(clipped[2], clipped[3])
        }

        //Update the arrays that deal with crossings
        //If the first point is the higher one, we know the second hits the min and the first hits the max
        // Note: there's always the chance that the clipped line has the same y value, because maxY roughly equals minY.
        // This handles that case by still doing the crossings and stuff, because that represents a horizontal line
        if (clipped[1] > clipped[3]) {
          //We know that the last point in the array now represents crossing the min, and the penultimate point represents crossing the max
          polygon.minCrossings.push({
            x: clipped[2],
            i: polygon.points.length - 2
          })
          polygon.maxCrossings.push({
            x: clipped[0],
            i: polygon.points.length - 4
          })
        } else {
          //Same as above but switched
          polygon.minCrossings.push({
            x: clipped[0],
            i: polygon.points.length - 4
          })
          polygon.maxCrossings.push({
            x: clipped[2],
            i: polygon.points.length - 2
          })
        }

        //If we hadn't started a polygon yet, note that we have now
        if (entered == 0) {
          if (points2[j1] > maxY) {
            entered = 1
          } else {
            entered = -1
          }
        } else { //If we've already started a polygon, finalize it and start a new one
          entered = 0
          addPolygon(polygons, polygon)
          polygon = {
            points: [],
            minCrossings: [],
            maxCrossings: []
          }
        }
      } else if (crossesTop) {
        //This part is very similar to the above but WAY shorter because it's only one side and I comment less
        let clipped = trimPoints(points2[j0], points2[j1], points2[j2], points2[j3], minY, maxY)
        if (clipped == null) {
          throw new Error("What the heck, I thought this segment crossed top, but it was outside the range!")
        }

        //If this starts on the max and continues up, don't count it
        if (Math.abs(points2[j1] - maxY) < minDifference && points2[j3] >= points2[j1]) {
          continue
        }

        //If we haven't started a poly yet, mark the start and ends
        if (entered == 0) {
          polygon.points.push(...clipped)
        } else {
          polygon.points.push(clipped[2], clipped[3])
        }

        //Update maxCrossings arrays
        if (Math.abs(clipped[0] - maxY) < minDifference) {
          //If the first point touched the top, mark that
          polygon.maxCrossings.push({
            x: clipped[0],
            i: polygon.points.length - 4
          })
        } else {
          //Otherwise, it must have been the second point which touched the top
          polygon.maxCrossings.push({
            x: clipped[2],
            i: polygon.points.length - 2
          })
        }

        //If we hadn't started a polygon yet, note that we have now from the top
        if (entered == 0) {
          entered = 1
        } else if (entered == 1) { //If we've already started a polygon and we came in from the top, finalize it and start a new one
          entered = 0
          addPolygon(polygons, polygon)
          polygon = {
            points: [],
            minCrossings: [],
            maxCrossings: []
          }
        }
        //We don't need to worry about the case where we came in from the bottom because we don't need to do anything in that case
      } else if (crossesBottom) {
        //This part is even more similar to the above
        let clipped = trimPoints(points2[j0], points2[j1], points2[j2], points2[j3], minY, maxY)
        if (clipped == null) {
          throw new Error("What the heck, I thought this segment crossed bottom, but it was outside the range!")
        }

        //If this starts on the min and continues down, don't count it
        if (Math.abs(points2[j1] - minY) < minDifference && points2[j3] <= points2[j1]) {
          continue
        }

        //If we haven't started a poly yet, mark the start and ends
        if (entered == 0) {
          polygon.points.push(...clipped)
        } else {
          polygon.points.push(clipped[2], clipped[3])
        }

        //Update minCrossings arrays
        if (Math.abs(clipped[0] - minY) < minDifference) {
          //We know that the penultimate point represents crossing the min
          polygon.minCrossings.push({
            x: clipped[0],
            i: polygon.points.length - 4
          })
        } else {
          //Same as above but switched
          polygon.minCrossings.push({
            x: clipped[2],
            i: polygon.points.length - 2
          })
        }

        //If we hadn't started a polygon yet, note that we have now from the bottom
        if (entered == 0) {
          entered = -1
        } else if (entered == -1) { //If we've already started a polygon and we came in from the top, finalize it and start a new one
          entered = 0
          addPolygon(polygons, polygon)
          polygon = {
            points: [],
            minCrossings: [],
            maxCrossings: []
          }
        }
        //We don't need to worry about the case where we came in from the top because we don't need to do anything in that case
      } else { //If we didn't cross either line
        //Clip to the range
        let clipped = trimPoints(points2[j0], points2[j1], points2[j2], points2[j3], minY, maxY)
        //If we're outside the range, do nothing
        if (clipped == null) {
          continue
        } else if (Math.abs(clipped[3] - clipped[1]) < minDifference
         && Math.abs(clipped[3] - maxY) < minDifference
         || Math.abs(clipped[3] - minY) < minDifference) { //Else if the line is a horizontal line touching the boundaries, do nothing
          continue
        } else { //If we're inside the range, add only the second point (the first is already there)
          polygon.points.push(clipped[2], clipped[3])
        }
      }
    }
    console.log(polygons)
    //Wow, we're finally out of that loop! Feels good
    //If there's still data left in the polygon object, go ahead and add it to the array
    if (polygon.points.length > 0) {
      addPolygon(polygons, polygon)
    }
    //Now we have to check for intersection between polygons... This will be hard
    //Repeat until we don't have to make any changes
    let madeChanges = true
    while (madeChanges) {
      madeChanges = false
      
      //Make more detailed notes on the min crossing intervals
      let minIntervals = []
      for (let j = 0; j < polygons.length; j++) {
        for (let k = 0; k < polygons[j].minCrossings.length; k += 2) {
          let crossing = {
            start: polygons[j].minCrossings[k].x,
            end: polygons[j].minCrossings[k + 1].x,
            startIndex: polygons[j].minCrossings[k].i,
            endIndex: polygons[j].minCrossings[k + 1].i,
            polygon: j,
            intervalIndex: k
          }
          minIntervals.push(crossing)
        }
      }

      //Sort so that we can iterate simply
      minIntervals.sort((a, b) => a.start - b.start)

      //For each polygon min interval, check the previous interval to see if it overlaps
      //We don't need to check further than that because an outer interval MUST be followed by its contained intervals, if any
      // We'll restart if we find a single thing anyway, since we need to rebuild the minIntervals array, so multiple crossings are handled
      for (let j = 1; j < minIntervals.length; j++) {
        //Check if this overlaps the last
        if (minIntervals[j].start < minIntervals[j - 1].end) {
          madeChanges = true
          //If there is an overlap, check if the inner one has a max interval.
          if (polygons[minIntervals[j].polygon].maxCrossings.length > 0) {
            //If it does, we need to split the outer polygon, and potentially turn the inner polygon extra stuff into their own polygons
            let innerLeftMinIndex = polygons[minIntervals[j].polygon].minCrossings[0].i
            let innerLeftMaxIndex = polygons[minIntervals[j].polygon].maxCrossings[0].i
            let innerLeftMaxPoint = polygons[minIntervals[j].polygon].maxCrossings[0].x
            let innerRightMaxPoint = polygons[minIntervals[j].polygon].maxCrossings[polygons[minIntervals[j].polygon].maxCrossings.length - 1].x
            let outerLeftMaxIndex
            let outerRightMaxIndex
            let outerRightMinIndex
            //We know that there MUST be an interval across the max in the other polygon which contains the max points on either end of the intersection thing
            // so we find them
            for (let k = 0; k < polygons[minIntervals[j - 1].polygon].maxCrossings.length - 1; k++) {
              //If the next crossing is greater than the above point, then k is the lower bound of the relevant interval
              if (polygons[minIntervals[j - 1].polygon].maxCrossings[k + 1].x > innerLeftMaxPoint) {
                outerLeftMaxIndex = k
              }
              if (polygons[minIntervals[j - 1].polygon].maxCrossings[k + 1].x > innerRightMaxPoint) {
                outerRightMaxIndex = k + 1
              }
            }
            //Get the outer right min index too
            for (let k = 0; k < polygons[minIntervals[j - 1].polygon].maxCrossings.length - 1; k++) {
              //If the next crossing is greater than the above point, then k is the lower bound of the relevant interval
              //Save the lower bound of the interval containing the first point
              if (polygons[minIntervals[j - 1].polygon].minCrossings[k + 1].x > minIntervals[j].end) {
                outerRightMinIndex = k + 1
              }
            }
            if (outerLeftMaxIndex == undefined) {
              console.error("outerLeftMaxIndex is undefined!")
            }
            if (outerRightMaxIndex == undefined) {
              console.error("outerRightMaxIndex is undefined!")
            }
            if (outerRightMinIndex == undefined) {
              console.error("outerRightMinIndex is undefined!")
            }
            //Create a place to store the two halves of the polygon so we don't have to edit it in-place
            let leftPolygon = {
              points: [],
              minCrossings: [],
              maxCrossings: []
            }

            let rightPolygon = {
              points: [],
              minCrossings: [],
              maxCrossings: []
            }

            //If the polygons are defined in the same direction (cw vs ccw)
            //If one is cw, startIndex - endIndex will be positive. Else it'll be negative.
            //So, by multiplying them, we get >0 if they're the same, else <0 if they're different
            if ((minIntervals[j - 1].startIndex - minIntervals[j - 1].endIndex) * (minIntervals[j].startIndex - minIntervals[j].endIndex) > 0) {
              //We need to reverse the direction of the inner one so they're different
              //Otherwise, transplanting one line segment into the other will go backwards
              let reversedPoints = []
              for (let k = polygons[minIntervals[j].polygon].points.length - 2; k >= 0; k -= 2) {
                reversedPoints.push(polygons[minIntervals[j].polygon].points[k])
                reversedPoints.push(polygons[minIntervals[j].polygon].points[k + 1])
              }
              polygons[minIntervals[j].polygon].points = reversedPoints
              for (let k = 0; k < polygons[minIntervals[j].polygon].minCrossings; k++) {
                polygons[minIntervals[j].polygon].minCrossings[k].i = polygons[minIntervals[j].polygon].points.length - 2 - polygons[minIntervals[j].polygon].minCrossings[k].i
              }
              for (let k = 0; k < polygons[minIntervals[j].polygon].maxCrossings; k++) {
                polygons[minIntervals[j].polygon].maxCrossings[k].i = polygons[minIntervals[j].polygon].points.length - 2 - polygons[minIntervals[j].polygon].maxCrossings[k].i
              }
              innerLeftMinIndex = polygons[minIntervals[j].polygon].minCrossings[0].i
              innerLeftMaxIndex = polygons[minIntervals[j].polygon].maxCrossings[0].i
            }

            //Copy in the point values from the original polygon
            //We know that the point after outerMaxIndexLow is NOT part of this new polygon, so we can use that fact to identify the direction of this polygon
            let outerCW = (polygons[minIntervals[j - 1].polygon].maxCrossings[outerLeftMaxIndex + 1].i > polygons[minIntervals[j - 1].polygon].maxCrossings[outerLeftMaxIndex].i)
            //Collect all the crossing indices
            let crossingIndices = []
            for (let k in polygons[minIntervals[j - 1].polygon].minCrossings) {
              crossingIndices.push(polygons[minIntervals[j - 1].polygon].minCrossings[k].i)
            }
            for (let k in polygons[minIntervals[j - 1].polygon].maxCrossings) {
              crossingIndices.push(polygons[minIntervals[j - 1].polygon].maxCrossings[k].i)
            }
            //We get all the points from the left part of the outer polygon
            leftPolygon.points = circularSlice(polygons[minIntervals[j - 1].polygon].points,
              outerCW ? minIntervals[j - 1].startIndex : outerLeftMaxIndex, //When in outer is CW, we go from min to max
              (outerCW ? outerLeftMaxIndex : minIntervals[j - 1].startIndex) + 1, //Otherwise, we got from max to min. The +1 is to make the end inclusive
              crossingIndices)
            //Then we update the crossings of this slice to reflect the new indices of the crossing points
            for (let k = 0; k < crossingIndices.length; k++) {
              if (crossingIndices[k] == -1) continue
              if (k < polygons[minIntervals[j - 1].polygon].minCrossings.length) {
                leftPolygon.minCrossings.push({i: crossingIndices[k], x: polygons[minIntervals[j - 1].polygon].minCrossings[k].x})
              } else {
                leftPolygon.maxCrossings.push({i: crossingIndices[k], x: polygons[minIntervals[j - 1].polygon].maxCrossings[k - polygons[minIntervals[j - 1].polygon].minCrossings.length].x})
              }
            }
            //Then we add in the new edges from the intersecting polygon
            let previousLength = leftPolygon.length
            let newPoints = circularSlice(polygons[minIntervals[j].polygon].points,
              outerCW ? innerLeftMaxIndex : innerLeftMinIndex, //Same as above, but reversed, because the inner is CCW when the outer is CW
              (outerCW ? innerLeftMinIndex : innerLeftMaxIndex) + 1)
            leftPolygon.points.push(...newPoints)
            //Now update the crossings
            //The first in the new points list is always the max crossing, and the last is always the min crossing, based on our definition earlier.
            // Or switched when outer is CCW
            leftPolygon.maxCrossings.push({x: polygons[minIntervals[j].polygon].maxCrossings[0].x, i: outerCW ? previousLength : leftPolygon.points.length - 1})
            leftPolygon.minCrossings.push({x: polygons[minIntervals[j].polygon].minCrossings[0].x, i: outerCW ? leftPolygon.points.length - 1 : previousLength})
            //Save this polygon (we'll delete the old ones later)
            polygons.push(leftPolygon)

            //Now do the same for the right polygon
            //Collect original crossings again
            crossingIndices = []
            for (let k in polygons[minIntervals[j - 1].polygon].minCrossings) {
              crossingIndices.push(polygons[minIntervals[j - 1].polygon].minCrossings[k].i)
            }
            for (let k in polygons[minIntervals[j - 1].polygon].maxCrossings) {
              crossingIndices.push(polygons[minIntervals[j - 1].polygon].maxCrossings[k].i)
            }
            //We get all the points from the right part of the outer polygon
            rightPolygon.points = circularSlice(polygons[minIntervals[j - 1].polygon].points,
              outerCW ? outerRightMaxIndex : outerRightMinIndex, //Reversed of last time - if outside is CW, go max to min, since this is the right
              (outerCW ? outerRightMinIndex : outerRightMaxIndex) + 1,
              crossingIndices)
            //Then we update the crossings of this new one to reflect the new indices of the crossing points
            for (let k = 0; k < crossingIndices.length; k++) {
              if (crossingIndices[k] == -1) continue
              if (k < polygons[minIntervals[j - 1].polygon].minCrossings.length) {
                rightPolygon.minCrossings.push({i: crossingIndices[k], x: polygons[minIntervals[j - 1].polygon].minCrossings[k].x})
              } else {
                rightPolygon.maxCrossings.push({i: crossingIndices[k], x: polygons[minIntervals[j - 1].polygon].maxCrossings[k - polygons[minIntervals[j - 1].polygon].minCrossings.length].x})
              }
            }

            //Then we add in the new edges from the intersecting polygon
            previousLength = rightPolygon.length
            //The boundaries for the right ones, we KNOW are the final ones in the inner crossings
            //The order depends on CW-ness, and since this is long, we do a normal if instead of a ternary
            if (outerCW) {
              newPoints = circularSlice(polygons[minIntervals[j].polygon].points,
                polygons[minIntervals[j].polygon].minCrossings[polygons[minIntervals[j].polygon].minCrossings.length - 1].i,
                polygons[minIntervals[j].polygon].maxCrossings[polygons[minIntervals[j].polygon].maxCrossings.length - 1].i + 1)
            } else {
              newPoints = circularSlice(polygons[minIntervals[j].polygon].points,
                polygons[minIntervals[j].polygon].maxCrossings[polygons[minIntervals[j].polygon].maxCrossings.length - 1].i,
                polygons[minIntervals[j].polygon].minCrossings[polygons[minIntervals[j].polygon].minCrossings.length - 1].i + 1)
            }
            rightPolygon.points.push(...newPoints)
            //Now update the crossings
            //The first in the new points list is always the min crossing, and the last is always the max crossing, based on our definition earlier.
            //Switched if outer is CCW
            rightPolygon.maxCrossings.push({
              x: polygons[minIntervals[j].polygon].maxCrossings[polygons[minIntervals[j].polygon].minCrossings.length - 1].x,
              i: outerCW ? (leftPolygon.points.length - 1) : previousLength
            })
            rightPolygon.minCrossings.push({
              x: polygons[minIntervals[j].polygon].minCrossings[polygons[minIntervals[j].polygon].minCrossings.length - 1].x,
              i: outerCW ? previousLength : (leftPolygon.points.length - 1)
            })
            //Save this polygon (we'll delete the old ones later)
            polygons.push(rightPolygon)

            //Finally, we need to extract any polygons still left defined in the inner polygon
            //We know that they only intersect one side, since otherwise it'd split the inner polygon into another
            if (polygons[minIntervals[j].polygon].maxCrossings.length > 2) {
              //For each pair of crossings
              for (let k = 1; k < polygons[minIntervals[j].polygon].maxCrossings.length - 1; k += 2) {
                //Initialize a new Polygon, noting that we already know its crossings
                let additionalPolygon = {
                  points: [],
                  minCrossings: [],
                  maxCrossings: [polygons[minIntervals[j].polygon].maxCrossings[k], polygons[minIntervals[j].polygon].maxCrossings[k + 1]]
                }
                //Note the current indices of those crossings
                let additionalIndices = [polygons[minIntervals[j].polygon].maxCrossings[k].i, polygons[minIntervals[j].polygon].maxCrossings[k + 1].i]
                //Get just the correct slice
                additionalPolygon.points = circularSlice(polygons[minIntervals[j].polygon].points,
                  outerCW ? polygons[minIntervals[j].polygon].maxCrossings[k + 1].i : polygons[minIntervals[j].polygon].maxCrossings[k].i,
                  outerCW ? polygons[minIntervals[j].polygon].maxCrossings[k].i : polygons[minIntervals[j].polygon].maxCrossings[k + 1].i,
                  additionalIndices)
                //Correct the new indices of those crossings
                additionalPolygon.maxCrossings[0].i = additionalIndices[0]
                additionalPolygon.maxCrossings[1].i = additionalIndices[1]
                //No need to sort because we already know they're sorted, since we added them in sorted order
                polygons.push(additionalPolygon)
              }
            }

            //Same as above but for min crossings
            if (polygons[minIntervals[j].polygon].minCrossings.length > 2) {
              //For each pair of crossings
              for (let k = 1; k < polygons[minIntervals[j].polygon].minCrossings.length - 1; k += 2) {
                //Initialize a new Polygon, noting that we already know its crossings
                let additionalPolygon = {
                  points: [],
                  maxCrossings: [],
                  minCrossings: [polygons[minIntervals[j].polygon].minCrossings[k], polygons[minIntervals[j].polygon].minCrossings[k + 1]]
                }
                //Note the current indices of those crossings
                let additionalIndices = [polygons[minIntervals[j].polygon].minCrossings[k].i, polygons[minIntervals[j].polygon].minCrossings[k + 1].i]
                //Get just the correct slice
                additionalPolygon.points = circularSlice(polygons[minIntervals[j].polygon].points,
                  outerCW ? polygons[minIntervals[j].polygon].minCrossings[k].i : polygons[minIntervals[j].polygon].minCrossings[k + 1].i,
                  outerCW ? polygons[minIntervals[j].polygon].minCrossings[k + 1].i : polygons[minIntervals[j].polygon].minCrossings[k].i,
                  additionalIndices)
                //Correct the new indices of those crossings
                additionalPolygon.minCrossings[0].i = additionalIndices[0]
                additionalPolygon.minCrossings[1].i = additionalIndices[1]
                //No need to sort because we already know they're sorted, since we added them in sorted order
                polygons.push(additionalPolygon)
              }
            }

            //NOW we can remove the old polygons! We remove the highest-indexed one first, so the index of the other one doesn't change
            polygons.splice(Math.max(minIntervals[j].polygon, minIntervals[j - 1].polygon), 1)
            polygons.splice(Math.min(minIntervals[j].polygon, minIntervals[j - 1].polygon), 1)
            //Break, causing us to begin the loop again, because now minIntervals is out of date
            break
          } else { //Otherwise, we can just insert the new feature
            //If the intervals are defined in the same direction, we first need to flip the points and point indices
            if ((minIntervals[j].startIndex - minIntervals[j].endIndex) * (minIntervals[j - 1].startIndex - minIntervals[j - 1].endIndex) > 0) {
              let reversedPoints = []
              for (let k = polygons[minIntervals[j].polygon].points.length - 2; k >= 0; k -= 2) {
                reversedPoints.push(polygons[minIntervals[j].polygon].points[k])
                reversedPoints.push(polygons[minIntervals[j].polygon].points[k + 1])
              }
              polygons[minIntervals[j].polygon].points = reversedPoints
              minIntervals[j].startIndex = polygons[minIntervals[j].polygon].points.length - minIntervals[j].startIndex - 2
              minIntervals[j].endIndex = polygons[minIntervals[j].polygon].points.length - minIntervals[j].endIndex - 2
            }
            //Now, we know they are defined in the same directions, so we can continue
            //First, we can just splice in the new points
            polygons[minIntervals[j - 1].polygon].points.splice(minIntervals[j - 1].endIndex, 0, ...polygons[minIntervals[j].polygon].points)
            
            //Now we split the interval in two
            //Easy to just split this one interval into two
            if (minIntervals[j].startIndex < minIntervals[j].endIndex) {
              //Collect the new crossings data
              let newCrossings = []
              //Crossing where the outer interval started
              newCrossings.push({x: minIntervals[j - 1].start, i: minIntervals[j - 1].startIndex})
              //Crossing where the inner interval started
              newCrossings.push({x: minIntervals[j].start, i: minIntervals[j - 1].startIndex + 1})
              //Crossing where the inner interval ended
              newCrossings.push({x: minIntervals[j].end, i: minIntervals[j - 1].startIndex + minIntervals[j].endIndex + 1})
              //Crossing where the outer interval ended
              newCrossings.push({x: minIntervals[j - 1].end, i: minIntervals[j - 1].startIndex + minIntervals[j].endIndex + 2})
              //Finally, replace the previous interval's crossings with these four new crossings
              polygons[minIntervals[j - 1].polygon].minCrossings.splice(minIntervals[j - 1].intervalIndex, 2, ...newCrossings)
            } else {
              //Same as above
              let newCrossings = []
              newCrossings.push({x: minIntervals[j - 1].start, i: minIntervals[j - 1].endIndex + minIntervals[j].startIndex + 2})
              newCrossings.push({x: minIntervals[j].start, i: minIntervals[j - 1].endIndex + minIntervals[j].startIndex + 1})
              newCrossings.push({x: minIntervals[j].end, i: minIntervals[j - 1].endIndex + 1})
              newCrossings.push({x: minIntervals[j - 1].end, i: minIntervals[j - 1].endIndex})
              polygons[minIntervals[j - 1].polygon].minCrossings.splice(minIntervals[j - 1].intervalIndex, 2, ...newCrossings)
            }
            //Remove the inner polygon, as its purpose has now been served
            polygons.splice(minIntervals[j].polygon, 1)
            //Break, causing us to begin the loop again, because now minIntervals is out of date
            break
          }
        }
      }

      //If we already made changes, restart the loop NOW to avoid issues
      if (madeChanges) {
        continue
      }
      
      //Do the same for max intervals, but without the case where it crosses, because that's already been handled
      //Make more detailed notes on the min crossing intervals
      let maxIntervals = []
      for (let j = 0; j < polygons.length; j++) {
        for (let k = 0; k < polygons[j].maxCrossings.length; k += 2) {
          let crossing = {
            start: polygons[j].maxCrossings[k].x,
            end: polygons[j].maxCrossings[k + 1].x,
            startIndex: polygons[j].maxCrossings[k].i,
            endIndex: polygons[j].maxCrossings[k + 1].i,
            polygon: j,
            intervalIndex: k
          }
          maxIntervals.push(crossing)
        }
      }

      //Sort so that we can iterate simply
      maxIntervals.sort((a, b) => a.start - b.start)

      //For each polygon min interval, check the previous interval to see if it overlaps
      //We don't need to check further than that because an outer interval MUST be followed by its contained intervals, if any
      // We'll restart if we find a single thing anyway, since we need to rebuild the minIntervals array, so multiple crossings are handled
      for (let j = 1; j < maxIntervals.length; j++) {
        //Check if this overlaps the last
        if (maxIntervals[j].start < maxIntervals[j - 1].end) {
          madeChanges = true
          //If the intervals are defined in the same direction, we first need to flip the points and point indices
          if ((maxIntervals[j].startIndex - maxIntervals[j].endIndex) * (maxIntervals[j - 1].startIndex - maxIntervals[j - 1].endIndex) > 0) {
            let reversedPoints = []
              for (let k = polygons[maxIntervals[j].polygon].points.length - 2; k >= 0; k -= 2) {
                reversedPoints.push(polygons[maxIntervals[j].polygon].points[k])
                reversedPoints.push(polygons[maxIntervals[j].polygon].points[k + 1])
              }
              polygons[maxIntervals[j].polygon].points = reversedPoints
            maxIntervals[j].startIndex = polygons[maxIntervals[j].polygon].points.length - maxIntervals[j].startIndex - 2
            maxIntervals[j].endIndex = polygons[maxIntervals[j].polygon].points.length - maxIntervals[j].endIndex - 2
          }
          //Now, we know they are defined in the same directions, so we can continue
          //First, we can just splice in the new points
          polygons[maxIntervals[j - 1].polygon].points.splice(maxIntervals[j - 1].endIndex, 0, ...polygons[maxIntervals[j].polygon].points)
          
          //Now we split the interval in two
          //Easy to just split this one interval into two
          if (maxIntervals[j].startIndex < maxIntervals[j].endIndex) {
            //Collect the new crossings data
            let newCrossings = []
            //Crossing where the outer interval started
            newCrossings.push({x: maxIntervals[j - 1].start, i: maxIntervals[j - 1].startIndex})
            //Crossing where the inner interval started
            newCrossings.push({x: maxIntervals[j].start, i: maxIntervals[j - 1].startIndex + 1})
            //Crossing where the inner interval ended
            newCrossings.push({x: maxIntervals[j].end, i: maxIntervals[j - 1].startIndex + maxIntervals[j].endIndex + 1})
            //Crossing where the outer interval ended
            newCrossings.push({x: maxIntervals[j - 1].end, i: maxIntervals[j - 1].startIndex + maxIntervals[j].endIndex + 2})
            //Finally, replace the previous interval's crossings with these four new crossings
            polygons[maxIntervals[j - 1].polygon].maxCrossings.splice(maxIntervals[j - 1].intervalIndex, 2, ...newCrossings)
          } else {
            //Same as above
            let newCrossings = []
            newCrossings.push({x: maxIntervals[j - 1].start, i: maxIntervals[j - 1].endIndex + maxIntervals[j].startIndex + 2})
            newCrossings.push({x: maxIntervals[j].start, i: maxIntervals[j - 1].endIndex + maxIntervals[j].startIndex + 1})
            newCrossings.push({x: maxIntervals[j].end, i: maxIntervals[j - 1].endIndex + 1})
            newCrossings.push({x: maxIntervals[j - 1].end, i: maxIntervals[j - 1].endIndex})
            polygons[maxIntervals[j - 1].polygon].maxCrossings.splice(maxIntervals[j - 1].intervalIndex, 2, ...newCrossings)
          }
          //Remove the inner polygon, as its purpose has now been served
          polygons.splice(maxIntervals[j].polygon, 1)
          //Break, causing us to begin the loop again, because now maxIntervals is out of date
          break
        }
      }
    }
    //WOW, OKAY, SO, WE'RE FINALLY OUT OF THAT LOOP! FEELS GOOD!!
    //Now, all we have to do is, for each of those polygons, add the triangles to cut using earcut.
    for (let j = 0; j < polygons.length; j++) {
      let colors = [Math.random(), Math.random(), Math.random(), 1]
      for (let k = 0; k < polygons[j].points.length; k += 2) {
        if (switchXAndZ) {
          vertexPoints.push(interpolate(points1[(i + 1) % points1.length],
            points1[(i + 0) % points1.length],
            points1[(i + 3) % points1.length],
            points1[(i + 2) % points1.length],
            polygons[j].points[k + 1]))
          vertexPoints.push(polygons[j].points[k + 1])
          vertexPoints.push(polygons[j].points[k])
        } else {
          vertexPoints.push(polygons[j].points[k])
          vertexPoints.push(polygons[j].points[k + 1])
          vertexPoints.push(interpolate(points1[(i + 1) % points1.length],
            points1[(i + 0) % points1.length],
            points1[(i + 3) % points1.length],
            points1[(i + 2) % points1.length],
            polygons[j].points[k + 1]))
        }
        //One color value for each point
        colorPoints.push(colors)
        colorPoints.push(colors)
        colorPoints.push(colors)
      }
      let previousLength = vertexPoints.length / 3
      let order = earcut(polygons[j].points)
      for (let k = 0; k < order.length; k++) {
        order[k] += previousLength
      }
      indices.push(...order)
    }
  }
}

//Just like 3 lines I felt needed their own function :)
function addPolygon(polygonsArray, toAdd) {
  //Sort the crossings arrays based on the indices. Makes later sorting faster, I think
  toAdd.minCrossings.sort((a, b) => a.x - b.x)
  toAdd.maxCrossings.sort((a, b) => a.x - b.x)
  polygonsArray.push(toAdd)
}

//Trims a line between two points to only exist in the given range
function trimPoints(x1, y1, x2, y2, bound1, bound2) {
  //If the points don't intersect with the range, return null
  //If the highest Y is lower than the lowest bound
  if (Math.min(bound1, bound2) - Math.max(y1, y2) > minDifference) return null
  //If the lowest Y is higher than the highest bound
  if (Math.min(y1, y2) - Math.max(bound1, bound2) > minDifference) return null
  //If this is a horizontal line then no change is needed from now on
  if (y1 == y2) {
    return [x1, y1, x2, y2]
  }
  //Otherwise, find the desired y points, and find the corresponding x points.
  //Find the desired y points by taking the middle value of (bound1, y, bound2)
  //If the point is in the range, then the middle is that point.
  //If the point is above the range, then the middle is the max.
  //If the point is below the range, then the middle is the min.
  let toReturn = [x1, y1, x2, y2]
  let newy1 = median(bound1, y1, bound2)
  if (Math.abs(newy1 - y1) > minDifference) {
    toReturn[1] = newy1
    //We intentionally switch X and Y here because we're interpolating based on Y, not X
    toReturn[0] = interpolate(y1, x1, y2, x2, newy1)
  }
  let newy2 = median(bound1, y2, bound2)
  if (Math.abs(newy2 - y2) > minDifference) {
    toReturn[3] = newy2
    //We intentionally switch X and Y here because we're interpolating based on Y, not X
    toReturn[2] = interpolate(y1, x1, y2, x2, newy2)
  }
  return toReturn
}

//Functions like vanilla's slice(), but if b < a, will instead return an array including elements from a to the end followed by items from the beginning to b
//If an array of indices is supplied as well, will update them
function circularSlice(array, a, b, indices) {
  if (a >= b) {
    if (indices) {
      for (let i = 0; i < indices.length; i++) {
        if (i < b && i >= a) {
          i -= a
        } else {
          i = -1
        }
      }
    }
    return array.slice(a, b)
  } else {
    if (indices) {
      for (let i = 0; i < indices.length; i++) {
        if (i >= b) {
          indices[i] -= b
        } else if (i < a) {
          indices += (indices.length - b - 1)
        } else {
          indices[i] = -1
        }
      }
    }
    let toReturn = array.slice(b, array.length)
    toReturn.push(...array.slice(0, a))
    return toReturn
  }
}

//Tests if an interval includes a point, including the ends
function intervalIncludes(y1, y2, y) {
  //Check if the line is basically horizontal. If so, it should't intersect with anything
  if (Math.abs(y2 - y1) < minDifference) return false
  //Check if the point is too close to the ends to tell (so we say the interval does include the point)
  if (Math.abs(y - y1) < minDifference) return true
  if (Math.abs(y - y2) < minDifference) return true
  //Interval contains point if the sum of distances between point and endpoints is equal than the range of the interval.
  //To avoid floating point errors, we test if the difference between these values is below a threshold which is close to 0
  // e.g. 3, 1, 2. would reduce to (1 + 1) - 2 = 0. This is below the threshold of "basically zero", so the interval contains the point
  return Math.abs((Math.abs(y - y2) + Math.abs(y - y1)) - Math.abs(y2 - y1)) < minDifference
}

//Return the median of 3 values
function median(a, b, c) {
  return a + b + c - Math.min(a, b, c) - Math.max(a, b, c)
}

//Return the y value of an x value on a line
function interpolate(x1, y1, x2, y2, x) {
  if (x2 == x1) {
    console.error("Tried to interpolate based on a vertical line >:(")
    return (y1 + y2) / 2
  }
  return (x - x1) * ((y2 - y1) / (x2 - x1)) + y1
}

function refreshModel(e) {
    setModel(document.getElementById("svgData").value,
        document.getElementById("svgData").value,
        parseFloat(document.getElementById("pDistance").value),
        parseFloat(document.getElementById("eDistance").value))
}

document.getElementById("svgData").addEventListener('change', refreshModel)
document.getElementById("pDistance").addEventListener('change', refreshModel)
document.getElementById("eDistance").addEventListener('change', refreshModel)