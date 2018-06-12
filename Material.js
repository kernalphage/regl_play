var regl = require('regl')();
var mat4 = require('gl-mat4');
exports.materials = null;
exports.regl = regl;
exports.loadMaterials = function() {
    return exports.materials || (exports.materials = {
        flat2D: regl({
          frag: `
    precision mediump float;
    uniform vec4 color;
    void main() {
      gl_FragColor = color;    
    }`,

          vert: `
    precision mediump float;
    attribute vec2 position;
    uniform mat4 projection;

    void main() {
      gl_Position = projection * vec4(position, 0, 1);
    }`,

          // Here we define the vertex attributes for the above shader
          attributes: {
            // regl.buffer creates a new array buffer object
            position: regl.prop('positions')
            // regl automatically infers sane defaults for the vertex attribute
            // pointers
          },

          uniforms: {
            // This defines the color of the triangle to be a dynamic variable
            color: regl.prop('color'),
            offset: regl.prop('offset'),
            projection: ({
              viewportWidth,
              viewportHeight
            }) => {
              // mat4.translate here?
              return mat4.ortho(
                [], -viewportWidth / 2, viewportWidth / 2, -viewportHeight / 2,
                viewportHeight / 2, -0.01, 1000);
            }
          },
          count: regl.prop('count')
        }) //end regl

      }); // end materials
};