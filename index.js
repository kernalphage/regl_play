'use strict';
var Vic = require('victor');
var dat = require('dat.gui');
var kernal = require('./kernal');
var Hex = require('./hexlib');
var mouse = {x:0, y:0, button:0};
var _ = require('lodash');
var input = require('./input');

var h = new  Hex.Hex(1,1);
var layout = new Hex.Layout(Hex.Layout.pointy, new Hex.Point(15,15) , new Hex.Point(200,200));

var textBuffer = {
  cur: "",
  indent: 0,
  dom:null,
  register: function(dom) {this.dom = dom;},
  push: function(txt){ if(txt) this.log(txt); this.indent ++; },
  pop: function(){ this.indent--;},
  render: function(){
    if(this.dom){
      this.dom.innerHTML = this.cur;
    }
    this.cur = "";
    this.indent = 0;
  },
  log: function(obj){
    if(typeof obj !== "string"){
      obj = JSON.stringify(obj);
    }
    for(var i = 0; i < this.indent; i++){ this.cur += "\t"; };
    this.cur +=  obj + "\n";
  }
};

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

function hex_group( center, nodes, outputs ){
  return {
    nodes: nodes.slice(),
    center: center,
    outputs: outputs ? outputs.slice() : [],
    maxStorage:10,
    ticks: 0,
    maxTicks: 30,

neighbors: [null, null,null,null,null,null],
  outidx: 0,
  givetick: 0,
  maxgivetick: 100,
  storage: [],
  maxStorage: 5,
  mines:true,

    mesh: function(){
      return _.flattenDeep(_.map(this.nodes, (n)=>hex_mesh(layout.hexToPixel(this.center.add(n)), 40)));
    },
    rotateLeft: function(){
      console.log(this.nodes);

      for(var i=0; i < this.nodes.length; i++){
        this.nodes[i] = this.nodes[i].rotateLeft();
      }
      for(var i=0; i < this.outputs.length; i++){
        this.outputs[i] = this.outputs[i].rotateLeft();
      }
//      this.nodes = _.map(nodes, (n)=> return n.rotateLeft()); // why is this not identical? (only works once)
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
      if(this.mines){
        this.ticks++;
        if(this.ticks > this.maxTicks){
          this.ticks -= this.maxTicks;
          if(this.storage.length < this.maxStorage){
            this.storage.push({});
          }
        }
      }
      if(this.outputs){
        this.giveupdate(this.ticks);
      }
    },
  giveupdate: function(dt){
    if(this.givetick++ >= this.maxgivetick){
      this.givecurrentitem();
    }
  },
  givecurrentitem: function(){
    var target = this.neighbors[this.outidx++ % this.neighbors.length];
    if(target && target.take(this.storage[0],this.curoutput)){
      this.storage.pop(0);
      this.givetick = 0;
    }
  },
  take: function(item){
    if(this.storage.length < this.maxStorage){
      this.storage.push(item);
      return true;
    }
    return false;
  },

    render(){
      _.forEach(this.nodes, function(node){
        drawHex(node.add(center).add(new Hex.Hex(.0,.25)), 'rgb(100,100,100)', procgen.scale);
      })
      if(this.outputs){
        _.forEach(this.outputs, function(output){
                  drawHex(output.add(center).add(new Hex.Hex(.0,.25)), 'rgba(100,00,00,20)', procgen.scale);

        })
      }
      var pixLoc = layout.hexToPixel(this.center);
      ctx.font = (procgen.scale * 1.25) + 'px bold sans-serif';
      ctx.fillStyle='rgb(255,155,100)';
      ctx.fillText((this.storage.length)+'/'+this.maxStorage, pixLoc.x, pixLoc.y);
    }
  }
}

function drawHex(pos, color, radius){
      var pos = layout.hexToPixel(pos);
      ctx.fillStyle = color;
      ctx.fillRect(pos.x, pos.y,radius,radius);
}

function rgb_to_float(color) {
  return [color[0] / 255, color[1] / 255, color[2] / 255, color[3]];
}
var proc = function() {
  this.color = [244, 15, 155, 1.];
  this.scale = 45;
}
var procgen;
var canv;
var ctx;
var straight_miner =  [new Hex.Hex(0,0),new Hex.Hex(0,1), new Hex.Hex(0,2)];
var miner_gives =[new Hex.Hex(0,-1)]
var chest = [new Hex.Hex(0,0)];
var buildings = [new hex_group( new Hex.Hex(2,2), straight_miner, miner_gives),
                 new hex_group( new Hex.Hex(1,1), straight_miner, miner_gives ), 
                 new hex_group( new Hex.Hex(2,1), chest)
                 ];

buildings[1].rotateLeft();
buildings[1].rotateLeft();
buildings[1].rotateLeft();
buildings[1].rotateLeft();

buildings[0].neighbors = [buildings[2]];
buildings[1].neighbors = [buildings[2]];
buildings[2].mines = false;
buildings[2].maxStorage = 100;

function animationFrame(){
  layout.size = {x:procgen.scale, y:procgen.scale};
  ctx = canv.getContext('2d');
  ctx.fillStyle = 'rgb(10,25,54)'
  ctx.fillRect(0,0,canv.width,canv.height);

  for(var i=-5; i < 5; i++){
    for(var j=-5; j < 5;j++){
      drawHex(new Hex.Hex(i,j), 'rgb(100,200,200)', procgen.scale *1.49 );
    }
  }
  var hexmouse = layout.pixelToHex(mouse).round();
  drawHex(hexmouse, 'rgba(200,10,100,20)', 23);
  
  if(input.getKey(82).pressed){
    buildings[0].rotateLeft();
    console.log("rotating left");
  }

  _.forEach(buildings, function(building, index){
    building.render();
    building.update();
    if(building.intersects([hexmouse])){
      textBuffer.push("building " + index);
      textBuffer.log("stock "+building.storage.length + "/" + building.maxStorage);
      textBuffer.log("ticks "+building.ticks);
      textBuffer.pop();
    }
  });

  textBuffer.push("hexMouse");
  textBuffer.log(hexmouse);
  textBuffer.pop();
  input.debugRender(textBuffer);
  textBuffer.render();
  input.finishFrame();
  window.requestAnimationFrame(animationFrame);
}

window.buildings = buildings;
window.onload = function() {
  canv = document.createElement("canvas");
  canv.id = "mainCanvas"
  
  canv.width = 700;
  canv.height = 700;
  canv.style.width = 700;
  canv.style.height = 700;

  var log = document.createElement("pre");
  document.body.appendChild(canv);
  document.body.appendChild(log);
  log.style.float = "right"
  log.style.paddingTop = "500px"
  textBuffer.register(log);

  canv.onmousemove = function(evt){
   mouse.x = evt.clientX-20;
   mouse.y = evt.clientY-20;
   mouse.button = evt.button;
  };

  procgen = new proc();
  var gui = new dat.GUI();
  gui.addColor(procgen, 'color');
  gui.add(procgen, 'scale', 10, 100);
  window.requestAnimationFrame(animationFrame);
}

 