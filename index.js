var regl = require('regl')();
var Vic = require('victor');
var dat = require('dat.gui');
var mat4 = require('gl-mat4')
var kernal = require('./kernal');
var mouse = require('mouse-change')();

print_once = true;
function hex_mesh(center, size){
  var hex_vtx = (i)=> {
    angle = ((60 * i - 30) * 3.1415/180); 
    return [center[0] + size * Math.cos(angle), center[1] + size * Math.sin(angle)];
  };
  edges = [0,1,2,3,4,5].map(hex_vtx);
  ret = [];
  for(var i = 0; i < 6; i++){
    ret.push(hex_vtx(i))
    ret.push(hex_vtx(i+1))
    ret.push([center[0], center[1]])
  }

  if(print_once){
    print_once = false;
    console.log(edges +" length" + edges.length);

    console.log(ret +" length" + ret.length);
  }
  return ret;
}

function rgb_to_float(color){
  return [color[0]/255, color[1]/255, color[2]/255, color[3]];
}
var proc = function(){
  this.color = [244,15,155,1.];
  this.scale = 20;
  this.offset = .62;
  this.cmplx = -.4938;
}
var procgen;

window.onload = function(){
  procgen = new proc();
  var gui = new dat.GUI();
  gui.addColor(procgen, 'color');
  gui.add(procgen, 'scale', .0, 200);
  gui.add(procgen, 'offset', -1, 1);
  gui.add(procgen, 'cmplx', -1, 1);

// Calling regl() creates a new partially evaluated draw command
const drawTriangle = regl({

  // Shaders in regl are just strings.  You can use glslify or whatever you want
  // to define them.  No need to manually create shader objects.
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
      gl_Position = projection * vec4(position , 0, 1);
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
     projection: ({viewportWidth, viewportHeight}) => {
      // mat4.translate here? 
      return mat4.ortho([],
       -viewportWidth/2, viewportWidth/2,  
        -viewportHeight/2, viewportHeight/2,
        - 0.01,
        1000);
    }
  },

  // This tells regl the number of vertices to draw in this command
  count: 6 * 3
})

// regl.frame() wraps requestAnimationFrame and also handles viewport changes
var t = regl.frame(({time, tick,viewportWidth, viewportHeight}) => {
  try{

    const {x, y} = mouse;
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
      data: hex_mesh([x- viewportWidth/2,viewportHeight/2-y], procgen.scale)
    })
  });
  }catch(e){
    console.error(e);
    t.cancel();
  }
})

}