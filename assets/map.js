import{CONFIG}from"./config.js";
import{api,$,esc,normalizeText,readCache,storeCache,formatDate,toast,registerServiceWorker}from"./common.js";
import{CHINA_OUTLINE}from"./china-outline.js";
import{REGIONS}from"./regions.js";
import{FoodMap}from"./map-engine.js";

const state={all:[],filtered:[],map:null,province:"",query:""};
const list=$("#profile-list"),search=$("#search"),province=$("#province-filter"),status=$("#load-status");
document.title=CONFIG.CLASS_TITLE;$("#site-title").textContent=CONFIG.CLASS_TITLE;

function fillProvinces(){province.innerHTML='<option value="">全部省份</option>'+REGIONS.map(p=>`<option>${esc(p.name)}</option>`).join("")}
function setStatus(text,type=""){status.textContent=text;status.className=`load-status ${type}`}
function renderStats(rows){
  $("#stat-students").textContent=rows.length;
  $("#stat-cities").textContent=new Set(rows.map(x=>x.city).filter(Boolean)).size;
  $("#stat-provinces").textContent=new Set(rows.map(x=>x.province).filter(Boolean)).size;
  const latest=rows.map(x=>x.updated_at).filter(Boolean).sort().at(-1);$("#stat-updated").textContent=latest?formatDate(latest):"—";
}
function card(row){return`<article class="profile-card" data-id="${esc(row.id)}"><button class="card-focus" type="button" aria-label="在地图上查看 ${esc(row.public_name)}"><span class="avatar">${esc((row.public_name||"同").slice(0,1))}</span><span class="card-main"><strong>${esc(row.public_name||"未命名")}</strong><span>${esc(row.school||"未填写学校")}</span><span class="place">${esc((row.province||"")+(row.city||""))}</span>${row.message?`<em>${esc(row.message)}</em>`:""}</span></button></article>`}
function render(){
  const q=normalizeText(state.query);state.filtered=state.all.filter(x=>{
    const matchesProvince=!state.province||x.province===state.province;
    const text=normalizeText(`${x.public_name} ${x.school} ${x.province} ${x.city} ${x.message}`);
    return matchesProvince&&(!q||text.includes(q));
  });
  renderStats(state.filtered);state.map.setPoints(state.filtered);
  list.innerHTML=state.filtered.length?state.filtered.map(card).join(""):`<div class="empty"><span>🍚</span><strong>没有匹配的同学</strong><p>换一个昵称、学校或城市试试。</p></div>`;
}
function selectProfile(row){
  state.map.focus(row.lng,row.lat);const card=list.querySelector(`[data-id="${CSS.escape(String(row.id))}"]`);card?.scrollIntoView({behavior:"smooth",block:"center"});card?.classList.add("selected");setTimeout(()=>card?.classList.remove("selected"),1400);
}
async function load(){
  setStatus("正在读取班级地图…");
  try{
    const data=await api("public-profiles",{action:"list"});state.all=data.profiles||[];storeCache(CONFIG.CACHE_KEY,state.all);setStatus(state.all.length?`已载入 ${state.all.length} 位同学`:"地图已经就绪，等待同学公开资料");render();
  }catch(error){
    const cached=readCache(CONFIG.CACHE_KEY);if(cached?.value){state.all=cached.value;setStatus("网络连接失败，正在显示上次缓存的数据","warning");render()}else{setStatus(error.message,"error");render();toast(error.message,"error")}
  }
}
fillProvinces();state.map=new FoodMap($("#map"),CHINA_OUTLINE,{onPointClick:selectProfile});
search.addEventListener("input",()=>{state.query=search.value;render()});province.addEventListener("change",()=>{state.province=province.value;render()});
list.addEventListener("click",e=>{const card=e.target.closest(".profile-card");if(!card)return;const row=state.filtered.find(x=>String(x.id)===card.dataset.id);if(row)selectProfile(row)});
$("#zoom-in").onclick=()=>state.map.zoom(1.22);$("#zoom-out").onclick=()=>state.map.zoom(.82);$("#zoom-reset").onclick=()=>state.map.reset();$("#retry").onclick=load;
registerServiceWorker();load();
