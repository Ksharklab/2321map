import{CONFIG}from"./config.js";

export const $=(s,r=document)=>r.querySelector(s);
export const $$=(s,r=document)=>[...r.querySelectorAll(s)];
export const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
export const sleep=ms=>new Promise(r=>setTimeout(r,ms));

export async function api(name,body={},options={}){
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),options.timeout||CONFIG.REQUEST_TIMEOUT);
  try{
    const response=await fetch(`${CONFIG.SUPABASE_URL}/functions/v1/${name}`,{
      method:"POST",
      headers:{"content-type":"application/json"},
      body:JSON.stringify(body),
      signal:options.signal||controller.signal
    });
    const data=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(data.error||`请求失败（${response.status}）`);
    return data;
  }catch(error){
    if(error.name==="AbortError")throw new Error("连接超时，请检查网络后重试");
    throw error;
  }finally{clearTimeout(timeout)}
}

export function setBusy(button,busy,text="处理中…"){
  if(!button)return;
  if(busy){button.dataset.oldText=button.textContent;button.disabled=true;button.textContent=text}
  else{button.disabled=false;button.textContent=button.dataset.oldText||button.textContent}
}

export function toast(message,type="info"){
  let box=$("#toast-stack");
  if(!box){box=document.createElement("div");box.id="toast-stack";box.className="toast-stack";document.body.append(box)}
  const item=document.createElement("div");item.className=`toast toast-${type}`;item.textContent=message;box.append(item);
  requestAnimationFrame(()=>item.classList.add("show"));
  setTimeout(()=>{item.classList.remove("show");setTimeout(()=>item.remove(),220)},3200);
}

export function storeCache(key,value){try{localStorage.setItem(key,JSON.stringify({savedAt:Date.now(),value}))}catch{}}
export function readCache(key){try{return JSON.parse(localStorage.getItem(key)||"null")}catch{return null}}
export function formatDate(v){if(!v)return"";try{return new Intl.DateTimeFormat("zh-CN",{month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"}).format(new Date(v))}catch{return""}}
export function normalizeText(v){return String(v??"").trim().toLowerCase()}
export function copyText(text){
  if(navigator.clipboard?.writeText)return navigator.clipboard.writeText(text);
  const t=document.createElement("textarea");t.value=text;t.style.position="fixed";t.style.opacity="0";document.body.append(t);t.select();document.execCommand("copy");t.remove();return Promise.resolve();
}

export function registerServiceWorker(){
  if("serviceWorker"in navigator&&location.protocol.startsWith("http"))navigator.serviceWorker.register("./sw.js").catch(()=>{});
}
