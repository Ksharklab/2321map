import{api,$,esc,setBusy,toast,copyText,registerServiceWorker}from"./common.js";
let password="",rows=[],query="";
const tbody=$("#tbody"),status=$("#status"),credentials=$("#credentials");
function setStatus(v,type=""){status.textContent=v;status.className=`form-status ${type}`}
function filtered(){const q=query.toLowerCase();return rows.filter(x=>!q||`${x.public_name} ${x.school} ${x.province} ${x.city}`.toLowerCase().includes(q))}
function render(){
  const data=filtered();$("#admin-count").textContent=`${data.length} / ${rows.length}`;
  tbody.innerHTML=data.length?data.map(x=>`<tr data-id="${esc(x.id)}"><td><strong>${esc(x.public_name||"待填写")}</strong></td><td>${esc(x.school||"—")}</td><td>${esc((x.province||"")+(x.city||"")||"—")}</td><td><span class="badge ${x.is_visible?"good":"muted"}">${x.is_visible?"已公开":"未公开"}</span></td><td><span class="badge ${x.is_approved?"good":"warn"}">${x.is_approved?"已通过":"待审核"}</span></td><td class="actions"><button type="button" data-action="approve" class="small secondary">${x.is_approved?"取消审核":"通过审核"}</button><button type="button" data-action="rotate" class="small secondary">重置链接</button><button type="button" data-action="delete" class="small danger">删除</button></td></tr>`).join(""):`<tr><td colspan="6" class="table-empty">没有匹配记录</td></tr>`;
}
async function load(){const data=await api("admin-profiles",{action:"list",adminPassword:password});rows=data.profiles||[];render();setStatus(`名单已更新，共 ${rows.length} 位同学`,"success")}
$("#login-btn").addEventListener("click",async()=>{const b=$("#login-btn");password=$("#password").value;setBusy(b,true,"验证中…");try{await load();$("#login").hidden=true;$("#dashboard").hidden=false}catch(error){setStatus(error.message,"error")}finally{setBusy(b,false)}});
$("#create-form").addEventListener("submit",async e=>{e.preventDefault();const b=$("#create-btn");setBusy(b,true,"生成中…");try{const data=await api("admin-profiles",{action:"create",adminPassword:password,public_name:$("#new-name").value.trim()});const u=new URL("edit.html",location.href);u.searchParams.set("token",data.token);credentials.value=`编辑链接：${u}\n个人编辑码：${data.pin}`;$("#credential-box").hidden=false;$("#new-name").value="";await load();toast("专属链接已生成","success")}catch(error){setStatus(error.message,"error")}finally{setBusy(b,false)}});
$("#copy-credentials").onclick=()=>copyText(credentials.value).then(()=>toast("链接和编辑码已复制","success"));
$("#refresh").onclick=()=>load().catch(e=>setStatus(e.message,"error"));
$("#admin-search").addEventListener("input",e=>{query=e.target.value;render()});
tbody.addEventListener("click",async e=>{const b=e.target.closest("button[data-action]");if(!b)return;const tr=b.closest("tr"),row=rows.find(x=>String(x.id)===tr.dataset.id);if(!row)return;const action=b.dataset.action;setBusy(b,true,"处理中…");try{
  if(action==="approve")await api("admin-profiles",{action:"update",adminPassword:password,id:row.id,changes:{is_approved:!row.is_approved}});
  if(action==="rotate"){if(!confirm("重置后，旧链接和旧编辑码将失效。继续吗？"))return;const data=await api("admin-profiles",{action:"rotate",adminPassword:password,id:row.id});const u=new URL("edit.html",location.href);u.searchParams.set("token",data.token);credentials.value=`新编辑链接：${u}\n新个人编辑码：${data.pin}`;$("#credential-box").hidden=false;credentials.scrollIntoView({behavior:"smooth",block:"center"})}
  if(action==="delete"){if(!confirm(`确定删除“${row.public_name}”吗？此操作无法撤销。`))return;await api("admin-profiles",{action:"delete",adminPassword:password,id:row.id})}
  await load();
}catch(error){setStatus(error.message,"error")}finally{setBusy(b,false)}});
function download(filename,type,text){const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([text],{type}));a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)}
$("#export-json").onclick=()=>download("2321班名单.json","application/json",JSON.stringify(rows,null,2));
$("#export-csv").onclick=()=>{const head=["昵称","学校","省份","城市","是否公开","审核状态"],lines=rows.map(x=>[x.public_name,x.school,x.province,x.city,x.is_visible?"是":"否",x.is_approved?"通过":"待审核"].map(v=>`"${String(v??"").replaceAll('"','""')}"`).join(","));download("2321班名单.csv","text/csv;charset=utf-8","\ufeff"+[head.join(","),...lines].join("\n"))};
registerServiceWorker();
