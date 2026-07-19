const NS="http://www.w3.org/2000/svg";
const el=(tag,attrs={})=>{const n=document.createElementNS(NS,tag);for(const[k,v]of Object.entries(attrs))n.setAttribute(k,v);return n};

function geometryCoordinates(g){
  if(!g)return[];
  if(g.type==="Polygon")return g.coordinates.flat(1);
  if(g.type==="MultiPolygon")return g.coordinates.flat(2);
  return[];
}
function rings(g){
  if(g.type==="Polygon")return g.coordinates;
  if(g.type==="MultiPolygon")return g.coordinates.flat(1);
  return[];
}

export class FoodMap{
  constructor(container,geojson,{onPointClick}={}){
    this.container=container;this.geojson=geojson;this.onPointClick=onPointClick;
    this.w=1000;this.h=720;this.padding=38;this.scale=1;this.tx=0;this.ty=0;this.drag=null;
    this.svg=el("svg",{viewBox:`0 0 ${this.w} ${this.h}`,role:"img","aria-label":"中国地图与同学所在城市标记",class:"china-svg"});
    this.grid=el("g",{class:"map-grid"});this.stage=el("g",{class:"map-stage"});this.land=el("g",{class:"map-land"});this.points=el("g",{class:"map-points"});
    this.stage.append(this.grid,this.land,this.points);this.svg.append(this.stage);container.replaceChildren(this.svg);
    this.tip=document.createElement("div");this.tip.className="map-tooltip";this.tip.hidden=true;container.append(this.tip);
    this.computeProjection();this.drawGrid();this.drawLand();this.bind();
  }
  computeProjection(){
    const coords=this.geojson.features.flatMap(f=>geometryCoordinates(f.geometry));
    const xs=coords.map(c=>c[0]),ys=coords.map(c=>c[1]);
    this.minLon=Math.min(...xs);this.maxLon=Math.max(...xs);this.minLat=Math.min(...ys);this.maxLat=Math.max(...ys);
    const sx=(this.w-this.padding*2)/(this.maxLon-this.minLon),sy=(this.h-this.padding*2)/(this.maxLat-this.minLat);
    this.k=Math.min(sx,sy);this.ox=(this.w-(this.maxLon-this.minLon)*this.k)/2;this.oy=(this.h-(this.maxLat-this.minLat)*this.k)/2;
  }
  project([lon,lat]){return[this.ox+(lon-this.minLon)*this.k,this.oy+(this.maxLat-lat)*this.k]}
  pathFor(g){return rings(g).map(r=>r.map((c,i)=>{const[x,y]=this.project(c);return`${i?"L":"M"}${x.toFixed(2)},${y.toFixed(2)}`}).join("")+"Z").join("")}
  drawGrid(){
    for(let lon=75;lon<=135;lon+=10){const a=this.project([lon,18]),b=this.project([lon,54]);this.grid.append(el("line",{x1:a[0],y1:a[1],x2:b[0],y2:b[1]}))}
    for(let lat=20;lat<=50;lat+=10){const a=this.project([73,lat]),b=this.project([135,lat]);this.grid.append(el("line",{x1:a[0],y1:a[1],x2:b[0],y2:b[1]}))}
  }
  drawLand(){
    this.geojson.features.forEach(f=>{const p=el("path",{d:this.pathFor(f.geometry),class:"land-shape","data-name":f.properties?.name||""});this.land.append(p)})
  }
  setPoints(rows){
    this.points.replaceChildren();
    const groups=new Map();
    rows.filter(x=>Number.isFinite(+x.lng)&&Number.isFinite(+x.lat)).forEach(x=>{const k=`${(+x.lng).toFixed(3)},${(+x.lat).toFixed(3)}`;(groups.get(k)||groups.set(k,[]).get(k)).push(x)});
    for(const group of groups.values())group.forEach((row,index)=>{
      const[x,y]=this.project([+row.lng,+row.lat]);const angle=(index/group.length)*Math.PI*2;const radius=group.length>1?Math.min(17,5+group.length*1.7):0;
      const px=x+Math.cos(angle)*radius,py=y+Math.sin(angle)*radius;
      const g=el("g",{class:"map-marker",transform:`translate(${px},${py})`,tabindex:"0",role:"button","aria-label":`${row.public_name}，${row.city||row.province||""}`});
      const halo=el("circle",{r:"13",class:"marker-halo"});const dot=el("circle",{r:"6.2",class:"marker-dot"});
      const label=el("text",{x:"10",y:"4",class:"marker-label"});label.textContent=row.public_name||"同学";
      g.append(halo,dot,label);g.addEventListener("mouseenter",e=>this.showTip(e,row));g.addEventListener("mousemove",e=>this.moveTip(e));g.addEventListener("mouseleave",()=>this.hideTip());
      g.addEventListener("focus",e=>this.showTip(e,row,true));g.addEventListener("blur",()=>this.hideTip());g.addEventListener("click",()=>this.onPointClick?.(row));g.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();this.onPointClick?.(row)}});
      this.points.append(g);
    });
  }
  showTip(e,row,keyboard=false){
    this.tip.innerHTML=`<strong>${this.escape(row.public_name)}</strong><span>${this.escape(row.school||"未填写学校")}</span><span>${this.escape((row.province||"")+(row.city||""))}</span>${row.message?`<em>${this.escape(row.message)}</em>`:""}`;
    this.tip.hidden=false;if(keyboard){this.tip.style.left="16px";this.tip.style.top="16px"}else this.moveTip(e);
  }
  moveTip(e){const r=this.container.getBoundingClientRect();this.tip.style.left=`${Math.min(r.width-220,Math.max(8,e.clientX-r.left+12))}px`;this.tip.style.top=`${Math.max(8,e.clientY-r.top-16)}px`}
  hideTip(){this.tip.hidden=true}
  escape(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
  bind(){
    this.svg.addEventListener("wheel",e=>{e.preventDefault();this.zoom(e.deltaY<0?1.18:0.85)},{passive:false});
    this.svg.addEventListener("pointerdown",e=>{this.drag={x:e.clientX,y:e.clientY,tx:this.tx,ty:this.ty};this.svg.setPointerCapture(e.pointerId);this.svg.classList.add("dragging")});
    this.svg.addEventListener("pointermove",e=>{if(!this.drag)return;this.tx=this.drag.tx+(e.clientX-this.drag.x);this.ty=this.drag.ty+(e.clientY-this.drag.y);this.applyTransform()});
    const end=()=>{this.drag=null;this.svg.classList.remove("dragging")};this.svg.addEventListener("pointerup",end);this.svg.addEventListener("pointercancel",end);
  }
  zoom(factor){this.scale=Math.min(4,Math.max(1,this.scale*factor));if(this.scale===1){this.tx=0;this.ty=0}this.applyTransform()}
  reset(){this.scale=1;this.tx=0;this.ty=0;this.applyTransform()}
  applyTransform(){this.stage.setAttribute("transform",`translate(${this.tx} ${this.ty}) scale(${this.scale})`)}
  focus(lng,lat){const[x,y]=this.project([+lng,+lat]);this.scale=2.1;this.tx=this.w/2-x*this.scale;this.ty=this.h/2-y*this.scale;this.applyTransform()}
}
