'use strict';
var regl = require('regl')();
var Vic = require('victor');
var dat = require('dat.gui');
var mat4 = require('gl-mat4');
var kernal = require('./kernal');
var Hex = require('./hexlib');
var mouse = require('mouse-change')();
var _ = require('lodash');

var h = new  Hex.Hex(1,1);
var layout = new Hex.Layout(Hex.Layout.pointy, new Hex.Point(40,40) , new Hex.Point(0,0));
var print_once = true;

function hex_mesh(center, size) {
  var hex_vtx = (i) => {
    let angle = ((60 * i - 30) * 3.1415 / 180);
    return [
      center.x + size * Math.cos(angle), center.y + size * Math.sin(angle)
    ];
  }; 
  let ret = [];
  for (var i = 0; i < 6; i++) {
    ret.push(hex_vtx(i))
    ret.push(hex_vtx(i + 1))
    ret.push(center.x, center.y);
  }

  if (print_once) {
    print_once = false;
    console.log(ret + ' length' + ret.length);
    }
  return ret;
  }

function hex_group( center, nodes ){
  return {
    nodes: nodes,
    center: center,
    mesh: function(){
      return _.flattenDeep(_.map(this.nodes, (n)=>hex_mesh(layout.hexToPixel(this.center.add(n)), 40)));
    },
    rotateLeft: function(){
      this.nodes = _.map(nodes, (n)=>n.rotateLeft());
    }
  }
}

function rgb_to_float(color) {
  return [color[0] / 255, color[1] / 255, color[2] / 255, color[3]];
  }
var proc = function() {
  this.color = [244, 15, 155, 1.];
  this.scale = 40;
  this.offset = .62;
  this.cmplx = -.4938;
  this.posx =0;
  this.posy = 0;
}
var procgen;

window.onload = function() {
  procgen = new proc();
  var gui = new dat.GUI();
  gui.addColor(procgen, 'color');
  gui.add(procgen, 'offset', -1, 1);
  gui.add(procgen, 'cmplx', -1, 1);

  // Calling regl() creates a new partially evaluated draw command
  const drawTriangle = regl({

    // Shaders in regl are just strings.  You can use glslify or whatever you
    // want
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
      projection: ({viewportWidth, viewportHeight}) => {
        // mat4.translate here?
        return mat4.ortho(
            [], -viewportWidth / 2, viewportWidth / 2, -viewportHeight / 2,
            viewportHeight / 2, -0.01, 1000);
      }
    },
    count: regl.prop('count')
  })

      // regl.frame() wraps requestAnimationFrame and also handles viewport
      // changes
      var t = regl.frame(({time, tick, viewportWidth, viewportHeight}) => {
        try {
          const {x, y, buttons} = mouse;
          var mousePos =  new Hex.Point(x - viewportWidth / 2, viewportHeight / 2 - y);
          var cube_pos = layout.pixelToHex(mousePos).round();
          procgen.posx = cube_pos.x;
          procgen.posy = cube_pos.y;

          var hexG = hex_group(cube_pos, [new Hex.Hex(0,0), new Hex.Hex(1,0), new Hex.Hex(2,0), new Hex.Hex(1,1)]);
          if(buttons){
            hexG.rotateLeft();
          }
         var verts = [hex_mesh({x:0, y:0}, procgen.scale), hexG.mesh()];
        verts = _.flattenDeep(verts);
         //verts = [17.32066249627327,-9.99973253093265,17.32066249627327,9.99973253093265,0,0,17.32066249627327,9.99973253093265,0.0009265358975991552,19.99999997853828,0,0,0.0009265358975991552,19.99999997853828,-17.319735910812394,10.001337309565937,0,0,-17.319735910812394,10.001337309565937,-17.321588933041664,-9.998127666454781,0,0,-17.321588933041664,-9.998127666454781,-0.002779607684847885,-19.999999806844528,0,0,-0.002779607684847885,-19.999999806844528,17.318809176667,-10.002942002340859,0,0 ];
          // clear contents of the drawing buffer
          // draw a triangle using the command defined above
          drawTriangle({
            scale: procgen.scale,
            color: buttons? rgb_to_float(procgen.color) : [.2,.0,.0, 1],
              count: verts.length/2,
            positions: regl.buffer({
              usage: 'stream',
              data: verts
            })          });
        } catch (e) {
          console.error(e);
          t.cancel();
          throw(e);
        }
      })

}