
/* APP_HTML is loaded by js/data.js */
/* MEDIA_B64 is loaded by js/data.js */
var _mediaCache={};
var GEN_WP={aurora:['#0f2027','#2c5364','#7b2ff7','#00e5ff'],midnight:['#000000','#0b1026','#1b2a5a','#4a2c7a'],emerald:['#001a0f','#05472a','#0fa35c','#b6ffd8'],sunset:['#1a0b2e','#6a1b4d','#ff5e62','#ffc371'],hunt:['#0a0a0a','#3b0d0d','#8b1a1a','#d4a017']};
function resolveMedia(u){
  if(!u) return u;
  if(u.indexOf('media:')===0){
    var k=u.slice(6); if(_mediaCache[u]) return _mediaCache[u];
    var b=atob(MEDIA_B64[k]),n=b.length,a=new Uint8Array(n);
    for(var i=0;i<n;i++)a[i]=b.charCodeAt(i);
    return _mediaCache[u]=URL.createObjectURL(new Blob([a],{type:'video/mp4'}));
  }
  if(u.indexOf('gen:')===0){
    if(_mediaCache[u]) return _mediaCache[u];
    var c=document.createElement('canvas');c.width=1280;c.height=720;var x=c.getContext('2d'),s=GEN_WP[u.slice(4)]||GEN_WP.aurora;
    var g=x.createLinearGradient(0,0,1280,720);s.forEach(function(col,i){g.addColorStop(i/(s.length-1),col);});
    x.fillStyle=g;x.fillRect(0,0,1280,720);
    var r=x.createRadialGradient(900,200,0,900,200,500);r.addColorStop(0,'rgba(255,255,255,0.18)');r.addColorStop(1,'rgba(255,255,255,0)');
    x.fillStyle=r;x.fillRect(0,0,1280,720);
    return _mediaCache[u]=c.toDataURL('image/jpeg',0.88);
  }
  return u;
}
function escMinimize(e){
  if(e.key!=='Escape'||e.defaultPrevented) return;
  if(typeof isCiriActive!=='undefined'&&isCiriActive) return;
  if(typeof activeWindowId!=='undefined'&&activeWindowId){
    var w=document.getElementById('win-'+activeWindowId);
    if(w&&!w.classList.contains('minimized')){minimizeWindow(activeWindowId);try{window.focus()}catch(x){}}
  }
}
document.addEventListener('keydown',escMinimize);
window.popOutGame=function(id){
  var w=window.open('about:blank','_blank');
  if(!w){alert('Your browser blocked the new tab. Allow popups for this page.');return;}
  w.document.open();w.document.write(GAME_HTML[id]||APP_HTML[id]||'');w.document.close();
};
var _gameN=0, GAME_HTML={};
window.openGameWindow=function(title,html,icon,url){
  var id='game-'+(++_gameN);
  APPS[id]={title:title,icon:icon||(APPS.files?APPS.files.icon:''),pinned:true};
  if(url&&!/<base[\s>]/i.test(html)){
    var base=url.replace(/[?#].*$/,'').replace(/[^\/]*$/,'');
    var tag='<base href="'+base+'">';
    html=/<head[^>]*>/i.test(html)?html.replace(/<head[^>]*>/i,function(m){return m+tag}):tag+html;
  }
  GAME_HTML[id]=html; renderUI(); openWindow(id);
  var fr=document.getElementById('frame-'+id);
  var errs=[];
  try{
    var cw=fr.contentWindow, d=cw.document; d.open();
    cw.addEventListener('error',function(e){
      var t=e.target;
      if(t&&t!==cw&&(t.src||t.href)) errs.push('file failed: '+String(t.src||t.href).split('/').slice(-2).join('/'));
      else errs.push(String(e.message||'error')+(e.filename?' ('+String(e.filename).split('/').pop()+')':''));
    },true);
    cw.addEventListener('unhandledrejection',function(e){ errs.push('promise: '+(e.reason&&e.reason.message||e.reason)); });
    d.write(html); d.close();
  }catch(e){ fr.srcdoc=html; }

(function(){var HS=['fastly.jsdelivr.net','gcore.jsdelivr.net','testingcf.jsdelivr.net'],n=0,lock=0;
 function reload(){lock=0;errs.length=0;GAME_HTML[id]=html;try{var w=fr.contentWindow,dd=w.document;dd.open();w.addEventListener('error',chk,true);dd.write(html);dd.close()}catch(e){fr.srcdoc=html}}
 function viaRaw(src){var m=/jsdelivr\.net\/gh\/([^\/]+)\/([^@\/]+)@([^\/]+)\/([^?#]+)/.exec(src),b=/<base href="([^"]+)"/.exec(html);if(!m||!b)return;var tail=src.slice(src.indexOf(b[1])===0?b[1].length:0).replace(/[?#].*$/,'');
  fetch('https://raw.githubusercontent.com/'+m[1]+'/'+m[2]+'/'+m[3]+'/'+m[4]).then(function(r){if(!r.ok)throw 0;return r.blob()}).then(function(bl){var u=URL.createObjectURL(new Blob([bl],{type:'text/javascript'}));
   html=html.split('"'+tail+'"').join('"'+u+'"').split("'"+tail+"'").join("'"+u+"'");reload()}).catch(function(){})}
 function chk(e){var t=e.target;if(!t||!t.src||!/jsdelivr\.net/.test(t.src)||lock)return;lock=1;var s=t.src;setTimeout(function(){lock=0},2500);
  if(n<HS.length){var h=HS[n++];html=html.replace(/(?:cdn|fastly|gcore|testingcf)\.jsdelivr\.net/g,h);setTimeout(reload,0)}else viaRaw(s)}
 try{fr.contentWindow.addEventListener('error',chk,true)}catch(e){}
})();
  setTimeout(function(){
    var w=document.getElementById('win-'+id); if(!w||w.querySelector('.game-diag')) return;
    var empty=false; try{ var bd=fr.contentDocument&&fr.contentDocument.body; empty=!bd||!bd.children.length; }catch(e){}
    if(!errs.length&&!empty) return;
    var bar=document.createElement('div'); bar.className='game-diag';
    bar.style.cssText='position:absolute;left:12px;right:12px;bottom:12px;z-index:50;background:rgba(20,10,10,.94);border:1px solid #6b2434;color:#ffb3bf;font:12px/1.5 system-ui,sans-serif;padding:10px 12px;border-radius:10px;max-height:40%;overflow:auto';
    var shown=errs.slice(0,4).map(function(s){return '&bull; '+String(s).replace(/</g,'&lt;')}).join('<br>')||'The game page is empty.';
    bar.innerHTML='<b>This game may not be loading.</b><br>'+shown+'<br><button style="margin-top:6px;margin-right:6px;padding:4px 10px;cursor:pointer" onclick="popOutGame(\''+id+'\')">Open in new tab</button><button style="margin-top:6px;padding:4px 10px;cursor:pointer" onclick="this.parentNode.remove()">Hide</button>';
    (w.querySelector('.win-body')||w).appendChild(bar);
  },6000);
  return id;
};
function isImgUrl(u){return /\.(png|jpg|jpeg|gif)$/i.test(u)||u.indexOf('data:image')===0;}
var _SYSTEM_PATHS = ["C:/Windows/System32/kernel32.dll", "/var/www/html/cine-os/", "https://cine-os.local/api/v1/auth"];
var _devBuildVer = "3.0.1";

var APPS = {
    'term': {title: 'Spotify', path: 'script/Apps/Spotify/index.html', icon: 'https://cdn.pixabay.com/photo/2016/10/22/00/15/spotify-1759471_1280.jpg', pinned: true},
    'files': {title: 'PS5 Emu', path: 'script/Apps/Ps5/index.html', icon: 'data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20viewBox%3D%270%200%20128%20128%27%3E%3Cdefs%3E%3ClinearGradient%20id%3D%27b%27%20x1%3D%270%27%20y1%3D%270%27%20x2%3D%271%27%20y2%3D%271%27%3E%3Cstop%20offset%3D%270%27%20stop-color%3D%27%231c6bff%27%2F%3E%3Cstop%20offset%3D%271%27%20stop-color%3D%27%230a1a5c%27%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%27128%27%20height%3D%27128%27%20rx%3D%2728%27%20fill%3D%27url%28%23b%29%27%2F%3E%3Cpath%20d%3D%27M26%2078c0-18%208-30%2020-30h36c12%200%2020%2012%2020%2030%200%2010-5%2016-12%2012l-10-8H48l-10%208c-7%204-12-2-12-12z%27%20fill%3D%27%23fff%27%2F%3E%3Ccircle%20cx%3D%2748%27%20cy%3D%2766%27%20r%3D%270%27%20fill%3D%27%230a1a5c%27%2F%3E%3Cpath%20d%3D%27M44%2058v16M36%2066h16%27%20stroke%3D%27%230a1a5c%27%20stroke-width%3D%275%27%20stroke-linecap%3D%27round%27%2F%3E%3Ccircle%20cx%3D%2786%27%20cy%3D%2760%27%20r%3D%274%27%20fill%3D%27%230a1a5c%27%2F%3E%3Ccircle%20cx%3D%2796%27%20cy%3D%2770%27%20r%3D%274%27%20fill%3D%27%230a1a5c%27%2F%3E%3Ccircle%20cx%3D%2776%27%20cy%3D%2770%27%20r%3D%274%27%20fill%3D%27%230a1a5c%27%2F%3E%3Ccircle%20cx%3D%2786%27%20cy%3D%2780%27%20r%3D%274%27%20fill%3D%27%230a1a5c%27%2F%3E%3Crect%20x%3D%271.5%27%20y%3D%271.5%27%20width%3D%27125%27%20height%3D%27125%27%20rx%3D%2727%27%20fill%3D%27none%27%20stroke%3D%27%23fff%27%20stroke-opacity%3D%27.15%27%20stroke-width%3D%273%27%2F%3E%3C%2Fsvg%3E', pinned: true},
    'gemini': {title: 'Gemini', path: 'script/Apps/Gemini/index.html', icon: 'data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20viewBox%3D%270%200%20128%20128%27%3E%3Cdefs%3E%3ClinearGradient%20id%3D%27bg%27%20x1%3D%270%27%20y1%3D%270%27%20x2%3D%271%27%20y2%3D%271%27%3E%3Cstop%20offset%3D%270%27%20stop-color%3D%27%231b2140%27%2F%3E%3Cstop%20offset%3D%271%27%20stop-color%3D%27%2307080f%27%2F%3E%3C%2FlinearGradient%3E%3ClinearGradient%20id%3D%27st%27%20x1%3D%270%27%20y1%3D%270%27%20x2%3D%271%27%20y2%3D%271%27%3E%3Cstop%20offset%3D%270%27%20stop-color%3D%27%234f9bff%27%2F%3E%3Cstop%20offset%3D%27.5%27%20stop-color%3D%27%239b6bff%27%2F%3E%3Cstop%20offset%3D%271%27%20stop-color%3D%27%23ff7ab6%27%2F%3E%3C%2FlinearGradient%3E%3CradialGradient%20id%3D%27gl%27%20cx%3D%27.5%27%20cy%3D%27.5%27%20r%3D%27.5%27%3E%3Cstop%20offset%3D%270%27%20stop-color%3D%27%238a6bff%27%20stop-opacity%3D%27.55%27%2F%3E%3Cstop%20offset%3D%271%27%20stop-color%3D%27%238a6bff%27%20stop-opacity%3D%270%27%2F%3E%3C%2FradialGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%27128%27%20height%3D%27128%27%20rx%3D%2728%27%20fill%3D%27url%28%23bg%29%27%2F%3E%3Ccircle%20cx%3D%2760%27%20cy%3D%2768%27%20r%3D%2752%27%20fill%3D%27url%28%23gl%29%27%2F%3E%3Cpath%20d%3D%27M60%2018C63%2050%2073%2060%20104%2068%2073%2076%2063%2086%2060%20118%2057%2086%2047%2076%2016%2068%2047%2060%2057%2050%2060%2018Z%27%20fill%3D%27url%28%23st%29%27%2F%3E%3Cpath%20d%3D%27M98%2014C99%2025%20103%2029%20114%2031%20103%2033%2099%2037%2098%2048%2097%2037%2093%2033%2082%2031%2093%2029%2097%2025%2098%2014Z%27%20fill%3D%27%23fff%27%20opacity%3D%27.92%27%2F%3E%3Crect%20x%3D%271.5%27%20y%3D%271.5%27%20width%3D%27125%27%20height%3D%27125%27%20rx%3D%2727%27%20fill%3D%27none%27%20stroke%3D%27%23fff%27%20stroke-opacity%3D%27.12%27%20stroke-width%3D%273%27%2F%3E%3C%2Fsvg%3E', pinned: true},
    'calc': {title: 'Calculator', icon: 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20128%20128%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22g%22%20x1%3D%220%22%20y1%3D%220%22%20x2%3D%221%22%20y2%3D%221%22%3E%3Cstop%20offset%3D%220%22%20stop-color%3D%22%2340404a%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%230c0c10%22%2F%3E%3C%2FlinearGradient%3E%3ClinearGradient%20id%3D%22o%22%20x1%3D%220%22%20y1%3D%220%22%20x2%3D%220%22%20y2%3D%221%22%3E%3Cstop%20offset%3D%220%22%20stop-color%3D%22%23ffb340%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%23ff8a00%22%2F%3E%3C%2FlinearGradient%3E%3ClinearGradient%20id%3D%22k%22%20x1%3D%220%22%20y1%3D%220%22%20x2%3D%220%22%20y2%3D%221%22%3E%3Cstop%20offset%3D%220%22%20stop-color%3D%22%236a6a76%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%234a4a54%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%22128%22%20height%3D%22128%22%20rx%3D%2230%22%20fill%3D%22url%28%23g%29%22%2F%3E%3Crect%20x%3D%221.5%22%20y%3D%221.5%22%20width%3D%22125%22%20height%3D%22125%22%20rx%3D%2228.5%22%20fill%3D%22none%22%20stroke%3D%22%23fff%22%20stroke-opacity%3D%22.14%22%20stroke-width%3D%223%22%2F%3E%3Crect%20x%3D%2218%22%20y%3D%2218%22%20width%3D%2292%22%20height%3D%2232%22%20rx%3D%2210%22%20fill%3D%22%23040406%22%2F%3E%3Ctext%20x%3D%22102%22%20y%3D%2242%22%20text-anchor%3D%22end%22%20font-family%3D%22Arial%2CHelvetica%2Csans-serif%22%20font-weight%3D%22700%22%20font-size%3D%2224%22%20fill%3D%22%23fff%22%3E3.14%3C%2Ftext%3E%3Cg%20fill%3D%22url%28%23k%29%22%3E%3Crect%20x%3D%2218%22%20y%3D%2258%22%20width%3D%2219%22%20height%3D%2216%22%20rx%3D%226%22%2F%3E%3Crect%20x%3D%2242%22%20y%3D%2258%22%20width%3D%2219%22%20height%3D%2216%22%20rx%3D%226%22%2F%3E%3Crect%20x%3D%2266%22%20y%3D%2258%22%20width%3D%2219%22%20height%3D%2216%22%20rx%3D%226%22%2F%3E%3Crect%20x%3D%2218%22%20y%3D%2279%22%20width%3D%2219%22%20height%3D%2216%22%20rx%3D%226%22%2F%3E%3Crect%20x%3D%2242%22%20y%3D%2279%22%20width%3D%2219%22%20height%3D%2216%22%20rx%3D%226%22%2F%3E%3Crect%20x%3D%2266%22%20y%3D%2279%22%20width%3D%2219%22%20height%3D%2216%22%20rx%3D%226%22%2F%3E%3Crect%20x%3D%2218%22%20y%3D%22100%22%20width%3D%2243%22%20height%3D%2216%22%20rx%3D%226%22%2F%3E%3Crect%20x%3D%2266%22%20y%3D%22100%22%20width%3D%2219%22%20height%3D%2216%22%20rx%3D%226%22%2F%3E%3C%2Fg%3E%3Cg%20fill%3D%22url%28%23o%29%22%3E%3Crect%20x%3D%2290%22%20y%3D%2258%22%20width%3D%2220%22%20height%3D%2216%22%20rx%3D%226%22%2F%3E%3Crect%20x%3D%2290%22%20y%3D%2279%22%20width%3D%2220%22%20height%3D%2216%22%20rx%3D%226%22%2F%3E%3Crect%20x%3D%2290%22%20y%3D%22100%22%20width%3D%2220%22%20height%3D%2216%22%20rx%3D%226%22%2F%3E%3C%2Fg%3E%3Crect%20x%3D%2295%22%20y%3D%2264.5%22%20width%3D%2210%22%20height%3D%223%22%20rx%3D%221.5%22%20fill%3D%22%23fff%22%2F%3E%3Crect%20x%3D%2295%22%20y%3D%2285.5%22%20width%3D%2210%22%20height%3D%223%22%20rx%3D%221.5%22%20fill%3D%22%23fff%22%2F%3E%3Crect%20x%3D%2295%22%20y%3D%22106.5%22%20width%3D%2210%22%20height%3D%223%22%20rx%3D%221.5%22%20fill%3D%22%23fff%22%2F%3E%3Crect%20x%3D%2295%22%20y%3D%2264.5%22%20width%3D%2210%22%20height%3D%223%22%20rx%3D%221.5%22%20fill%3D%22%23fff%22%20transform%3D%22rotate%2890%20100%2066%29%22%2F%3E%3C%2Fsvg%3E', pinned: true},
    'notes': {title: 'Notes', icon: 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20128%20128%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22y%22%20x1%3D%220%22%20y1%3D%220%22%20x2%3D%220%22%20y2%3D%221%22%3E%3Cstop%20offset%3D%220%22%20stop-color%3D%22%23ffe066%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%23ffb800%22%2F%3E%3C%2FlinearGradient%3E%3ClinearGradient%20id%3D%22p%22%20x1%3D%220%22%20y1%3D%220%22%20x2%3D%220%22%20y2%3D%221%22%3E%3Cstop%20offset%3D%220%22%20stop-color%3D%22%23ffffff%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%23ece8d6%22%2F%3E%3C%2FlinearGradient%3E%3CclipPath%20id%3D%22c%22%3E%3Crect%20width%3D%22128%22%20height%3D%22128%22%20rx%3D%2230%22%2F%3E%3C%2FclipPath%3E%3C%2Fdefs%3E%3Cg%20clip-path%3D%22url%28%23c%29%22%3E%3Crect%20width%3D%22128%22%20height%3D%22128%22%20fill%3D%22url%28%23p%29%22%2F%3E%3Crect%20width%3D%22128%22%20height%3D%2238%22%20fill%3D%22url%28%23y%29%22%2F%3E%3Ccircle%20cx%3D%2234%22%20cy%3D%2219%22%20r%3D%225%22%20fill%3D%22%23b87e00%22%20opacity%3D%22.55%22%2F%3E%3Ccircle%20cx%3D%2264%22%20cy%3D%2219%22%20r%3D%225%22%20fill%3D%22%23b87e00%22%20opacity%3D%22.55%22%2F%3E%3Ccircle%20cx%3D%2294%22%20cy%3D%2219%22%20r%3D%225%22%20fill%3D%22%23b87e00%22%20opacity%3D%22.55%22%2F%3E%3Cg%20stroke%3D%22%23cfc9ae%22%20stroke-width%3D%223.5%22%20stroke-linecap%3D%22round%22%3E%3Cpath%20d%3D%22M22%2058h84M22%2076h84M22%2094h54%22%2F%3E%3C%2Fg%3E%3Cpath%20d%3D%22M22%20112h34%22%20stroke%3D%22%23ffb800%22%20stroke-width%3D%223.5%22%20stroke-linecap%3D%22round%22%2F%3E%3C%2Fg%3E%3Crect%20x%3D%221.5%22%20y%3D%221.5%22%20width%3D%22125%22%20height%3D%22125%22%20rx%3D%2228.5%22%20fill%3D%22none%22%20stroke%3D%22%23000%22%20stroke-opacity%3D%22.08%22%20stroke-width%3D%223%22%2F%3E%3Cg%20transform%3D%22translate%2884%2084%29%20rotate%2845%29%22%3E%3Crect%20x%3D%22-6%22%20y%3D%22-30%22%20width%3D%2212%22%20height%3D%2246%22%20rx%3D%223%22%20fill%3D%22%23ff6a3d%22%2F%3E%3Crect%20x%3D%22-6%22%20y%3D%22-30%22%20width%3D%2212%22%20height%3D%229%22%20rx%3D%223%22%20fill%3D%22%23ff9b7a%22%2F%3E%3Cpath%20d%3D%22M-6%2016h12l-6%2012z%22%20fill%3D%22%23f4d9a6%22%2F%3E%3Cpath%20d%3D%22M-2.2%2024h4.4l-2.2%204.2z%22%20fill%3D%22%23333%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E', pinned: true},
    'clock': {title: 'Clock', icon: 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20128%20128%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22g%22%20x1%3D%220%22%20y1%3D%220%22%20x2%3D%221%22%20y2%3D%221%22%3E%3Cstop%20offset%3D%220%22%20stop-color%3D%22%236366f1%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%2327277a%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%22128%22%20height%3D%22128%22%20rx%3D%2230%22%20fill%3D%22url%28%23g%29%22%2F%3E%3Crect%20x%3D%221.5%22%20y%3D%221.5%22%20width%3D%22125%22%20height%3D%22125%22%20rx%3D%2228.5%22%20fill%3D%22none%22%20stroke%3D%22%23fff%22%20stroke-opacity%3D%22.18%22%20stroke-width%3D%223%22%2F%3E%3Ctext%20x%3D%2264%22%20y%3D%2288%22%20text-anchor%3D%22middle%22%20font-size%3D%2262%22%3E%E2%8F%B0%3C%2Ftext%3E%3C%2Fsvg%3E', pinned: false},
    'calendar': {title: 'Calendar', icon: 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20128%20128%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22g%22%20x1%3D%220%22%20y1%3D%220%22%20x2%3D%221%22%20y2%3D%221%22%3E%3Cstop%20offset%3D%220%22%20stop-color%3D%22%23ff6b7a%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%23b3152f%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%22128%22%20height%3D%22128%22%20rx%3D%2230%22%20fill%3D%22url%28%23g%29%22%2F%3E%3Crect%20x%3D%221.5%22%20y%3D%221.5%22%20width%3D%22125%22%20height%3D%22125%22%20rx%3D%2228.5%22%20fill%3D%22none%22%20stroke%3D%22%23fff%22%20stroke-opacity%3D%22.18%22%20stroke-width%3D%223%22%2F%3E%3Ctext%20x%3D%2264%22%20y%3D%2288%22%20text-anchor%3D%22middle%22%20font-size%3D%2262%22%3E%F0%9F%93%85%3C%2Ftext%3E%3C%2Fsvg%3E', pinned: false},
    'todo': {title: 'To-Do', icon: 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20128%20128%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22g%22%20x1%3D%220%22%20y1%3D%220%22%20x2%3D%221%22%20y2%3D%221%22%3E%3Cstop%20offset%3D%220%22%20stop-color%3D%22%2334d399%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%23047857%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%22128%22%20height%3D%22128%22%20rx%3D%2230%22%20fill%3D%22url%28%23g%29%22%2F%3E%3Crect%20x%3D%221.5%22%20y%3D%221.5%22%20width%3D%22125%22%20height%3D%22125%22%20rx%3D%2228.5%22%20fill%3D%22none%22%20stroke%3D%22%23fff%22%20stroke-opacity%3D%22.18%22%20stroke-width%3D%223%22%2F%3E%3Ctext%20x%3D%2264%22%20y%3D%2288%22%20text-anchor%3D%22middle%22%20font-size%3D%2262%22%3E%E2%9C%85%3C%2Ftext%3E%3C%2Fsvg%3E', pinned: false},
    'weather': {title: 'Weather', icon: 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20128%20128%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22g%22%20x1%3D%220%22%20y1%3D%220%22%20x2%3D%221%22%20y2%3D%221%22%3E%3Cstop%20offset%3D%220%22%20stop-color%3D%22%2338bdf8%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%231d4ed8%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%22128%22%20height%3D%22128%22%20rx%3D%2230%22%20fill%3D%22url%28%23g%29%22%2F%3E%3Crect%20x%3D%221.5%22%20y%3D%221.5%22%20width%3D%22125%22%20height%3D%22125%22%20rx%3D%2228.5%22%20fill%3D%22none%22%20stroke%3D%22%23fff%22%20stroke-opacity%3D%22.18%22%20stroke-width%3D%223%22%2F%3E%3Ctext%20x%3D%2264%22%20y%3D%2288%22%20text-anchor%3D%22middle%22%20font-size%3D%2262%22%3E%F0%9F%8C%A4%EF%B8%8F%3C%2Ftext%3E%3C%2Fsvg%3E', pinned: false},
    'convert': {title: 'Converter', icon: 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20128%20128%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22g%22%20x1%3D%220%22%20y1%3D%220%22%20x2%3D%221%22%20y2%3D%221%22%3E%3Cstop%20offset%3D%220%22%20stop-color%3D%22%23a78bfa%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%235b21b6%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%22128%22%20height%3D%22128%22%20rx%3D%2230%22%20fill%3D%22url%28%23g%29%22%2F%3E%3Crect%20x%3D%221.5%22%20y%3D%221.5%22%20width%3D%22125%22%20height%3D%22125%22%20rx%3D%2228.5%22%20fill%3D%22none%22%20stroke%3D%22%23fff%22%20stroke-opacity%3D%22.18%22%20stroke-width%3D%223%22%2F%3E%3Ctext%20x%3D%2264%22%20y%3D%2288%22%20text-anchor%3D%22middle%22%20font-size%3D%2262%22%3E%F0%9F%94%84%3C%2Ftext%3E%3C%2Fsvg%3E', pinned: false},
    'sticky': {title: 'Sticky Notes', icon: 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20128%20128%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22g%22%20x1%3D%220%22%20y1%3D%220%22%20x2%3D%221%22%20y2%3D%221%22%3E%3Cstop%20offset%3D%220%22%20stop-color%3D%22%23fde047%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%23f59e0b%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%22128%22%20height%3D%22128%22%20rx%3D%2230%22%20fill%3D%22url%28%23g%29%22%2F%3E%3Crect%20x%3D%221.5%22%20y%3D%221.5%22%20width%3D%22125%22%20height%3D%22125%22%20rx%3D%2228.5%22%20fill%3D%22none%22%20stroke%3D%22%23fff%22%20stroke-opacity%3D%22.18%22%20stroke-width%3D%223%22%2F%3E%3Ctext%20x%3D%2264%22%20y%3D%2288%22%20text-anchor%3D%22middle%22%20font-size%3D%2262%22%3E%F0%9F%97%92%EF%B8%8F%3C%2Ftext%3E%3C%2Fsvg%3E', pinned: false},
    'paint': {title: 'Paint', icon: 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20128%20128%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22g%22%20x1%3D%220%22%20y1%3D%220%22%20x2%3D%221%22%20y2%3D%221%22%3E%3Cstop%20offset%3D%220%22%20stop-color%3D%22%23f472b6%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%239333ea%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%22128%22%20height%3D%22128%22%20rx%3D%2230%22%20fill%3D%22url%28%23g%29%22%2F%3E%3Crect%20x%3D%221.5%22%20y%3D%221.5%22%20width%3D%22125%22%20height%3D%22125%22%20rx%3D%2228.5%22%20fill%3D%22none%22%20stroke%3D%22%23fff%22%20stroke-opacity%3D%22.18%22%20stroke-width%3D%223%22%2F%3E%3Ctext%20x%3D%2264%22%20y%3D%2288%22%20text-anchor%3D%22middle%22%20font-size%3D%2262%22%3E%F0%9F%8E%A8%3C%2Ftext%3E%3C%2Fsvg%3E', pinned: false},
    'music': {title: 'Music Studio', icon: 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20128%20128%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22g%22%20x1%3D%220%22%20y1%3D%220%22%20x2%3D%221%22%20y2%3D%221%22%3E%3Cstop%20offset%3D%220%22%20stop-color%3D%22%23fb923c%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%23be123c%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%22128%22%20height%3D%22128%22%20rx%3D%2230%22%20fill%3D%22url%28%23g%29%22%2F%3E%3Crect%20x%3D%221.5%22%20y%3D%221.5%22%20width%3D%22125%22%20height%3D%22125%22%20rx%3D%2228.5%22%20fill%3D%22none%22%20stroke%3D%22%23fff%22%20stroke-opacity%3D%22.18%22%20stroke-width%3D%223%22%2F%3E%3Ctext%20x%3D%2264%22%20y%3D%2288%22%20text-anchor%3D%22middle%22%20font-size%3D%2262%22%3E%F0%9F%8E%B9%3C%2Ftext%3E%3C%2Fsvg%3E', pinned: false},
    'code': {title: 'Code Editor', icon: 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20128%20128%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22g%22%20x1%3D%220%22%20y1%3D%220%22%20x2%3D%221%22%20y2%3D%221%22%3E%3Cstop%20offset%3D%220%22%20stop-color%3D%22%2322d3ee%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%230e7490%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%22128%22%20height%3D%22128%22%20rx%3D%2230%22%20fill%3D%22url%28%23g%29%22%2F%3E%3Crect%20x%3D%221.5%22%20y%3D%221.5%22%20width%3D%22125%22%20height%3D%22125%22%20rx%3D%2228.5%22%20fill%3D%22none%22%20stroke%3D%22%23fff%22%20stroke-opacity%3D%22.18%22%20stroke-width%3D%223%22%2F%3E%3Ctext%20x%3D%2264%22%20y%3D%2288%22%20text-anchor%3D%22middle%22%20font-size%3D%2262%22%3E%F0%9F%92%BB%3C%2Ftext%3E%3C%2Fsvg%3E', pinned: false},
    'board': {title: 'Whiteboard', icon: 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20128%20128%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22g%22%20x1%3D%220%22%20y1%3D%220%22%20x2%3D%221%22%20y2%3D%221%22%3E%3Cstop%20offset%3D%220%22%20stop-color%3D%22%23cbd5e1%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%23334155%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%22128%22%20height%3D%22128%22%20rx%3D%2230%22%20fill%3D%22url%28%23g%29%22%2F%3E%3Crect%20x%3D%221.5%22%20y%3D%221.5%22%20width%3D%22125%22%20height%3D%22125%22%20rx%3D%2228.5%22%20fill%3D%22none%22%20stroke%3D%22%23fff%22%20stroke-opacity%3D%22.18%22%20stroke-width%3D%223%22%2F%3E%3Ctext%20x%3D%2264%22%20y%3D%2288%22%20text-anchor%3D%22middle%22%20font-size%3D%2262%22%3E%F0%9F%96%8D%EF%B8%8F%3C%2Ftext%3E%3C%2Fsvg%3E', pinned: false},
    'fileman': {title: 'File Manager', icon: 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20128%20128%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22g%22%20x1%3D%220%22%20y1%3D%220%22%20x2%3D%221%22%20y2%3D%221%22%3E%3Cstop%20offset%3D%220%22%20stop-color%3D%22%2360a5fa%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%231e40af%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%22128%22%20height%3D%22128%22%20rx%3D%2230%22%20fill%3D%22url%28%23g%29%22%2F%3E%3Crect%20x%3D%221.5%22%20y%3D%221.5%22%20width%3D%22125%22%20height%3D%22125%22%20rx%3D%2228.5%22%20fill%3D%22none%22%20stroke%3D%22%23fff%22%20stroke-opacity%3D%22.18%22%20stroke-width%3D%223%22%2F%3E%3Ctext%20x%3D%2264%22%20y%3D%2288%22%20text-anchor%3D%22middle%22%20font-size%3D%2262%22%3E%F0%9F%93%81%3C%2Ftext%3E%3C%2Fsvg%3E', pinned: false},
    'imgview': {title: 'Image Viewer', icon: 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20128%20128%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22g%22%20x1%3D%220%22%20y1%3D%220%22%20x2%3D%221%22%20y2%3D%221%22%3E%3Cstop%20offset%3D%220%22%20stop-color%3D%22%232dd4bf%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%230f766e%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%22128%22%20height%3D%22128%22%20rx%3D%2230%22%20fill%3D%22url%28%23g%29%22%2F%3E%3Crect%20x%3D%221.5%22%20y%3D%221.5%22%20width%3D%22125%22%20height%3D%22125%22%20rx%3D%2228.5%22%20fill%3D%22none%22%20stroke%3D%22%23fff%22%20stroke-opacity%3D%22.18%22%20stroke-width%3D%223%22%2F%3E%3Ctext%20x%3D%2264%22%20y%3D%2288%22%20text-anchor%3D%22middle%22%20font-size%3D%2262%22%3E%F0%9F%96%BC%EF%B8%8F%3C%2Ftext%3E%3C%2Fsvg%3E', pinned: false},
    'video': {title: 'Video Player', icon: 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20128%20128%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22g%22%20x1%3D%220%22%20y1%3D%220%22%20x2%3D%221%22%20y2%3D%221%22%3E%3Cstop%20offset%3D%220%22%20stop-color%3D%22%23f87171%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%237f1d1d%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%22128%22%20height%3D%22128%22%20rx%3D%2230%22%20fill%3D%22url%28%23g%29%22%2F%3E%3Crect%20x%3D%221.5%22%20y%3D%221.5%22%20width%3D%22125%22%20height%3D%22125%22%20rx%3D%2228.5%22%20fill%3D%22none%22%20stroke%3D%22%23fff%22%20stroke-opacity%3D%22.18%22%20stroke-width%3D%223%22%2F%3E%3Ctext%20x%3D%2264%22%20y%3D%2288%22%20text-anchor%3D%22middle%22%20font-size%3D%2262%22%3E%F0%9F%8E%AC%3C%2Ftext%3E%3C%2Fsvg%3E', pinned: false},
    'recorder': {title: 'Voice Recorder', icon: 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20128%20128%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22g%22%20x1%3D%220%22%20y1%3D%220%22%20x2%3D%221%22%20y2%3D%221%22%3E%3Cstop%20offset%3D%220%22%20stop-color%3D%22%23ff5566%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%237f1d1d%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%22128%22%20height%3D%22128%22%20rx%3D%2230%22%20fill%3D%22url%28%23g%29%22%2F%3E%3Crect%20x%3D%221.5%22%20y%3D%221.5%22%20width%3D%22125%22%20height%3D%22125%22%20rx%3D%2228.5%22%20fill%3D%22none%22%20stroke%3D%22%23fff%22%20stroke-opacity%3D%22.18%22%20stroke-width%3D%223%22%2F%3E%3Ctext%20x%3D%2264%22%20y%3D%2288%22%20text-anchor%3D%22middle%22%20font-size%3D%2262%22%3E%F0%9F%8E%99%EF%B8%8F%3C%2Ftext%3E%3C%2Fsvg%3E', pinned: false},
    'pdf': {title: 'PDF Reader', icon: 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20128%20128%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22g%22%20x1%3D%220%22%20y1%3D%220%22%20x2%3D%221%22%20y2%3D%221%22%3E%3Cstop%20offset%3D%220%22%20stop-color%3D%22%23fb7185%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%239f1239%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%22128%22%20height%3D%22128%22%20rx%3D%2230%22%20fill%3D%22url%28%23g%29%22%2F%3E%3Crect%20x%3D%221.5%22%20y%3D%221.5%22%20width%3D%22125%22%20height%3D%22125%22%20rx%3D%2228.5%22%20fill%3D%22none%22%20stroke%3D%22%23fff%22%20stroke-opacity%3D%22.18%22%20stroke-width%3D%223%22%2F%3E%3Ctext%20x%3D%2264%22%20y%3D%2288%22%20text-anchor%3D%22middle%22%20font-size%3D%2262%22%3E%F0%9F%93%84%3C%2Ftext%3E%3C%2Fsvg%3E', pinned: false},
    'monitor': {title: 'System Monitor', icon: 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20128%20128%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22g%22%20x1%3D%220%22%20y1%3D%220%22%20x2%3D%221%22%20y2%3D%221%22%3E%3Cstop%20offset%3D%220%22%20stop-color%3D%22%234ade80%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%2314532d%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%22128%22%20height%3D%22128%22%20rx%3D%2230%22%20fill%3D%22url%28%23g%29%22%2F%3E%3Crect%20x%3D%221.5%22%20y%3D%221.5%22%20width%3D%22125%22%20height%3D%22125%22%20rx%3D%2228.5%22%20fill%3D%22none%22%20stroke%3D%22%23fff%22%20stroke-opacity%3D%22.18%22%20stroke-width%3D%223%22%2F%3E%3Ctext%20x%3D%2264%22%20y%3D%2288%22%20text-anchor%3D%22middle%22%20font-size%3D%2262%22%3E%F0%9F%93%8A%3C%2Ftext%3E%3C%2Fsvg%3E', pinned: false},
    'terminal': {title: 'Terminal', icon: 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20128%20128%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22g%22%20x1%3D%220%22%20y1%3D%220%22%20x2%3D%221%22%20y2%3D%221%22%3E%3Cstop%20offset%3D%220%22%20stop-color%3D%22%231f2937%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%23000000%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%22128%22%20height%3D%22128%22%20rx%3D%2230%22%20fill%3D%22url%28%23g%29%22%2F%3E%3Crect%20x%3D%221.5%22%20y%3D%221.5%22%20width%3D%22125%22%20height%3D%22125%22%20rx%3D%2228.5%22%20fill%3D%22none%22%20stroke%3D%22%23fff%22%20stroke-opacity%3D%22.18%22%20stroke-width%3D%223%22%2F%3E%3Ctext%20x%3D%2264%22%20y%3D%2284%22%20text-anchor%3D%22middle%22%20font-family%3D%22Consolas%2Cmonospace%22%20font-weight%3D%22700%22%20font-size%3D%2258%22%20fill%3D%22%234ade80%22%3E%26gt%3B_%3C%2Ftext%3E%3C%2Fsvg%3E', pinned: false},
    'taskmgr': {title: 'Task Manager', icon: 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20128%20128%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22g%22%20x1%3D%220%22%20y1%3D%220%22%20x2%3D%221%22%20y2%3D%221%22%3E%3Cstop%20offset%3D%220%22%20stop-color%3D%22%23a3e635%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%233f6212%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%22128%22%20height%3D%22128%22%20rx%3D%2230%22%20fill%3D%22url%28%23g%29%22%2F%3E%3Crect%20x%3D%221.5%22%20y%3D%221.5%22%20width%3D%22125%22%20height%3D%22125%22%20rx%3D%2228.5%22%20fill%3D%22none%22%20stroke%3D%22%23fff%22%20stroke-opacity%3D%22.18%22%20stroke-width%3D%223%22%2F%3E%3Ctext%20x%3D%2264%22%20y%3D%2288%22%20text-anchor%3D%22middle%22%20font-size%3D%2262%22%3E%F0%9F%93%8B%3C%2Ftext%3E%3C%2Fsvg%3E', pinned: true},
    'settings': {title: 'CONFIG', internal: true, icon: 'https://cdn.iconscout.com/icon/free/png-256/free-apple-settings-icon-svg-download-png-493162.png', pinned: true},
};

var savedPins = localStorage.getItem('c_pins_v2');
if(savedPins) {
    let p = JSON.parse(savedPins);
    for(let k in p) {
        if(APPS[k]) APPS[k].pinned = p[k];
    }
}

function syncPins() {
    let obj = {};
    for(let k in APPS) obj[k] = APPS[k].pinned;
    localStorage.setItem('c_pins_v2', JSON.stringify(obj));
}

var _wpRaw = {
    "Default": ["Green Leaves","media:green",false],
    "RainyCity": ["Rainy City","media:RainyCity",false],
    "aurora": ["Aurora","gen:aurora",false],
    "green": ["Emerald","gen:emerald",false],
    "sunset": ["Sunset","gen:sunset",false],
    "midnight": ["Midnight","gen:midnight",false],
    "33A56": ["Hunt Showdown","gen:hunt",true],
    "45E33": ["45E33","media:45E33",false],
    "Desktop": ["Desktop Lines","media:Desktop",false],
    "Gojo": ["Gojo","media:Gojo",false],
    "BlackHole": ["Black Hole","media:BlackHole",false],
    "Monkey": ["Monkey","media:Monkey",false],
    "Yuta": ["Yuta","media:Yuta",false],
    "Minecraft01": ["Minecraft 01","media:Minecraft01",false]
};
var wallpaperRegistry = {};
Object.keys(_wpRaw).forEach(function(k){
    var r=_wpRaw[k], o={id:(k==="33A56"?"hunt_trait":k), name:r[0], locked:r[2]};
    Object.defineProperty(o,'url',{get:function(){return resolveMedia(r[1]);},enumerable:true});
    wallpaperRegistry[k]=o;
});

var sysConfig = JSON.parse(localStorage.getItem('cine_sys_config')) || {};
if(sysConfig.optBg === undefined) sysConfig.optBg = false;
if(sysConfig.shortBoot === undefined) sysConfig.shortBoot = false;
if(sysConfig.wpLoop === undefined) sysConfig.wpLoop = false;
if(sysConfig.idleLock === undefined) sysConfig.idleLock = false; 
sysConfig.redirectConfirm = false; 
if(!sysConfig.panicKey) sysConfig.panicKey = '`';
if(!sysConfig.homeWallpaper) sysConfig.homeWallpaper = 'Default';
if(!sysConfig.lockWallpaper) sysConfig.lockWallpaper = 'Default';
if(!sysConfig.cloak) sysConfig.cloak = 'none';

window.updateSysSetting = function(key, value) {
    sysConfig[key] = value;
    localStorage.setItem('cine_sys_config', JSON.stringify(sysConfig));
    if(key === 'optBg') syncBgPlayback();
    if(key === 'wpLoop') updateWallpaperLoop();
};

var cloaks = {
    none: {title: "LunaarOS", icon: ""},
    google: {title: "Google", icon: "https://www.google.com/favicon.ico"},
    drive: {title: "My Drive - Google Drive", icon: "https://ssl.gstatic.com/images/branding/product/1x/drive_2020q4_32dp.png"},
    canvas: {title: "Dashboard", icon: "https://du11hjcvx0uqb.cloudfront.net/br/dist/images/favicon-e10d657a73.ico"},
    classroom: {title: "Classes", icon: "https://ssl.gstatic.com/classroom/favicon.png"}
};

window.updateCloak = function(key) {
    sysConfig.cloak = key;
    localStorage.setItem('cine_sys_config', JSON.stringify(sysConfig));
    applyCloak();
};

var _cloakSig = '';
function applyCloak() {
    var k = sysConfig.cloak || 'none';
    var sel = cloaks[k];
    var icons = document.querySelectorAll("link[rel*='icon']");
    for(var i=0; i<icons.length; i++) icons[i].remove();
    
    if(sel && k !== 'none') {
        document.title = sel.title;
        let n = document.createElement('link');
        n.type = 'image/x-icon';
        n.rel = 'shortcut icon';
        n.href = sel.icon;
        document.getElementsByTagName('head')[0].appendChild(n);
    } else {
        document.title = "LunaarOS";
    }
    _cloakSig = k + '|' + document.title;
}
setInterval(function() {
    if((sysConfig.cloak || 'none') + '|' + document.title === _cloakSig) return;
    applyCloak();
}, 2000);

var isDesktopActive = false;
var bootActive = true;
var enterCount = 0;
var highestZ = 500;
var activeWindowId = null;
var isMediaPlaying = false;
var isTouchDevice = (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 0 && Math.max(screen.width, screen.height) < 1100);
var isMobile = isTouchDevice || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
var activeCtxId = null;

if(isTouchDevice) {
    document.documentElement.classList.add('touch-mode');
    document.body.classList.add('touch-mode');
    var mobWarn = document.getElementById('mobile-warning');
    if(mobWarn) {
        try { if(mobWarn.open) mobWarn.close(); } catch(e) {}
        mobWarn.style.display = 'none';
        mobWarn.classList.remove('show-warning');
    }
}

async function loadDynamicResources() {
    renderUI();
    initWallpapers();
    setupAppContextMenu();
}

window.onbeforeunload = null; var _unusedBU = function(e) {
    if(sysConfig.redirectConfirm) {
        let msg = "Are you sure you want to leave? This helps block GoGuardian redirects.";
        e.returnValue = msg;
        return msg;
    }
};

document.addEventListener("DOMContentLoaded", function() {
    applyCloak();
    loadDynamicResources();
    document.getElementById('boot-layer').style.display = 'block';
    loadDesktop();
    updateSidebarData();
    restoreOpenApps();
});

function renderUI() {
    let dock = document.getElementById('dock-container');
    let dHTML = '<div class="dock-item" onclick="toggleStartMenu()"><img src="https://missionsupport.archden.org/wp-content/uploads/2022/02/windows11-icon.png"></div><div class="dock-sep"></div><div class="dock-item" onclick="toggleAppDrawer()"><svg width="24" height="24" viewBox="0 0 24 24" fill="#aaa"><path d="M4 4h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 10h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 16h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4z"/></svg></div><div class="dock-sep"></div>';
    
    let pGrid = document.getElementById('pinned-grid');
    let pHTML = '';
    
    function dockItemHTML(id) {
        let w = document.getElementById('win-' + id), cls = 'dock-item';
        if(w) {
            cls += ' is-open';
            if(w.classList.contains('minimized')) cls += ' is-min';
            else if(activeWindowId === id) cls += ' is-active';
        }
        return '<div class="'+cls+'" data-id="'+id+'" title="'+String(APPS[id].title).replace(/"/g,'&quot;')+'" onmousedown="DragSystem.start(event,this,\'dock\',\''+id+'\')" onclick="toggleApp(\''+id+'\')" oncontextmenu="openDockCtx(event, \''+id+'\')"><img src="'+APPS[id].icon+'"></div>';
    }
    for(let id in APPS) {
        if(APPS[id].pinned) {
            dHTML += dockItemHTML(id);
            pHTML += '<div class="pinned-item" onclick="toggleApp(\''+id+'\')"><img src="'+APPS[id].icon+'"><span>'+APPS[id].title+'</span></div>';
        }
    }
    let opened = document.querySelectorAll('#windows-layer .window');
    for(let i = 0; i < opened.length; i++) {
        let oid = opened[i].id.replace('win-', '');
        if(APPS[oid] && !APPS[oid].pinned) dHTML += dockItemHTML(oid);
    }
    
    dock.innerHTML = dHTML;
    pGrid.innerHTML = pHTML;
    populateDrawer();
    _dockSig = dockSig();
}

function dockSig() {
    let ids = [];
    for(let id in APPS) if(APPS[id].pinned) ids.push(id);
    let opened = document.querySelectorAll('#windows-layer .window');
    for(let i = 0; i < opened.length; i++) {
        let oid = opened[i].id.replace('win-', '');
        if(APPS[oid] && !APPS[oid].pinned) ids.push(oid);
    }
    return ids.join(',');
}

function syncDockState() {
    let items = document.querySelectorAll('#dock-container .dock-item[data-id]');
    for(let i = 0; i < items.length; i++) {
        let id = items[i].getAttribute('data-id');
        let w = document.getElementById('win-' + id);
        let cls = 'dock-item';
        if(w) {
            cls += ' is-open';
            if(w.classList.contains('minimized')) cls += ' is-min';
            else if(activeWindowId === id) cls += ' is-active';
        }
        if(items[i].className !== cls) items[i].className = cls;
    }
}
var _dockSig = null;

function openDockCtx(e, id) {
    e.preventDefault(); e.stopPropagation();
    hideAllCtx();
    activeCtxId = id;
    let m = document.getElementById('dock-ctx-menu');
    if(m) {
        document.getElementById('ctx-close-app').style.display = document.getElementById('win-' + id) ? '' : 'none';
        let up = document.getElementById('ctx-unpin-app');
        up.innerHTML = (APPS[id] && APPS[id].pinned) ? '<i class="fas fa-unlink fa-fw" aria-hidden="true"></i> Unpin from Taskbar' : '<i class="fas fa-thumbtack fa-fw" aria-hidden="true"></i> Pin to Taskbar';
        m.style.display = 'block';
        m.style.left = Math.max(8, Math.min(e.clientX, window.innerWidth - 240)) + 'px';
        m.style.top = Math.max(8, e.clientY - m.offsetHeight - 14) + 'px';
    }
}

function openDrawerCtx(e, id) {
    e.preventDefault(); 
  e.stopPropagation();
    hideAllCtx();
    activeCtxId = id;
    let m = document.getElementById('drawer-ctx-menu');
    if(m) {
        m.style.display = 'block';
        m.style.left = e.pageX + 'px';
        m.style.top = e.pageY + 'px';
    }
}

document.getElementById('ctx-pin-app').onclick = function() {
    if(activeCtxId && APPS[activeCtxId]) {
        APPS[activeCtxId].pinned = true;
        syncPins();
        renderUI();
    }
    hideAllCtx();
}

document.getElementById('ctx-close-app').onclick = function() {
    if(activeCtxId && document.getElementById('win-' + activeCtxId)) closeWindow(activeCtxId);
    hideAllCtx();
}

document.getElementById('ctx-unpin-app').onclick = function() {
    if(activeCtxId && APPS[activeCtxId]) {
        APPS[activeCtxId].pinned = !APPS[activeCtxId].pinned;
        syncPins();
        renderUI();
    }
    hideAllCtx();
}

function hideAllCtx() {
    let menus = ['app-context-menu','desktop-context-menu','drawer-ctx-menu','dock-ctx-menu'];
    for(let i=0; i<menus.length; i++) {
        let m = document.getElementById(menus[i]);
        if(m) m.style.display = 'none';
    }
}
document.addEventListener('click', hideAllCtx);

document.addEventListener('keydown', function(e) {
    if(bootActive && e.key === 'Enter' && document.getElementById('boot-layer').style.display !== 'none') {
        enterCount++;
        if(enterCount >= 2) skipBootSequence();
        setTimeout(function(){ enterCount = 0; }, 500);
    }
    if(e.key && sysConfig.panicKey && e.key.toLowerCase() === sysConfig.panicKey.toLowerCase()) {
        window.location.href = "https://google.com";
    }
});

function startBootSequence() {
    let cb = document.getElementById('boot-content');
    let bv = document.getElementById('boot-video');
    cb.style.display = 'none';
    bv.style.display = 'block';
    bv.muted = false;
    bv.volume = 1.0;
    
    bv.src = resolveMedia('media:Boot'); bv.load();
    if(sysConfig.shortBoot) {
        bv.src = resolveMedia('media:QuickBoot');
        bv.load();
    }
    
    let p = bv.play();
    if(p !== undefined) {
        p.catch(function() {
            bv.muted = true;
            bv.play();
        });
    }
    bv.onerror = function(){ skipBootSequence(); };
    bv.onended = function() {
        if(bootActive) skipBootSequence();
    };
}

function skipBootSequence() {
    if(!bootActive) return;
    bootActive = false;
    let lay = document.getElementById('boot-layer');
    let bv = document.getElementById('boot-video');
    if(bv) bv.pause();
    
    if(lay) {
        lay.style.opacity = '0';
        document.getElementById('lock-screen').classList.add('active');
        
        let lv = document.getElementById('lock-video');
        if(lv.style.display !== 'none') {
            lv.play().catch(function(e) {});
        }
        
        setTimeout(function() { lay.style.display = 'none'; }, 600);
        updateClock();
    }
}

function showNotification(title, msg) {
    let c = document.getElementById('toast-container');
    let t = document.createElement('div');
    t.className = 'toast-notification';
    t.innerHTML = '<div class="toast-header"><div class="toast-app-info"><div class="toast-icon"><i class="fas fa-bell"></i></div><span>System</span></div><i class="fas fa-times toast-close"></i></div><div class="toast-title">' + title + '</div><div class="toast-body">' + msg + '</div>';
    c.appendChild(t);
    
    setTimeout(function(){ t.classList.add('show'); }, 100);
    t.onclick = function() {
        t.classList.remove('show');
        setTimeout(function(){ t.remove(); }, 400);
    };
    setTimeout(t.onclick, 6000);
}

var welcomeShown = false;
window.unlockSystem = function() {
    let scr = document.getElementById('lock-screen');
    scr.classList.add('slide-up');
    setTimeout(function() {
        scr.classList.remove('active');
        isDesktopActive = true;
        document.getElementById('lock-video').pause();
        
        syncBgPlayback();
        if(!welcomeShown) {
            showNotification("Welcome To LunaarOS V2", "Checkout Settings for FAQ!");
            welcomeShown = true;
        }
    }, 600);
    resetIdle();
};

function applyMediaToElements(url, vidEl, imgEl, isBg) {
    if(!url) return;
    let isImg = isImgUrl(url);
    if(isImg) {
        vidEl.style.display = 'none';
        vidEl.pause();
        imgEl.style.display = 'block';
        imgEl.src = url;
    } else {
        imgEl.style.display = 'none';
        vidEl.style.display = 'block';
        vidEl.src = url;
        vidEl.load();
        if(isBg) syncBgPlayback();
        if(!isBg && document.getElementById('lock-screen').classList.contains('active')) vidEl.play().catch(function(e){});
    }
}

function initWallpapers() {
    if(!wallpaperRegistry[sysConfig.homeWallpaper]) sysConfig.homeWallpaper='Default';
    if(!wallpaperRegistry[sysConfig.lockWallpaper]) sysConfig.lockWallpaper='Default';
    let bV = document.getElementById('bg-video');
    let bI = document.getElementById('bg-img');
    let lV = document.getElementById('lock-video');
    let lI = document.getElementById('lock-img');
    
    if(wallpaperRegistry[sysConfig.homeWallpaper]) {
        applyMediaToElements(wallpaperRegistry[sysConfig.homeWallpaper].url, bV, bI, true);
    }
    if(wallpaperRegistry[sysConfig.lockWallpaper]) {
        applyMediaToElements(wallpaperRegistry[sysConfig.lockWallpaper].url, lV, lI, false);
    } else {
        applyMediaToElements(wallpaperRegistry.Default.url, lV, lI, false);
    }
    
    updateWallpaperLoop();
    let wChk = document.getElementById('wp-loop-chk');
    if(wChk) wChk.checked = sysConfig.wpLoop;
}

function updateWallpaperLoop() {
    let bV = document.getElementById('bg-video');
    let lV = document.getElementById('lock-video');
    if(bV) bV.loop = sysConfig.wpLoop;
    if(lV) lV.loop = sysConfig.wpLoop;
    syncBgPlayback();
}

var _clockSig = '';
function updateClock() {
    let n = new Date();
    let cSig = n.getHours() + ':' + n.getMinutes() + ':' + n.getDate() + ':' + n.getDay();
    if(cSig === _clockSig) return;
    _clockSig = cSig;
    let dArr = ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'];
    let mArr = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'];
    
    let hrs = n.getHours().toString().padStart(2, '0');
    let min = n.getMinutes().toString().padStart(2, '0');
    let dNum = n.getDate().toString().padStart(2, '0');
    let dName = dArr[n.getDay()];
    let yr = n.getFullYear();
    
    let lDay = document.getElementById('lock-day-large');
    let lDat = document.getElementById('lock-date');
    let lTim = document.getElementById('lock-time');
    let hDay = document.getElementById('lbl-day');
    
    if(lDay) lDay.innerText = dName;
    if(hDay) hDay.innerText = dName;
    if(lDat) lDat.innerText = dNum + ' ' + mArr[n.getMonth()] + ', ' + yr + '.';
    if(lTim) lTim.innerText = '- ' + hrs + ':' + min + ' -';
}
setInterval(updateClock, 1000);

var idleTime = 0;
function resetIdle() { idleTime = 0; }
document.addEventListener('mousemove', resetIdle);
document.addEventListener('keypress', resetIdle);

setInterval(function() {
    idleTime++;
    let scr = document.getElementById('lock-screen');
    if(sysConfig.idleLock && idleTime >= 180 && !scr.classList.contains('active') && !bootActive) {
        if(isMediaPlaying) {
            idleTime = 0; 
        } else {
            isDesktopActive = false;
            scr.classList.remove('slide-up');
            scr.classList.add('active');
            document.getElementById('bg-video').pause();
            let lv = document.getElementById('lock-video');
            if(lv.style.display !== 'none') lv.play().catch(function(e){});
        }
    }
}, 1000);

window.launchLastPlayed = function() { toggleApp('files'); };
window.resumeSpotify = function() { toggleApp('term'); };
window.openUpdateLog = function() {
    let u = document.getElementById('update-modal');
    if(u && u.showModal) u.showModal();
    else if(u) u.style.display = 'flex';
};

var _sbSig = '';
function updateSidebarData() {
    try {
        let rsig = (localStorage.getItem('ps_purchased') || '') + '|' + (localStorage.getItem('cinify_cache') || '');
        if(rsig === _sbSig) return;
        _sbSig = rsig;
        let ps = JSON.parse(localStorage.getItem('ps_purchased'));
        if(ps && ps.length > 0) document.getElementById('last-game-name').innerText = "PS5 Library Ready";
        let sp = JSON.parse(localStorage.getItem('cinify_cache'));
        if(sp) {
            let k = Object.keys(sp);
            if(k.length > 0) {
                document.getElementById('spotify-track-name').innerText = sp[k[k.length-1]].title || "Liked Song";
                if(sp[k[k.length-1]].cover) document.getElementById('spotify-album-art').src = sp[k[k.length-1]].cover;
            }
        }
    } catch(e) {}
}
setInterval(updateSidebarData, 5000);

function populateDrawer() {
    let g = document.getElementById('drawer-grid');
    g.innerHTML = '';
    for(let key in APPS) {
        let a = APPS[key];
        let d = document.createElement('div');
        d.className = 'drawer-item';
        d.dataset.id = key;
        d.innerHTML = '<img src="' + a.icon + '" style="pointer-events:none;"><span>' + a.title + '</span>';
        
        d.onmousedown = function(e) { DragSystem.start(e, this, 'drawer', this.dataset.id); };
        d.onclick = function(e) {
            if(!DragSystem.isDragMove) {
                toggleApp(this.dataset.id);
                toggleAppDrawer();
            }
        };
        d.oncontextmenu = function(e) { openDrawerCtx(e, this.dataset.id); }
        g.appendChild(d);
    }
}

function filterDrawer(val) {
    let items = document.querySelectorAll('.drawer-item');
    let q = val.toLowerCase();
    for(let i=0; i<items.length; i++) {
        let txt = items[i].innerText.toLowerCase();
        if(txt.includes(q)) items[i].style.display = 'flex';
        else items[i].style.display = 'none';
    }
}

function toggleAppDrawer() {
    let d = document.getElementById('app-drawer');
    if(!d) return;
    if(d.classList.contains('open')) {
        d.classList.remove('open');
        try { if(d.open && d.close) d.close(); } catch(e) {}
        setTimeout(function(){ d.style.display='none'; }, 300);
    } else {
        populateDrawer();
        d.style.display = 'block';
        /* it is a <dialog>: opening it properly also gives it a backdrop and focus */
        try { if(!d.open && d.showModal) d.showModal(); } catch(e) {}
        setTimeout(function(){ d.classList.add('open'); }, 10);
    }
}

function toggleApp(id) {
    let w = document.getElementById('win-' + id);
    if(w) {
        if(w.classList.contains('minimized')) {
            w.classList.remove('minimized');
            w.classList.add('active');
            w.style.zIndex = ++highestZ;
            activeWindowId = id;
            startImmersiveMode(w);
        } else if(activeWindowId === id) {
            minimizeWindow(id);
        } else {
            w.style.zIndex = ++highestZ;
            activeWindowId = id;
            startImmersiveMode(w);
        }
    } else {
        openWindow(id);
    }
}

function openWindow(id) {
    let m = document.getElementById('start-menu');
    if(m) {
        m.classList.remove('open');
        setTimeout(function(){ m.style.display='none'; }, 300);
    }
    
    let layer = document.getElementById('windows-layer');
    let win = document.getElementById('win-' + id);
    
    if(!win) {
        let dat = APPS[id] || {title: 'APP', path: 'about:blank'};
        win = document.createElement('div');
        win.id = 'win-' + id;
        win.className = 'window active header-visible';
        win.style.zIndex = ++highestZ;
        
        let iframeStr = '<iframe id="frame-' + id + '" allowfullscreen allow="autoplay; fullscreen; gamepad; microphone; camera; clipboard-write"></iframe>';
        
        win.innerHTML = '<div class="win-header" onmousedown="DragSystem.startWinDrag(event, \'' + id + '\')"><div class="win-title">' + dat.title + '</div><div class="win-controls">' + (String(id).indexOf('game-')===0 ? '<div class="win-btn" title="Open in new tab" onclick="popOutGame(\'' + id + '\')" style="font-size:15px;line-height:1;cursor:pointer">&#8599;</div>' : '') + '<div class="win-btn btn-min" onclick="minimizeWindow(\'' + id + '\')"></div><div class="win-btn btn-close" onclick="closeWindow(\'' + id + '\')"></div></div></div><div class="win-body">' + iframeStr + '</div>';
        
        layer.appendChild(win);
        if(dat.url) {
            document.getElementById('frame-' + id).src = dat.url;
        } else if(!dat.internal && APP_HTML[id]) {
            document.getElementById('frame-' + id).srcdoc = APP_HTML[id];
        }
        (function(fr){ fr.addEventListener('load', function(){ try{ fr.contentWindow.document.addEventListener('keydown', escMinimize); }catch(x){} }); })(document.getElementById('frame-' + id));
        
        if(dat.internal && id === 'settings') {
            let f = document.getElementById('frame-' + id);
            if(f) {
                let html = `
                <!DOCTYPE html>
                <html>
                <head>
                    <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@900&family=Rajdhani:wght@400;600;700&display=swap" rel="stylesheet">
                    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
                    <style>
                        body { background: #000; color: #fff; font-family: 'Rajdhani', sans-serif; padding: 25px; margin: 0; outline: none; }
                        * { outline: none; -webkit-tap-highlight-color: transparent; }
                        h2 { border-bottom: 2px solid #333; padding-bottom: 10px; font-weight: 700; letter-spacing: 1px; }
                        .setting-card { background: #111; border: 1px solid #333; padding: 15px; border-radius: 10px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; }
                        .setting-text { display: flex; flex-direction: column; }
                        .setting-text b { color: #fff; font-size: 15px; }
                        .setting-text small { color: #888; font-size: 13px; }
                        .switch { position: relative; display: inline-block; width: 40px; height: 20px; }
                        .switch input { opacity: 0; width: 0; height: 0; }
                        .slider { position: absolute; cursor: pointer; inset: 0; background-color: #444; transition: .3s; border-radius: 34px; }
                        .slider:before { position: absolute; content: ""; height: 14px; width: 14px; left: 3px; bottom: 3px; background-color: #fff; transition: .3s; border-radius: 50%; }
                        input:checked + .slider { background-color: #fff; }
                        input:checked + .slider:before { transform: translateX(20px); background-color: #000; }
                        input[type="text"], select { background: #222; color: #fff; border: 1px solid #444; padding: 6px; border-radius: 6px; }
                        input:focus, select:focus { border-color: #888; }
                    
#lunaar-launch{position:fixed;inset:0;z-index:999999;background:#000;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .35s ease}
#lunaar-launch.show{opacity:1}#lunaar-launch.fade{opacity:0}
#lunaar-launch .launch-card{display:flex;flex-direction:column;align-items:center;gap:18px;transform:scale(.72);opacity:0;animation:lunaarLaunch .65s cubic-bezier(.2,.8,.2,1) forwards}
#lunaar-launch img{width:116px;height:116px;border-radius:27px;box-shadow:0 18px 70px rgba(255,0,40,.3)}
#lunaar-launch .launch-name{font:700 24px system-ui,sans-serif;color:#fff}
@keyframes lunaarLaunch{to{transform:scale(1);opacity:1}}
</style>
                </head>
                <body>
                    <h2>SYSTEM CONFIGURATION</h2>
                    <div class="setting-card">
                        <div class="setting-text"><b>Optimized Background</b><small>Disables video background</small></div>
                        <label class="switch"><input type="checkbox" id="chk-bg" onchange="window.parent.updateSysSetting('optBg',this.checked)"><span class="slider"></span></label>
                    </div>
                    <div class="setting-card">
                        <div class="setting-text"><b>Fast Boot</b><small>Skips the startup sequence</small></div>
                        <label class="switch"><input type="checkbox" id="chk-boot" onchange="window.parent.updateSysSetting('shortBoot',this.checked)"><span class="slider"></span></label>
                    </div>
                    <div class="setting-card">
                        <div class="setting-text"><b>Idle Lock Screen</b><small>Locks system when away for 3 minutes</small></div>
                        <label class="switch"><input type="checkbox" id="chk-idle" onchange="window.parent.updateSysSetting('idleLock',this.checked)"><span class="slider"></span></label>
                    </div>
                    <div class="setting-card">
                        <div class="setting-text"><b>Tab Cloaking</b><small>Disguises OS as another site</small></div>
                        <select id="cloak-select" onchange="window.parent.updateCloak(this.value)">
                            <option value="none">None (LunaarOS)</option>
                            <option value="google">Google</option>
                            <option value="drive">Google Drive</option>
                            <option value="canvas">Canvas</option>
                        </select>
                    </div>
                    <div class="setting-card">
                        <div class="setting-text"><b>Panic Key</b><small>Instant site redirection shortcut</small></div>
                        <input type="text" id="panic-input" maxlength="1" style="width:40px; text-align:center; font-weight:bold; font-size:16px;" onkeyup="window.parent.updateSysSetting('panicKey',this.value)">
                    </div>
                    <script>
                        var prefs = window.parent.sysConfig;
                        document.getElementById('chk-bg').checked = prefs.optBg;
                        document.getElementById('chk-boot').checked = prefs.shortBoot;
                        document.getElementById('chk-idle').checked = prefs.idleLock;
                        
                        document.getElementById('cloak-select').value = prefs.cloak;
                        document.getElementById('panic-input').value = prefs.panicKey;
                    <\/script>
                </body>
                </html>`;
                f.srcdoc = html;
            }
        }
    } else {
        win.classList.remove('minimized');
        win.classList.add('active');
        win.style.zIndex = ++highestZ;
    }
    
    activeWindowId = id;
    startImmersiveMode(win);
}


var bgCovered = false;

function updateWinStack() {
    let ws = document.querySelectorAll('#windows-layer .window'), topEl = null, topZ = -1;
    for(let i = 0; i < ws.length; i++) {
        if(ws[i].classList.contains('minimized')) continue;
        let z = parseInt(ws[i].style.zIndex, 10) || 0;
        if(z > topZ) { topZ = z; topEl = ws[i]; }
    }
    bgCovered = !!topEl;
    for(let i = 0; i < ws.length; i++) {
        let cov = ws[i] !== topEl && !ws[i].classList.contains('minimized');
        if(cov !== ws[i].classList.contains('win-covered')) ws[i].classList.toggle('win-covered', cov);
    }
    syncBgPlayback();
}

function syncBgPlayback() {
    let bv = document.getElementById('bg-video');
    if(!bv) return;
    if(sysConfig.optBg || !isDesktopActive || bgCovered) {
        if(!bv.paused) bv.pause();
    } else if(bv.paused && bv.style.display !== 'none' && bv.getAttribute('src')) {
        bv.play().catch(function(e){});
    }
}

var WIN_META = {}, _winSig = '', _restoring = true, _winT = null;
function syncWindows() {
    let ws = document.querySelectorAll('#windows-layer .window'), st = [], ids = {};
    for(let i = 0; i < ws.length; i++) {
        let id = ws[i].id.replace('win-', '');
        ids[id] = 1;
        st.push({id: id, min: ws[i].classList.contains('minimized')});
        if(!WIN_META[id]) WIN_META[id] = Date.now();
    }
    for(let k in WIN_META) if(!ids[k]) delete WIN_META[k];
    updateWinStack();
    let sig = JSON.stringify(st) + '|' + activeWindowId;
    if(sig === _winSig) return;
    _winSig = sig;
    if(dockSig() !== _dockSig) renderUI();
    else syncDockState();
    if(!_restoring) {
        try {
            let keep = st.filter(function(s){ return String(s.id).indexOf('game-') !== 0; });
            localStorage.setItem('lunaar_open_v1', JSON.stringify({
                open: keep.map(function(s){ return s.id; }),
                active: (activeWindowId && String(activeWindowId).indexOf('game-') !== 0) ? activeWindowId : null
            }));
        } catch(e) {}
    }
}
function restoreOpenApps() {
    try {
        let s = JSON.parse(localStorage.getItem('lunaar_open_v1') || 'null');
        if(s && s.open) {
            s.open.forEach(function(id){ if(APPS[id] && !document.getElementById('win-' + id)) openWindow(id); });
            s.open.forEach(function(id){ if(document.getElementById('win-' + id) && id !== s.active) minimizeWindow(id); });
            let w = s.active && document.getElementById('win-' + s.active);
            if(w) {
                w.classList.remove('minimized');
                w.classList.add('active');
                w.style.zIndex = ++highestZ;
                activeWindowId = s.active;
                startImmersiveMode(w);
            }
        }
    } catch(e) {}
    _restoring = false;
    syncWindows();
}
new MutationObserver(function(){ clearTimeout(_winT); _winT = setTimeout(syncWindows, 40); })
    .observe(document.getElementById('windows-layer'), {childList: true, subtree: true, attributes: true, attributeFilter: ['class']});
setInterval(syncWindows, 700);

function closeWindow(id) {
    let w = document.getElementById('win-' + id);
    if(w) w.remove();
    if(activeWindowId === id) activeWindowId = null;
    endImmersiveMode();
    if(String(id).indexOf('game-')===0){ delete APPS[id]; delete APP_HTML[id]; delete GAME_HTML[id]; renderUI(); }
}

function minimizeWindow(id) {
    let w = document.getElementById('win-' + id);
    if(w) {
        w.classList.add('minimized');
        w.classList.remove('active');
        if(activeWindowId === id) activeWindowId = null;
    }
    endImmersiveMode();
}

function startImmersiveMode(win) {
    document.getElementById('dock-container').classList.add('dock-hidden');
    win.classList.remove('header-visible');
    updateWinStack();
}

function endImmersiveMode() {
    let aw = document.querySelectorAll('.window.active:not(.minimized)');
    if(aw.length === 0) {
        document.getElementById('dock-container').classList.remove('dock-hidden');
        activeWindowId = null;
        updateWinStack();
        return;
    }
    let t = aw[aw.length - 1];
    activeWindowId = t.id.replace('win-', '');
    t.style.zIndex = ++highestZ;
    startImmersiveMode(t);
}

var dockTimer;
var dEl = document.getElementById('dock-container');
document.getElementById('bottom-trigger').addEventListener('mouseenter', function() {
    dEl.classList.remove('dock-hidden');
    clearTimeout(dockTimer);
});
dEl.addEventListener('mouseleave', function() {
    let aw = document.querySelectorAll('.window.active:not(.minimized)');
    if(aw.length > 0) {
        dockTimer = setTimeout(function() { dEl.classList.add('dock-hidden'); }, 1000);
    }
});
dEl.addEventListener('mouseenter', function() { clearTimeout(dockTimer); });

document.getElementById('top-trigger').addEventListener('mouseenter', function() {
    if(activeWindowId) {
        let w = document.getElementById('win-' + activeWindowId);
        if(w && !w.classList.contains('minimized')) w.classList.add('header-visible');
    }
});

document.addEventListener('mouseover', function(e) {
    if(!activeWindowId) return;
    let w = document.getElementById('win-' + activeWindowId);
    if(!w) return;
    if(e.target.closest('.win-header')) {
        if(!w.classList.contains('header-visible')) w.classList.add('header-visible');
    } else if(!e.target.closest('#top-trigger') && w.classList.contains('header-visible')) {
        w.classList.remove('header-visible');
    }
});

var desktopLayout = JSON.parse(localStorage.getItem('cine_desktop_v2')) || [];
desktopLayout = desktopLayout.filter(function(it){ if(it.type==='folder'&&it.apps) it.apps=it.apps.filter(function(x){return x!=='youtube'}); return it.id!=='youtube'; });
/* A fresh phone visit used to open an empty desktop with nothing to tap but the dock. */
if(isTouchDevice && desktopLayout.length === 0) {
    desktopLayout = [
        {type: 'app', id: 'files', x: 24, y: 24},
        {type: 'app', id: 'term', x: 24, y: 132},
        {type: 'app', id: 'gemini', x: 24, y: 240},
        {type: 'app', id: 'settings', x: 124, y: 24},
        {type: 'app', id: 'calc', x: 124, y: 132}
    ];
}

function saveDesktop() {
    localStorage.setItem('cine_desktop_v2', JSON.stringify(desktopLayout));
    loadDesktop();
}

function loadDesktop() {
    let c = document.getElementById('desktop-area');
    let ex = document.querySelectorAll('.desktop-app');
    for(let j=0; j<ex.length; j++) ex[j].remove();
    
    desktopLayout.forEach(function(item, idx) {
        let d = document.createElement('div');
        d.className = 'desktop-app';
        d.style.left = item.x + 'px';
        d.style.top = item.y + 'px';
        d.setAttribute('data-idx', idx);
        
        if(item.type === 'folder') {
            let gHTML = '<div class="d-folder-grid">';
            let mx = item.apps.slice(0, 4);
            mx.forEach(function(a) {
                if(APPS[a]) gHTML += '<img src="' + APPS[a].icon + '">';
            });
            gHTML += '</div>';
            if(!item.hideName) gHTML += '<div class="d-label">' + (item.customName || 'Folder') + '</div>';
            
            d.innerHTML = gHTML;
            d.onclick = function(ev) {
                if(DragSystem.isDragMove) return;
                ev.stopPropagation();
                if(!this.classList.contains('expanded-folder')) {
                    closeAllFolders();
                    expandFolder(this, item, idx);
                }
            };
        } else {
            let a = APPS[item.id];
            if(a) {
                let iSrc = item.customIcon || a.icon;
                let lbl = item.customName || a.title;
                let h = '<img src="' + iSrc + '" class="d-icon">';
                if(!item.hideName) h += '<div class="d-label">' + lbl + '</div>';
                d.innerHTML = h;
                d.ondblclick = function(ev) { ev.stopPropagation(); toggleApp(item.id); };
            }
        }
        
        d.onmousedown = function(ev) {
            ev.stopPropagation();
            if(ev.button === 0) DragSystem.start(ev, d, 'desktop', idx);
        };
        
        d.oncontextmenu = function(ev) {
            ev.preventDefault(); ev.stopPropagation();
            hideAllCtx();
            let m = document.getElementById('app-context-menu');
            if(m) {
                m.style.display = 'block';
                m.style.left = ev.pageX + 'px';
                m.style.top = ev.pageY + 'px';
                m.setAttribute('data-target-idx', idx);
            }
        };
        
        c.appendChild(d);
    });
}

function expandFolder(el, dat, idx) {
    el.classList.add('expanded-folder');
    
    let h = '<div class="folder-header">' + (dat.customName || 'Folder') + ' <i class="fas fa-times" onclick="closeAllFolders(event)"></i></div>';
    h += '<div class="folder-grid-expanded">';
    for(let k=0; k<dat.apps.length; k++) {
        let aId = dat.apps[k];
        let info = APPS[aId];
        if(info) {
            h += '<div class="f-app" onclick="event.stopPropagation(); toggleApp(\'' + aId + '\')"><img src="' + info.icon + '"><span>' + info.title + '</span></div>';
        }
    }
    h += '</div>';
    el.innerHTML = h;
    
    setTimeout(function() {
        let rect = el.getBoundingClientRect();
        let sibs = document.querySelectorAll('.desktop-app:not(.expanded-folder)');
        for(let s=0; s<sibs.length; s++) {
            let sib = sibs[s];
            let sr = sib.getBoundingClientRect();
            if(!(rect.right < sr.left || rect.left > sr.right || rect.bottom < sr.top || rect.top > sr.bottom)) {
                let push = (rect.bottom - sr.top) + 20;
                sib.style.transform = 'translateY(' + push + 'px)';
                sib.setAttribute('data-pushed', 'true');
            }
        }
    }, 50);
}

function closeAllFolders(ev) {
    if(ev) ev.stopPropagation();
    let op = document.querySelectorAll('.expanded-folder');
    if(op.length === 0) return;
    
    for(let i=0; i<op.length; i++) op[i].classList.remove('expanded-folder');
    
    let push = document.querySelectorAll('.desktop-app[data-pushed="true"]');
    for(let j=0; j<push.length; j++) {
        push[j].style.transform = '';
        push[j].removeAttribute('data-pushed');
    }
    setTimeout(loadDesktop, 250);
}

function setupAppContextMenu() {
    let m = document.getElementById('app-context-menu');
    if(!m) return;
    m.innerHTML = `
        <li class="ctx-item" id="ctx-rename" role="menuitem" tabindex="0"><i class="fas fa-edit fa-fw" aria-hidden="true"></i> Rename</li>
        <li class="ctx-item" id="ctx-hidename" role="menuitem" tabindex="0"><i class="fas fa-eye-slash fa-fw" aria-hidden="true"></i> Toggle Name</li>
        <li class="ctx-item" id="ctx-changeicon" role="menuitem" tabindex="0"><i class="fas fa-image fa-fw" aria-hidden="true"></i> Change Icon</li>
        <li class="ctx-separator" role="separator"></li>
        <li class="ctx-item" id="ctx-delete" role="menuitem" tabindex="0"><i class="fas fa-trash fa-fw" style="color:#aaa;" aria-hidden="true"></i> Remove</li>
    `;
    
    document.getElementById('ctx-rename').onclick = function() {
        let i = m.getAttribute('data-target-idx');
        let nm = prompt("Enter new name:", desktopLayout[i].customName || "");
        if(nm !== null) {
            desktopLayout[i].customName = nm.trim() === "" ? "App" : nm;
            saveDesktop();
        }
        m.style.display = 'none';
    };
    
    document.getElementById('ctx-hidename').onclick = function() {
        let i = m.getAttribute('data-target-idx');
        desktopLayout[i].hideName = !desktopLayout[i].hideName;
        saveDesktop();
        m.style.display = 'none';
    };
    
    document.getElementById('ctx-changeicon').onclick = function() {
        let i = m.getAttribute('data-target-idx');
        let url = prompt("Enter image URL for custom icon:");
        if(url) {
            desktopLayout[i].customIcon = url;
            saveDesktop();
        }
        m.style.display = 'none';
    };
    
    document.getElementById('ctx-delete').onclick = function() {
        let i = m.getAttribute('data-target-idx');
        desktopLayout.splice(i, 1);
        saveDesktop();
        m.style.display = 'none';
    };
}

document.addEventListener('contextmenu', function(e) {
    let ids = ['desktop-area', 'windows-layer', 'bg-video', 'bg-img', 'snow-fx', 'right-sidebar'];
    if(ids.includes(e.target.id) || e.target.tagName === 'BODY' || e.target.closest('#right-sidebar')) {
        e.preventDefault();
        hideAllCtx();
        let m = document.getElementById('desktop-context-menu');
        if(m) {
            m.style.display = 'block';
            let x = e.pageX, y = e.pageY;
            if(x + 200 > window.innerWidth) x = window.innerWidth - 200;
            if(y + 100 > window.innerHeight) y = window.innerHeight - 100;
            m.style.left = x + 'px';
            m.style.top = y + 'px';
        }
    }
});

var DragSystem = {
    dragging: false, startPos: {x:0,y:0}, sourceType: null, sourceEl: null,
    idx: null, appId: null, proxy: document.getElementById('drag-proxy'),
    pImg: document.getElementById('proxy-img'), badge: document.getElementById('folder-badge'),
    
    init: function() {
        window.addEventListener('mousemove', e => this.move(e));
        window.addEventListener('mouseup', e => this.end(e));
    },
    
    start: function(e, el, type, id) {
        this.startPos = {x: e.clientX, y: e.clientY};
        this.sourceType = type; this.sourceEl = el; this.isDragMove = false;
        if(type === 'drawer' || type === 'dock') this.appId = id;
        else if(type === 'desktop') { this.idx = id; this.sourceEl.style.opacity = '0.5'; }
    },
    
    startWinDrag: function(e, id) {
        this.startPos = {x: e.clientX, y: e.clientY};
        this.sourceType = 'window'; this.sourceEl = document.getElementById('win-' + id);
        this.isDragMove = false;
    },
    
    move: function(e) {
        if(!this.sourceEl) return;
        let dx = Math.abs(e.clientX - this.startPos.x);
        let dy = Math.abs(e.clientY - this.startPos.y);
        
        if(dx > 3 || dy > 3) {
            this.dragging = true; this.isDragMove = true;
            if(this.sourceType === 'desktop' || this.sourceType === 'drawer' || this.sourceType === 'dock') {
                if(this.sourceType === 'drawer') toggleAppDrawer();
                this.proxy.style.display = 'block';
                this.proxy.style.transform = 'translate(' + (e.clientX - 25) + 'px,' + (e.clientY - 25) + 'px)';
                
                if(this.sourceType === 'drawer' || this.sourceType === 'dock') {
                    if(APPS[this.appId]) this.pImg.src = APPS[this.appId].icon;
                } else {
                    let itm = desktopLayout[this.idx];
                    if(itm.type === 'app') {
                        if(APPS[itm.id]) this.pImg.src = APPS[itm.id].icon;
                    } else {
                        this.pImg.src = '';
                        this.badge.style.display = 'flex';
                        this.badge.innerText = itm.apps.length;
                    }
                }
            }
        }
    },
    
    end: function(e) {
        if(!this.sourceEl) return;
        if(!this.isDragMove && this.sourceType === 'desktop') { this.reset(); return; }
        if(!this.dragging) { this.reset(); return; }
        
        if(this.sourceType === 'desktop' || this.sourceType === 'drawer' || this.sourceType === 'dock') {
            let nx = Math.round((e.clientX - 40) / 90) * 90;
            let ny = Math.round((e.clientY - 40) / 100) * 100;
            
            if(e.clientY > window.innerHeight - 80) {
                if(this.sourceType === 'desktop') desktopLayout.splice(this.idx, 1);
            } else {
                let tIdx = -1;
                let aAll = document.querySelectorAll('.desktop-app');
                for(let i=0; i<aAll.length; i++) {
                    if(aAll[i] !== this.sourceEl) {
                        let r = aAll[i].getBoundingClientRect();
                        if(e.clientX > r.left && e.clientX < r.right && e.clientY > r.top && e.clientY < r.bottom) tIdx = aAll[i].dataset.idx;
                    }
                }
                
                if(tIdx > -1) {
                    let targ = desktopLayout[tIdx];
                    let drp = (this.sourceType === 'drawer' || this.sourceType === 'dock') ? [this.appId] : (desktopLayout[this.idx].type === 'app' ? [desktopLayout[this.idx].id] : desktopLayout[this.idx].apps);
                    
                    if(targ.type === 'app') {
                        targ.type = 'folder';
                        targ.apps = [targ.id].concat(drp);
                        delete targ.id;
                    } else {
                        targ.apps.push.apply(targ.apps, drp);
                    }
                    if(this.sourceType === 'desktop') desktopLayout.splice(this.idx, 1);
                } else {
                    if(this.sourceType === 'drawer' || this.sourceType === 'dock') {
                        desktopLayout.push({type: 'app', id: this.appId, x: nx, y: ny});
                    } else {
                        desktopLayout[this.idx].x = nx;
                        desktopLayout[this.idx].y = ny;
                    }
                }
            }
            saveDesktop();
        }
        this.reset();
    },
    
    reset: function() {
        this.dragging = false;
        if(this.sourceEl) this.sourceEl.style.opacity = '1';
        this.sourceEl = null;
        this.proxy.style.display = 'none';
        this.badge.style.display = 'none';
    }
};
DragSystem.init();

window.toggleDesktopSize = function(l) {
    if(l) document.getElementById('desktop-area').classList.add('desktop-large-mode');
    else document.getElementById('desktop-area').classList.remove('desktop-large-mode');
    document.getElementById('desktop-context-menu').style.display = 'none';
};

var unlockedWallpapers = JSON.parse(localStorage.getItem('cine_unlocked_wp')) || ['default'];
var _wpSig = '';
window.wpMode = 'both';

function setWallpaper(k, noti=false) {
    let d = wallpaperRegistry[k];
    if(!d) return;
    
    if(noti && d.locked && !unlockedWallpapers.includes(d.id)) {
        unlockedWallpapers.push(d.id);
        localStorage.setItem('cine_unlocked_wp', JSON.stringify(unlockedWallpapers));
        alert("Wallpaper: [ " + d.name + " ] Unlocked.");
    }
    
    if(window.wpMode === 'home' || window.wpMode === 'both') {
        let bV = document.getElementById('bg-video');
        let bI = document.getElementById('bg-img');
        applyMediaToElements(d.url, bV, bI, true);
        updateSysSetting('homeWallpaper', k);
    }
    
    if(window.wpMode === 'lock' || window.wpMode === 'both') {
        let lV = document.getElementById('lock-video');
        let lI = document.getElementById('lock-img');
        applyMediaToElements(d.url, lV, lI, false);
        updateSysSetting('lockWallpaper', k);
    }
    
    updateWallpaperLoop();
    openWallpaperMenu();
}

function openWallpaperMenu() {
    let m = document.getElementById('wallpaper-menu');
    let gu = document.getElementById('wp-grid-unlocked');
    let gl = document.getElementById('wp-grid-locked');
    if(!m) return;
    
    if(m.showModal) m.showModal();
    else m.style.display = 'flex';
    m.classList.add('open');
    
    let wsig = unlockedWallpapers.length + ':' + Object.keys(wallpaperRegistry).length;
    if(wsig === _wpSig) return;
    _wpSig = wsig;
    
    gu.innerHTML = '';
    gl.innerHTML = '';
    
    for(let k in wallpaperRegistry) {
        let d = wallpaperRegistry[k];
        let ul = !d.locked || unlockedWallpapers.includes(d.id);
        let c = document.createElement('div');
        c.className = "wp-card " + (ul ? "" : "wp-locked");
        
        if(ul) {
            let mHtml = "";
            if(isImgUrl(d.url)) mHtml = '<img src="' + d.url + '" alt="wp">';
            else mHtml = '<video src="' + d.url + '" preload="metadata" playsinline muted loop onmouseover="this.play()" onmouseout="this.pause()"></video>';
            
            c.innerHTML = mHtml + '<div class="wp-info">' + d.name + '</div>';
            c.setAttribute('data-key', k);
            c.onclick = function() {
                setWallpaper(this.getAttribute('data-key'));
                let crds = document.querySelectorAll('.wp-card');
                for(let j=0; j<crds.length; j++) crds[j].classList.remove('active-wp');
                this.classList.add('active-wp');
            };
            gu.appendChild(c);
        } else {
            c.innerHTML = '<div class="wp-info"><i class="fas fa-lock"></i></div>';
            gl.appendChild(c);
        }
    }
    
    let chk = document.getElementById('wp-loop-chk');
    if(chk) {
        chk.checked = sysConfig.wpLoop;
        chk.onchange = e => updateSysSetting('wpLoop', e.target.checked);
    }
}

var sInp = document.getElementById('start-search-input');
if(sInp) {
    sInp.addEventListener('keydown', function(e) {
        if(e.key === 'Enter') {
            let q = this.value.trim();
            if(wallpaperRegistry[q]) {
                setWallpaper(q, true);
                this.value = "";
                this.blur();
            }
        }
    });
}

function toggleStartMenu() {
    let sm = document.getElementById('start-menu');
    if(sm.classList.contains('open')) {
        sm.classList.remove('open');
        setTimeout(function(){ sm.style.display='none'; }, 300);
    } else {
        sm.style.display = 'flex';
        setTimeout(function(){ sm.classList.add('open'); }, 10);
    }
}

document.addEventListener('click', function(e) {
    let sm = document.getElementById('start-menu');
    if(sm && !sm.contains(e.target) && !e.target.closest('.dock-item')) {
        sm.classList.remove('open');
        setTimeout(function(){ sm.style.display='none'; }, 300);
    }
});

var cvsSnow = document.getElementById('snow-fx');
if(cvsSnow) {
    var ctxSnow = cvsSnow.getContext('2d');
    var sW = window.innerWidth, sH = window.innerHeight;
    cvsSnow.width = sW; cvsSnow.height = sH;
    
    var flakes = [];
    for(var f=0; f<30; f++) flakes.push({x: Math.random()*sW, y: Math.random()*sH, r: Math.random()*2, s: Math.random()+0.5});
    
    var sLast = 0;
    function drawSnow(t) {
        requestAnimationFrame(drawSnow);
        if(!isDesktopActive || document.hidden || bgCovered) return;
        if(t - sLast < 33) return;
        sLast = t || 0;
        ctxSnow.clearRect(0, 0, sW, sH);
        ctxSnow.fillStyle = "rgba(255,255,255,0.3)";
        for(let i=0; i<flakes.length; i++) {
            let fl = flakes[i];
            ctxSnow.beginPath();
            ctxSnow.arc(fl.x, fl.y, fl.r, 0, Math.PI * 2);
            ctxSnow.fill();
            fl.y += fl.s;
            if(fl.y > sH) fl.y = 0;
        }
    }
    requestAnimationFrame(drawSnow);
}

var MODES = ['FAST', 'THINKING', 'LIVE'];
var cMode = 0;
var isCiriActive = false;
var holdTimer = null;
var hasBootCiri = false;
var expectKey = false;
var sStream = null;
var cImgB64 = null;
var cImgMime = null;

function checkApiKey() {
    let st = document.getElementById('status-text');
    let si = document.getElementById('status-icon');
    if(!st) return;
    if(localStorage.getItem('ciri_key')) {
        st.textContent = "Secure"; st.className = "secure";
        si.innerHTML = '<svg class="secure-svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="M9 12l2 2 4-4"></path></svg>';
    } else {
        st.textContent = "Unstable"; st.className = "unstable";
        si.innerHTML = '<svg class="unstable-svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
    }
}
checkApiKey();

window.autoGrow = function(el) { el.style.height = "5px"; el.style.height = (el.scrollHeight) + "px"; };

window.addEventListener('keydown', function(e) {
    if(e.altKey && (e.code === 'KeyS' || e.key.toLowerCase() === 's')) {
        if(!holdTimer && !isCiriActive) {
            holdTimer = setTimeout(function() {
                document.body.classList.add('ciri-active');
                isCiriActive = true;
                let cInp = document.getElementById('chat-input');
                if(!hasBootCiri) {
                    let bs = document.getElementById('ciri-boot-screen');
                    if(bs) bs.style.display = 'flex';
                    setTimeout(function(){ document.getElementById('boot-ciri-text').classList.add('typing'); }, 300);
                    setTimeout(function(){ document.getElementById('boot-sub-text').classList.add('show'); }, 1100);
                    setTimeout(function() {
                        document.getElementById('boot-loader').style.opacity = '1';
                        setTimeout(function() {
                            document.getElementById('boot-status-text').textContent = "Connection Established.";
                            document.getElementById('boot-spinner').style.display = 'none';
                            setTimeout(function() {
                                bs.style.filter = 'blur(10px)'; bs.style.opacity = '0';
                                setTimeout(function() {
                                    bs.style.display = 'none';
                                    hasBootCiri = true;
                                    if(cInp) cInp.focus();
                                }, 800);
                            }, 1800);
                        }, 1000);
                    }, 2200);
                } else {
                    setTimeout(function(){ if(cInp) cInp.focus(); }, 100);
                }
            }, 2000);
        }
    } else if(e.code === 'Escape' && isCiriActive) {
        closeCiri();
    }
});

window.addEventListener('keyup', function(e) {
    if(e.code === 'KeyS' || e.key.toLowerCase() === 's' || e.key === 'Alt') {
        clearTimeout(holdTimer); holdTimer = null;
    }
});

window.closeCiri = function() {
    document.body.classList.remove('ciri-active');
    isCiriActive = false;
};

var aMedia = null;
var nHide;
var cNoti = document.getElementById('cine-noti');

function showNoti() {
    if(!cNoti) return;
    cNoti.classList.add('active'); cNoti.classList.remove('minimized');
    let rb = document.getElementById('restore-btn');
    if(rb) rb.classList.remove('visible');
    resetNH();
}

function hideNoti() {
    if(!cNoti) return;
    cNoti.classList.remove('active'); cNoti.classList.remove('minimized');
    let rb = document.getElementById('restore-btn');
    if(rb) rb.classList.remove('visible');
    clearTimeout(nHide);
}

function resetNH() {
    clearTimeout(nHide);
    if(cNoti && cNoti.classList.contains('active') && !cNoti.classList.contains('minimized')) {
        nHide = setTimeout(function() {
            cNoti.classList.add('minimized');
            setTimeout(function(){ let rb = document.getElementById('restore-btn'); if(rb) rb.classList.add('visible'); }, 300);
        }, 5000);
    }
}

if(cNoti) {
    cNoti.addEventListener('mouseenter', function(){ clearTimeout(nHide); });
    cNoti.addEventListener('mouseleave', resetNH);
    let mn = document.getElementById('minimize-noti-btn');
    if(mn) mn.onclick = function() {
        cNoti.classList.add('minimized');
        setTimeout(function(){ let rb = document.getElementById('restore-btn'); if(rb) rb.classList.add('visible'); }, 300);
    };
    let rbtn = document.getElementById('restore-btn');
    if(rbtn) rbtn.onclick = function() {
        this.classList.remove('visible');
        cNoti.classList.remove('minimized');
        resetNH();
    };
    let clbtn = document.getElementById('close-noti-btn');
    if(clbtn) clbtn.onclick = function() {
        if(aMedia) aMedia.pause();
        hideNoti();
    };
}

setInterval(function() {
    if(document.hidden) return;
    let fnd = null;
    let md = document.querySelectorAll('audio, video');
    for(let i=0; i<md.length; i++) {
        let m = md[i];
        if(!m.paused && !m.muted && m.volume > 0 && !['bg-video', 'lock-video', 'boot-video'].includes(m.id)) fnd = m;
    }
    
    let ifr = document.querySelectorAll('iframe');
    for(let j=0; j<ifr.length; j++) {
        try {
            let idc = ifr[j].contentDocument || ifr[j].contentWindow.document;
            if(idc) {
                let imd = idc.querySelectorAll('audio, video');
                for(let k=0; k<imd.length; k++) {
                    if(!imd[k].paused && !imd[k].muted && imd[k].volume > 0) fnd = imd[k];
                }
            }
        } catch(e) {}
    }
    
    isMediaPlaying = !!fnd;
    if(fnd !== aMedia) {
        if(fnd) { aMedia = fnd; setupM(); showNoti(); }
        else { aMedia = null; hideNoti(); }
    }
    
    if(aMedia) {
        let ct = document.getElementById('current-time');
        if(ct) ct.textContent = fmtT(aMedia.currentTime);
        if(isFinite(aMedia.duration) && aMedia.duration > 0) {
            let pf = document.getElementById('progress-fill');
            if(pf) pf.style.width = ((aMedia.currentTime / aMedia.duration) * 100) + "%";
            let tt = document.getElementById('total-time');
            if(tt) tt.textContent = fmtT(aMedia.duration);
        }
    }
}, 2000);

function setupM() {
    if(!aMedia) return;
    let nt = document.getElementById('noti-title');
    if(nt) nt.innerText = aMedia.title || "Web Media Playing";
    
    let pp = document.getElementById('play-pause');
    if(pp) pp.onclick = function() { aMedia.paused ? aMedia.play() : aMedia.pause(); resetNH(); };
    
    aMedia.addEventListener('play', function() {
        let iPl = document.getElementById('icon-play');
        let iPa = document.getElementById('icon-pause');
        if(iPl) iPl.classList.add('hidden-svg');
        if(iPa) iPa.classList.add('visible-svg');
        showNoti();
    });
    
    aMedia.addEventListener('pause', function() {
        let iPl = document.getElementById('icon-play');
        let iPa = document.getElementById('icon-pause');
        if(iPl) { iPl.classList.remove('hidden-svg'); iPl.classList.add('visible-svg'); }
        if(iPa) { iPa.classList.remove('visible-svg'); iPa.classList.add('hidden-svg'); }
    });
    
    let sb = document.getElementById('skip-back');
    if(sb) sb.onclick = function() { if(isFinite(aMedia.currentTime)) aMedia.currentTime = Math.max(0, aMedia.currentTime - 15); resetNH(); };
    
    let sf = document.getElementById('skip-forward');
    if(sf) sf.onclick = function() { if(isFinite(aMedia.duration) && aMedia.duration > 0) aMedia.currentTime = Math.min(aMedia.duration, aMedia.currentTime + 15); resetNH(); };
    
    let pha = document.getElementById('progress-hit-area');
    if(pha) pha.onclick = function(e) {
        if(isFinite(aMedia.duration) && aMedia.duration > 0) {
            let r = this.getBoundingClientRect();
            let p = (e.clientX - r.left) / r.width;
            aMedia.currentTime = p * aMedia.duration;
        }
        resetNH();
    };
}

function fmtT(s) {
    if(isNaN(s) || !isFinite(s)) return "0:00";
    let m = Math.floor(s / 60);
    let se = Math.floor(s % 60);
    return m + ":" + se.toString().padStart(2, '0');
}

var _fvCtx = null, _fvW = 0;
function drawFV() {
    requestAnimationFrame(drawFV);
    if(document.hidden || !cNoti || !aMedia) return;
    if(!cNoti.classList.contains('active') || cNoti.classList.contains('minimized')) return;
    let cv = document.getElementById('visualizer');
    if(!cv) return;
    if(!_fvCtx) _fvCtx = cv.getContext('2d');
    let cx = _fvCtx;
    
    let fvW = cv.parentElement.clientWidth;
    if(fvW !== _fvW) { cv.width = fvW; cv.height = 14; _fvW = fvW; }
    
    let bL = 32;
    cx.clearRect(0, 0, cv.width, cv.height);
    let bW = (cv.width / bL) * 2;
    let xP = 0;
    
    for(let i=0; i<bL; i++) {
        let bH = aMedia && !aMedia.paused ? (Math.random() * cv.height) : 2;
        cx.fillStyle = "#fff";
        cx.beginPath();
        cx.roundRect(xP, cv.height - bH, bW - 1.5, bH, 2);
        cx.fill();
        xP += bW;
    }
}
drawFV();

var fLT = performance.now();
var fFr = 0;
var fLC = 0;

function chkFps() {
    if(document.hidden) {
        fLT = performance.now(); fFr = 0;
        requestAnimationFrame(chkFps);
        return;
    }
    let nw = performance.now();
    fFr++;
    if(nw - fLT >= 1000) {
        let cFps = fFr;
        let fv = document.getElementById('fps-val');
        if(fv && fv.textContent != cFps) fv.textContent = cFps;

        if(cFps <= 20) {
            fLC++;
            if(fLC >= 5 && !sysConfig.optBg) {
                sysConfig.optBg = true;
                localStorage.setItem('cine_sys_config', JSON.stringify(sysConfig));
                let bv = document.getElementById('bg-video');
                let lv = document.getElementById('lock-video');
                if(bv) bv.pause();
                if(lv) lv.pause();
                showNotification("System Optimized", "Low FPS detected. Backgrounds paused.");
            }
        } else {
            fLC = 0;
        }
        
        fFr = 0;
        fLT = nw;
    }
    requestAnimationFrame(chkFps);
}
requestAnimationFrame(chkFps);

