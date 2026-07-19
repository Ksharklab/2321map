import{createClient}from"npm:@supabase/supabase-js@2";
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"content-type","Access-Control-Allow-Methods":"POST,OPTIONS"};
const json=(x,s=200)=>new Response(JSON.stringify(x),{status:s,headers:{...cors,"content-type":"application/json;charset=utf-8"}});
const hash=async s=>Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s)))).map(x=>x.toString(16).padStart(2,"0")).join("");
const token=()=>Array.from(crypto.getRandomValues(new Uint8Array(32))).map(x=>x.toString(16).padStart(2,"0")).join("");
const pin=()=>String(crypto.getRandomValues(new Uint32Array(1))[0]%1000000).padStart(6,"0");
const db=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

Deno.serve(async req=>{if(req.method==="OPTIONS")return new Response("ok",{headers:cors});try{const b=await req.json();if(String(b.adminPassword||"")!==Deno.env.get("ADMIN_PASSWORD"))return json({error:"管理员密码错误"},403);
if(b.action==="list"){const{data,error}=await db.from("profiles").select("id,public_name,school,province,city,is_visible,is_approved,created_at,updated_at").order("created_at");if(error)throw error;return json({profiles:data})}
if(b.action==="create"){const t=token(),p=pin();const{data,error}=await db.from("profiles").insert({public_name:String(b.public_name||"待填写").slice(0,30),edit_token_hash:await hash(t),pin_hash:await hash(p)}).select("id").single();if(error)throw error;return json({id:data.id,token:t,pin:p})}
if(b.action==="rotate"){const t=token(),p=pin();const{error}=await db.from("profiles").update({edit_token_hash:await hash(t),pin_hash:await hash(p)}).eq("id",b.id);if(error)throw error;return json({token:t,pin:p})}
if(b.action==="update"){const allowed={};for(const k of["is_approved","is_visible","public_name","school","province","city","message"])if(k in(b.changes||{}))allowed[k]=b.changes[k];const{error}=await db.from("profiles").update(allowed).eq("id",b.id);if(error)throw error;return json({ok:true})}
if(b.action==="delete"){const{error}=await db.from("profiles").delete().eq("id",b.id);if(error)throw error;return json({ok:true})}
return json({error:"未知操作"},400)}catch(e){return json({error:e.message},500)}});
