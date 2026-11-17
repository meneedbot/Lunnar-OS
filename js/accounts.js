(function(){
// >>> Paste your Shared DB URL between the quotes ONCE (e.g. https://yourproject-default-rtdb.firebaseio.com).
// Every build made from this file then connects to the same database automatically, so accounts,
// game requests, approvals and published games are shared between all builds and all people.
const DEFAULT_CLOUD='';
const K='lnr_cfg',raw=()=>{try{return JSON.parse(localStorage.getItem(K)||'{}')}catch(e){return{}}},
cfg=()=>{const c=raw();if(!(c.cloud&&c.cloud.trim())&&DEFAULT_CLOUD)c.cloud=DEFAULT_CLOUD;return c},
L=window.LNR={me:null,published:[],cfg,saveCfg:c=>localStorage.setItem(K,JSON.stringify(Object.assign(raw(),c)))};
const base=()=>{let u=String(cfg().cloud||'').trim();if(!u)return null;if(!/^https?:\/\//i.test(u))u='https://'+u;return u.replace(/\/+$/,'')+'/lnr/'};
const net=async(u,o)=>{let r;try{r=await fetch(u,o)}catch(e){throw new Error('Cannot reach the Shared DB - check the URL and your connection')}
 if(!r.ok)throw new Error(r.status===401||r.status===403?'Shared DB refused access - its rules must allow read and write':r.status===404?'Shared DB URL not found - check it':'Shared DB error '+r.status);return r};
const IDB=(()=>{let d;const op=()=>d||(d=new Promise((res,rej)=>{if(!window.indexedDB)return rej('no idb');const r=indexedDB.open('lnr_store',1);r.onupgradeneeded=()=>r.result.createObjectStore('kv');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)}));
const tx=async(m,f)=>{const db=await op();return new Promise((res,rej)=>{const t=db.transaction('kv',m);let q;try{q=f(t.objectStore('kv'))}catch(e){return rej(e)}t.oncomplete=()=>res(q&&q.result);t.onerror=t.onabort=()=>rej(t.error)})};
return{get:k=>tx('readonly',s=>s.get(k)),set:(k,v)=>tx('readwrite',s=>s.put(v,k)),del:k=>tx('readwrite',s=>s.delete(k)),keys:()=>tx('readonly',s=>s.getAllKeys())}})();
L.get=async p=>{const b=base();if(b){const r=await net(b+p+'.json');return r.json()}
 const k='lnr:'+p;let v;try{v=await IDB.get(k)}catch(e){}
 if(v!==undefined)return JSON.parse(v);const l=localStorage.getItem(k);if(l!==null)return JSON.parse(l);
 const pre=k+'/',o={};let ks=[];try{ks=await IDB.keys()}catch(e){}for(let i=0;i<localStorage.length;i++)ks.push(localStorage.key(i));
 for(const x of new Set(ks)){if(typeof x!=='string'||!x.startsWith(pre))continue;const rest=x.slice(pre.length);if(rest.includes('/'))continue;const g=await L.get(p+'/'+rest);if(g!=null)o[rest]=g}
 return Object.keys(o).length?o:null};
L.set=async(p,v)=>{const b=base();if(b){await net(b+p+'.json',{method:'PUT',body:JSON.stringify(v)});return}
 const k='lnr:'+p;if(v==null){try{await IDB.del(k)}catch(e){}try{localStorage.removeItem(k)}catch(e){}return}
 const s=JSON.stringify(v);try{await IDB.set(k,s);try{localStorage.removeItem(k)}catch(e){}}catch(e){localStorage.setItem(k,s)}};

const hash=async s=>{if(window.crypto&&crypto.subtle)return[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))].map(b=>b.toString(16).padStart(2,'0')).join('');let h=5381;for(const c of s)h=(h*33^c.charCodeAt(0))>>>0;return'x'+h};
L.auth=async(n,pw,create)=>{n=n.trim();if(!/^[\w-]{2,20}$/.test(n))throw'Username: 2-20 letters, numbers, - or _';const k=n.toLowerCase(),u=await L.get('users/'+k),h=await hash(k+':'+pw);
 if(create){if(u)throw'That username is taken';if(pw.length<4)throw'Password must be 4+ characters';await L.set('users/'+k,{name:n,h,t:Date.now()})}else if(!u||u.h!==h)throw'Wrong username or password';

 const nm=(u&&u.name)||n;if(L.me&&L.me.name.toLowerCase()!==k){await L.saveGame();L.wipe()}
 L.me={name:nm,admin:k==='dsandwich'};await L.loadGame();
 if(L.me.admin)APPS.admin={title:'Publish Requests',icon:'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%27http%3A//www.w3.org/2000/svg%27%20viewBox%3D%270%200%20128%20128%27%3E%3Crect%20width%3D%27128%27%20height%3D%27128%27%20rx%3D%2728%27%20fill%3D%27%23b91c1c%27/%3E%3Ctext%20x%3D%2764%27%20y%3D%2782%27%20font-size%3D%2760%27%20text-anchor%3D%27middle%27%20fill%3D%27%23fff%27%3E%F0%9F%9B%A1%3C/text%3E%3C/svg%3E',pinned:true};else delete APPS.admin;
 await L.flush().catch(()=>{});await L.refresh();try{renderUI()}catch(e){}};
const OS=/^(c_pins|cine_|lunaar_|ps_|lnr|cinify|ciri|navSet|mathjax|_)/i,gk=()=>Object.keys(localStorage).filter(k=>!OS.test(k));
L.snap=()=>{const o={};gk().forEach(k=>o[k]=localStorage.getItem(k));return o};
L.saveGame=async()=>{if(L.me)try{await L.set('saves/'+L.me.name.toLowerCase(),L.snap())}catch(e){}};
L.wipe=()=>gk().forEach(k=>localStorage.removeItem(k));
L.loadGame=async()=>{try{const s=await L.get('saves/'+L.me.name.toLowerCase());if(s)Object.keys(s).forEach(k=>localStorage.setItem(k,s[k]))}catch(e){}};
L.logout=async()=>{await L.saveGame();L.wipe();L.me=null;delete APPS.admin;try{renderUI()}catch(e){}};
setInterval(()=>L.saveGame(),30000);addEventListener('pagehide',()=>L.saveGame());
L.refresh=async()=>{try{L.published=Object.values(await L.get('published')||{}).filter(Boolean)}catch(e){}};
L.submit=async r=>{const me=(L.me&&L.me.name)||'guest',mk=me.toLowerCase(),nm=String(r.name||'').trim().toLowerCase();
 // already published under this account? then it's an update: goes live immediately, no review
 let key=null;
 if(L.me){try{const pub=Object.values(await L.get('published')||{}).filter(Boolean);
  const hit=pub.find(g=>String(g.name||'').trim().toLowerCase()===nm&&String(g.owner||g.by||'').toLowerCase()===mk);
  if(hit)key=String(hit.id).replace(/^pub_/,'');
  else{const rq=Object.values(await L.get('requests')||{}).filter(q=>q&&q.status==='approved'&&String(q.by||'').toLowerCase()===mk&&String(q.name||'').trim().toLowerCase()===nm);
   for(const q of rq){if(await L.get('published/'+q.id)){key=q.id;break}}}}catch(e){}}
 if(key){const old=await L.get('published/'+key)||{};
  await L.set('published/'+key,Object.assign({},old,{id:'pub_'+key,name:r.name,desc:r.desc||old.desc||('By '+me),htmlContent:r.html,by:me,owner:mk,updated:Date.now()}));
  await L.refresh();return{id:key,shared:!!base(),updated:true}}
 const id='r'+Date.now()+Math.random().toString(36).slice(2,6);await L.set('requests/'+id,{id,name:r.name,desc:r.desc,html:r.html,by:me,t:Date.now(),status:'pending'});return{id,shared:!!base()}};
L.decide=async(id,ok)=>{if(!L.me||!L.me.admin)throw'Admin only';const q=await L.get('requests/'+id);if(!q)throw new Error('Request not found');
 if(ok)await L.set('published/'+id,{id:'pub_'+id,name:q.name,desc:q.desc||('By '+q.by),img:'',htmlContent:q.html,price:'Free',featured:false,by:q.by,owner:String(q.by||'').toLowerCase()});
 q.status=ok?'approved':'rejected';await L.set('requests/'+id,q);await L.refresh()};
// Requests made while no Shared DB was set live only in that browser - push them up once a DB is available
L.flush=async()=>{if(!base())return 0;let ks=[];try{ks=await IDB.keys()}catch(e){}for(let i=0;i<localStorage.length;i++)ks.push(localStorage.key(i));let n=0;
 for(const k of new Set(ks)){if(typeof k!=='string'||!/^lnr:requests\/[^\/]+$/.test(k))continue;let v;try{v=await IDB.get(k)}catch(e){}if(v===undefined||v===null)v=localStorage.getItem(k);if(v==null)continue;
  try{await net(base()+k.slice(4)+'.json',{method:'PUT',body:v});try{await IDB.del(k)}catch(e){}try{localStorage.removeItem(k)}catch(e){}n++}catch(e){break}}return n};
// keep published games / pending uploads fresh for everyone without a reload
L.flush().catch(()=>{}).then(()=>L.refresh());setInterval(()=>{L.flush().catch(()=>{});L.refresh()},60000);
const ls=document.getElementById('lock-screen'),real=window.unlockSystem;
const box=document.createElement('div');box.id='lnr-login';
box.style.cssText='position:absolute;left:50%;bottom:12%;transform:translateX(-50%);z-index:20;width:300px;display:none;flex-direction:column;gap:10px;padding:20px;background:rgba(10,10,10,.82);backdrop-filter:blur(14px);border:1px solid #444;border-radius:16px;font-family:var(--font-main)';
box.innerHTML='<input id="lnr-u" placeholder="Username" autocomplete="username"><input id="lnr-p" type="password" placeholder="Password" autocomplete="current-password"><button id="lnr-go">Log in</button><a id="lnr-sw" style="color:#aaa;text-align:center;cursor:pointer;font-size:13px">No account? Create one</a><a id="lnr-out" style="color:#888;text-align:center;cursor:pointer;font-size:12px;display:none">Log out</a><div id="lnr-e" style="color:#f77;font-size:13px;text-align:center;min-height:16px"></div>';
box.addEventListener('click',e=>e.stopPropagation());ls.appendChild(box);
const st=document.createElement('style');st.textContent='#lnr-login *{user-select:text!important}#lnr-login input{background:#111;border:1px solid #444;color:#fff;padding:11px;border-radius:8px;font:600 15px var(--font-main)}#lnr-login button{background:#fff;color:#000;border:0;padding:11px;border-radius:8px;font:700 15px var(--font-main);cursor:pointer}';document.head.appendChild(st);
let create=false;const $=i=>document.getElementById(i);
$('lnr-sw').onclick=()=>{create=!create;$('lnr-go').textContent=create?'Create account':'Log in';$('lnr-sw').textContent=create?'Have an account? Log in':'No account? Create one'};
const go=async()=>{try{$('lnr-e').textContent='';await L.auth($('lnr-u').value,$('lnr-p').value,create);$('lnr-p').value='';box.style.display='none';real()}catch(e){$('lnr-e').textContent=String(e.message||e)}};
$('lnr-go').onclick=go;box.addEventListener('keydown',e=>{if(e.key==='Enter')go()});
$('lnr-out').onclick=async()=>{await L.logout();$('lnr-u').value='';$('lnr-p').value='';$('lnr-out').style.display='none'};
window.unlockSystem=function(){$('lnr-out').style.display=L.me?'block':'none';box.style.display='flex';if(L.me&&!$('lnr-u').value)$('lnr-u').value=L.me.name;($('lnr-u').value?$('lnr-p'):$('lnr-u')).focus()};
APPS.builder={title:'Lunaar Builder',icon:'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%27http%3A//www.w3.org/2000/svg%27%20viewBox%3D%270%200%20128%20128%27%3E%3Crect%20width%3D%27128%27%20height%3D%27128%27%20rx%3D%2728%27%20fill%3D%27%236d28d9%27/%3E%3Ctext%20x%3D%2764%27%20y%3D%2782%27%20font-size%3D%2760%27%20text-anchor%3D%27middle%27%20fill%3D%27%23fff%27%3E%E2%9C%A8%3C/text%3E%3C/svg%3E',pinned:true};
})();
