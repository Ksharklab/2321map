import{createClient}from"npm:@supabase/supabase-js@2";
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"content-type","Access-Control-Allow-Methods":"POST,OPTIONS"};
const json=(x,s=200)=>new Response(JSON.stringify(x),{status:s,headers:{...cors,"content-type":"application/json;charset=utf-8"}});
const hash=async s=>Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s)))).map(x=>x.toString(16).padStart(2,"0")).join("");
const token=()=>Array.from(crypto.getRandomValues(new Uint8Array(32))).map(x=>x.toString(16).padStart(2,"0")).join("");
const pin=()=>String(crypto.getRandomValues(new Uint32Array(1))[0]%1000000).padStart(6,"0");
const db=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

Deno.serve(async req=>{if(req.method==="OPTIONS")return new Response("ok",{headers:cors});try{const{data,error}=await db.from("profiles").select("id,public_name,school,province,city,lng,lat,message,updated_at").eq("is_visible",true).eq("is_approved",true).order("city");if(error)throw error;return json({profiles:data})}catch(e){return json({error:e.message},500)}});
