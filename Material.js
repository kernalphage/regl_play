var regl = require('regl')();
var mat4 = require('gl-mat4');
exports.materials = null;
exports.regl = regl;
exports.loadMaterials = function() {
    return exports.materials || (exports.materials = {
        flat2D: regl({
          frag: `

    precision mediump float;

varying vec2 v_texCoord;
varying vec4 v_fragmentColor;
uniform float distortAmount;
uniform vec2 textureSize;

uniform sampler2D u_inputTex0;

void main() {

  // we'll use the red and green channel for displacement. Blue for hilight.
  vec4 inputColor = texture2D(u_inputTex0, v_texCoord);
  
  gl_FragColor = inputColor;
 // float shiftX = ((inputColor.r - 0.5) / 12.0);
 // shiftX = clamp(shiftX, -0.09, 0.09);
 // float shiftY = ((inputColor.g - 0.5) / 12.0);
 // shiftY = clamp(shiftY, -0.09, 0.09);
//
 // vec2 v_displaceCoord = vec2(v_texCoord.x + shiftX, v_texCoord.y + shiftY);
//
 // gl_FragColor = texture2D(u_inputTex1, v_displaceCoord);
//
 // gl_FragColor = gl_FragColor + vec4(inputColor.b, inputColor.b, inputColor.b, 1.0);
}`,

          vert: `


    precision mediump float;
    attribute vec2 position;
    
    varying vec2 v_texCoord;

    void main() {
      v_texCoord = position / 2. + .5;
      gl_Position =vec4(position, 0, 1);
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
            distortAmount: regl.prop('distortAmount'),
            
            u_inputTex0: regl.prop('crack'),
          },
          count: regl.prop('count')
        }) //end regl

      }); // end materials
};

exports.loadMaterials();

require('resl')({
  manifest: {
    crack: {
      type: 'image',
      src: 'crack.png',
      parser: (data) => regl.texture({
        data: data,
        mag: 'linear',
        min: 'linear'
      })
    }
  }
,
onDone: ({crack}) => {
    regl.frame(() => {
      regl.clear({
        color: [0, 0, 0, 255],
        depth: 1
      })
      exports.materials.flat2D({
            scale: 1,
            color: [.2,.0,.0, 1],
              count: 3,
            positions: regl.buffer({
              usage: 'stream',
              data: [-1,-1,-1,1,1,1],
              crack:crack,
        })
    });
  });
  }
})