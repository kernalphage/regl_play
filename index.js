var regl = require('regl')();
var Vic = require('victor');
var dat = require('dat.gui');



function rgb_to_float(color){
  return [color[0]/255, color[1]/255, color[2]/255, color[3]];
}
var proc = function(){
  this.color = [244,15,155,1.];
  this.scale = .6;
  this.offset = .62;
  this.cmplx = -.4938;
}
var procgen;

window.onload = function(){
  procgen = new proc();
  var gui = new dat.GUI();
  gui.addColor(procgen, 'color');
  gui.add(procgen, 'scale', .0, 2);
  gui.add(procgen, 'offset', -1, 1);
  gui.add(procgen, 'cmplx', -1, 1);

// Calling regl() creates a new partially evaluated draw command
const drawTriangle = regl({

  // Shaders in regl are just strings.  You can use glslify or whatever you want
  // to define them.  No need to manually create shader objects.
  frag: `
    precision mediump float;
    uniform vec4 color;
    uniform float scale;
    uniform vec2 offset;
    varying vec2 uv;

vec2 cmpxmul(in vec2 a, in vec2 b) {
  return vec2(a.x * b.x - a.y * b.y, a.y * b.x + a.x * b.y);
}
vec2 cmpxsqrt(in vec2 a, float c){
  float tanxy = atan(a.x,a.y);
  float mag  = (a.x * a.x) + (a.y * a.y);
  vec2 imag = vec2(cos( c * tanxy ), sin(c * tanxy));
  return pow(mag, c/2.) * imag; 
}
    void main() {
      vec2 z = uv * scale;
      int jj = 0; 
      vec2 prev;
      for(int i=0; i < 19; i++){
        prev = z;
         jj++;

         vec2 zz = cmpxsqrt(z, 1.25);
         z =  zz + offset;
         if(length(z) > 2.0) {
          prev = z;
         };
      };

      vec4 inside = vec4((dot(prev, z)+1.)/2.,1.,0, 1);
      vec4 outside= vec4(atan(z.y, z.x),z.y, z.x,1);      
      gl_FragColor = mix(inside, outside, distance(prev, z));
      //  gl_FragColor = ;
    
    }`,

  vert: `
    precision mediump float;
    attribute vec2 position;
    varying vec2 uv;

    void main() {
      uv = vec2(position.x, position.y)- vec2(.03,.2);
      gl_Position = vec4(position , 0, 1);
    }`,

  // Here we define the vertex attributes for the above shader
  attributes: {
    // regl.buffer creates a new array buffer object
    position: regl.prop('positions')
    // regl automatically infers sane defaults for the vertex attribute pointers
  },

  uniforms: {
    // This defines the color of the triangle to be a dynamic variable
    color: regl.prop('color'),
    scale: regl.prop('scale'),
    offset: regl.prop('offset'),
  },

  // This tells regl the number of vertices to draw in this command
  count: 6
})

// regl.frame() wraps requestAnimationFrame and also handles viewport changes
var t = regl.frame(({time, tick, viewportHeight, framebufferHeight}) => {
  try{
  // clear contents of the drawing buffer
  regl.clear({
 //   color: [.3, .5,.1, 1],
    depth: 1
   })
  // draw a triangle using the command defined above
  drawTriangle({
    scale: procgen.scale,
    offset: [procgen.offset, procgen.cmplx],
    color: rgb_to_float(procgen.color), 
    positions: regl.buffer( {usage: 'stream',
      data: new Float32Array(
      [-1, 1,   // no need to flatten nested arrays, regl automatically
      1, 1,    // unrolls them into a typedarray (default Float32)
      -1,  -1,
     1, 1,   // no need to flatten nested arrays, regl automatically
      -1, -1,    // unrolls them into a typedarray (default Float32)
      1,  -1
      ])
    })
  });
  }catch(e){
    console.error(e);
    t.cancel();
  }
})

}