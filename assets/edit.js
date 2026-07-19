import{api,$,setBusy,toast,registerServiceWorker}from"./common.js";
import{REGIONS}from"./regions.js";

const token=new URLSearchParams(location.search).get("token")||"";let pin="",profile=null;
const form=$("#profile-form"),province=$("#province"),city=$("#city"),status=$("#status");
function setStatus(v,type=""){status.textContent=v;status.className=`form-status ${type}`}
function fillProvince(target=""){
  province.innerHTML='<option value="">请选择省份</option>'+REGIONS.map(p=>`<option value="${p.code}">${p.name}</option>`).join("");
  if(target){const p=REGIONS.find(x=>x.code===target||x.name===target);if(p)province.value=p.code}
}
function fillCity(target="",fallback=null){
  const p=REGIONS.find(x=>x.code===province.value);city.innerHTML='<option value="">请选择城市/地区</option>';
  if(p)for(const c of p.cities){const o=new Option(c.name,c.code);o.dataset.lng=c.lng;o.dataset.lat=c.lat;city.add(o)}
  const match=p?.cities.find(x=>x.code===target||x.name===target);if(match)city.value=match.code;
  else if(fallback?.name){const o=new Option(`${fallback.name}（原资料）`,`legacy`);o.dataset.lng=fallback.lng;o.dataset.lat=fallback.lat;o.dataset.name=fallback.name;city.add(o);city.value="legacy"}
  updatePlacePreview();
}
function updatePlacePreview(){const p=REGIONS.find(x=>x.code===province.value),o=city.selectedOptions[0];$("#place-preview").textContent=p&&o?.value?`${p.name} · ${o.textContent}`:"尚未选择地区"}
province.addEventListener("change",()=>fillCity());city.addEventListener("change",updatePlacePreview);
fillProvince();
if(!token){$("#unlock").hidden=true;$("#missing-token").hidden=false}
$("#verify").addEventListener("click",async()=>{
  const button=$("#verify");pin=$("#pin").value.trim();if(!token)return setStatus("链接缺少 token，请使用管理员发给你的专属链接","error");if(!/^\d{4,8}$/.test(pin))return setStatus("请输入管理员提供的编辑码","error");
  setBusy(button,true,"验证中…");setStatus("");
  try{
    profile=(await api("student-profile",{action:"read",token,pin})).profile;
    $("#name").value=profile.public_name||"";$("#school").value=profile.school||"";$("#message").value=profile.message||"";$("#visible").checked=!!profile.is_visible;
    fillProvince(profile.province_adcode||profile.province);fillCity(profile.city_adcode||profile.city,{name:profile.city,lng:profile.lng,lat:profile.lat});
    $("#unlock").hidden=true;form.hidden=false;setStatus("验证成功，可以修改资料","success");
  }catch(error){setStatus(error.message,"error")}finally{setBusy(button,false)}
});
form.addEventListener("submit",async e=>{
  e.preventDefault();const button=$("#save");const p=REGIONS.find(x=>x.code===province.value),o=city.selectedOptions[0];
  if(!p||!o?.value)return setStatus("请选择省份和城市","error");
  const payload={public_name:$("#name").value.trim(),school:$("#school").value.trim(),province:p.name,province_adcode:p.code,city:o.dataset.name||o.textContent.replace("（原资料）",""),city_adcode:o.value,lng:Number(o.dataset.lng),lat:Number(o.dataset.lat),message:$("#message").value.trim(),is_visible:$("#visible").checked};
  setBusy(button,true,"保存中…");setStatus("");
  try{await api("student-profile",{action:"update",token,pin,profile:payload});setStatus("保存成功，公开地图稍后会显示最新资料","success");toast("资料已保存","success")}catch(error){setStatus(error.message,"error")}finally{setBusy(button,false)}
});
registerServiceWorker();
