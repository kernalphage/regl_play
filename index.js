'use strict';
var material = require('./Material');
var Vic = require('victor');
var dat = require('dat.gui');
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
    ret.push(hex_vtx(i));
    ret.push(hex_vtx(i + 1));
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
    storage: 0,
    ticks: 0,
    maxTicks: 10,
    mesh: function(){
      return _.flattenDeep(_.map(this.nodes, (n)=>hex_mesh(layout.hexToPixel(this.center.add(n)), 40)));
    },
    rotateLeft: function(){
      this.nodes = _.map(nodes, (n)=>n.rotateLeft());
    },
    normalized: function(){
      return _.map(this.nodes, (n)=> this.center.add(n));
    },
    zone: function(){
      var norm = this.normalized();
      var total = _.flatMap(norm, (n)=> n.neighbors());
      return _.differenceWith(total, norm, Hex.Hex.equals);
    },

    intersects: function(hexes){
      var pts = this.normalized();
      for (var i = hexes.length - 1; i >= 0; i--) {
        for (var j = pts.length - 1; j >= 0; j--) {
          if( pts[j].equal( hexes[i])) return true;
        }
      }
      return false;
    },
    update(){
      ticks++;
      if(ticks > maxTicks){
        ticks -= maxTicks;
        storage++;
      }
    }
  }
}

var textBuffer = {
  cur: "",
  prev: "",
  indent: 0,
  push: function(){ this.indent ++; },
  pop: ()=> this.indent--,
  render: function(){
    if(this.prev != this.cur){
      console.log(this.cur);
    }
    this.prev = this.cur;
    this.cur = "";
    this.indent = 0;
  },
  log: function(obj){
    if(typeof obj !== "String"){
      obj = JSON.stringify(obj);
    }
    for(var i = 0; i < this.indent; i++){ this.cur += "\t"; };
    this.cur +=  obj + "\n";
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
  material.loadMaterials();
  procgen = new proc();
  var gui = new dat.GUI();
  gui.addColor(procgen, 'color');
  gui.add(procgen, 'offset', -1, 1);
  gui.add(procgen, 'cmplx', -1, 1);

      // regl.frame() wraps requestAnimationFrame and also handles viewport
      // changes
      var t = material.regl.frame(({time, tick, viewportWidth, viewportHeight}) => {
        try {
          const {x, y, buttons} = mouse;
          var mousePos =  new Hex.Point(x - viewportWidth / 2, viewportHeight / 2 - y);
          var cube_pos = layout.pixelToHex(mousePos).round();
          procgen.posx = cube_pos.x;
          procgen.posy = cube_pos.y;

          var hexG = hex_group(cube_pos, [new Hex.Hex(0,0), new Hex.Hex(1,0), new Hex.Hex(2,0), new Hex.Hex(1,1)]);
          if(buttons){
            
            hexG = hex_group(new Hex.Hex(0,0), hexG.zone());
          }


         var verts = [hex_mesh({x:0, y:0}, procgen.scale), hexG.mesh()];
        verts = _.flattenDeep(verts);
        textBuffer.log("Mouse:");
        textBuffer.push();
        textBuffer.log(cube_pos);
        textBuffer.pop();

        textBuffer.render();

        var intersects = hexG.intersects([new Hex.Hex(0,0)] );
         //verts = [17.32066249627327,-9.99973253093265,17.32066249627327,9.99973253093265,0,0,17.32066249627327,9.99973253093265,0.0009265358975991552,19.99999997853828,0,0,0.0009265358975991552,19.99999997853828,-17.319735910812394,10.001337309565937,0,0,-17.319735910812394,10.001337309565937,-17.321588933041664,-9.998127666454781,0,0,-17.321588933041664,-9.998127666454781,-0.002779607684847885,-19.999999806844528,0,0,-0.002779607684847885,-19.999999806844528,17.318809176667,-10.002942002340859,0,0 ];
          // clear contents of the drawing buffer
          // draw a triangle using the command defined above
          material.materials.flat2D({
            scale: procgen.scale,
            color: intersects ? rgb_to_float(procgen.color) : [.2,.0,.0, 1],
              count: verts.length/2,
            positions: material.regl.buffer({
              usage: 'stream',
              data: verts
            })
          });
        } catch (e) {
          console.error(e);
          t.cancel();
          throw(e);
        }
      })

}