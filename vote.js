javascript:(async()=>{
let U=(location.href.match(/(https:\/\/www\.rollspel\.nu\/threads\/[^\/]+\/)/)||[])[1];
if(!U)return alert("Kunde inte hitta trådens URL.");
let R=/\bröst\s*:\s*/i, Ure=/data-username="@([^"]+)"/i;
let $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],
F=t=>t?new Date(t).toLocaleString("sv-SE",{dateStyle:"short",timeStyle:"short"}):"–",
E=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
document.title="Varulv Rösträknare";
document.head.innerHTML=
'<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+
'<style>'+
'body{font-family:Arial,sans-serif;margin:2em;background:#f9f9f9;color:#333}'+
'label,button,select,input{margin:8px 10px 8px 0}select,button,input{padding:6px}#timeSlider{padding:0;}'+
'table{border-collapse:collapse;width:100%;margin-top:12px;background:#fff;border:1px solid #ccc}'+
'th,td{padding:8px 10px;border:1px solid #ccc;text-align:center;vertical-align:top}'+
'th{background:#3c8dbc;color:#fff;cursor:pointer}.summary{font-weight:bold;font-size:18px;margin:12px 0}'+
'.sliderRow{display:flex;align-items:center;gap:10px;margin:8px 0}.votesHeader{display:flex;align-items:baseline;gap:10px;margin-top:18px}'+
'.playerLabel{font-size:12px;opacity:.75}#playerFilter{font-size:12px;padding:4px}'+
'#voteTable td:last-child,#voteTable th:last-child{padding-right:18px}.small{font-size:12px;opacity:.8}'+
'</style>';
document.body.innerHTML=
'<div id=pageTitle><h1>🐺 Varulv Rösträknare</h1></div>'+
'<div class=small>Källa: <a target=_blank href="'+U+'">'+U+'</a></div>'+
'<button id=exportBtn>Exportera CSV</button><br>'+
'<label><input type=radio name=voteView value=latest checked> Endast senaste röst</label>'+
'<label><input type=radio name=voteView value=all> Alla röster</label><br>'+
'<button id=liveModeBtn type=button>▶ Animera röster</button>'+
'<label>Hastighet: <input type=number id=liveDelayInput value=200 min=0 style="width:60px"> ms</label><br>'+
'<div class=sliderRow><label for=timeSlider>Visa röster fram till:</label>'+
'<input type=range id=timeSlider min=0 max=100 value=100> <span id=sliderTimeLabel>–</span></div>'+
'<div class=summary id=summary></div>'+
'<canvas id=chart width=520 height=225></canvas>'+
'<div class=votesHeader><h2 style="margin:0">Röster</h2>'+
'<label class=playerLabel for=playerFilter>Filter per spelare</label>'+
'<select id=playerFilter></select></div>'+
'<table id=voteTable><thead><tr>'+
'<th data-sort=from>Röstgivare</th><th>Röst</th><th data-sort=ts>Tidpunkt</th>'+
'<th>Riskerar att åka ut</th><th>Därefter</th>'+
'</tr></thead><tbody></tbody></table>';
let S={votes:[],players:[],colors:{},fp:"",sort:"",live:0,anim:0,pct:100,lim:null,range:{min:null,max:null}},
L={exp:$("#exportBtn"),view:$$('input[name="voteView"]'),live:$("#liveModeBtn"),
delay:$("#liveDelayInput"),slider:$("#timeSlider"),lbl:$("#sliderTimeLabel"),
sum:$("#summary"),tb:$("#voteTable tbody"),fp:$("#playerFilter"),ths:$$('#voteTable thead th'),
cv:$("#chart")},
V=()=>L.view.find(r=>r.checked)?.value||"latest",
C=n=>{let u=[...new Set(n)].sort((a,b)=>a.localeCompare(b,"sv")),m={};u.forEach((x,i)=>m[x]=`hsl(${Math.round(i*360/u.length)},70%,60%)`);return m},
Latest=vs=>{let m={};vs.slice().sort((a,b)=>+new Date(a.ts)-+new Date(b.ts)).forEach(v=>m[v.from]=v);return Object.values(m)};
const firstAfter=function(line){
  const d=document.createElement("div");
  d.innerHTML=line;
  const w=document.createTreeWalker(d,NodeFilter.SHOW_TEXT|NodeFilter.SHOW_ELEMENT);
  let seen=false,buf="";
  while(w.nextNode()){
    const n=w.currentNode;
    if(n.nodeType===3){
      buf+=(n.nodeValue||"");
      if(!seen&&R.test(buf)) seen=true;
      if(buf.length>200) buf=buf.slice(-200);
    }else if(seen&&n.nodeType===1){
      const du=n.getAttribute&&n.getAttribute("data-username");
      if(du){
        const m=du.match(/^@(.+)$/);
        if(m) return m[1].trim();
      }
    }
  }
  return null;
};
function PV(doc){
  let out=[];
  doc.querySelectorAll("article[data-author]").forEach(p=>{
    let from=p.getAttribute("data-author")||"",
        pid=(p.id||"").replace("js-post-",""),
        ts=p.querySelector("time.u-dt")?.getAttribute("datetime")||"";
    p.querySelectorAll("blockquote").forEach(b=>b.remove());
    let html=p.querySelector(".message-content")?.innerHTML||"";
    if(!html||!pid) return;
    html.split(/\n|<br\s*\/?>/i).forEach(line=>{
      const plain=line.replace(/<[^>]+>/g,' ');
      if(!R.test(plain)) return;
      const to=firstAfter(line);
      if(to) out.push({from,to,ts,post:pid});
    });
  });
  return out;
}
async function FA(){
L.sum.textContent="Hämtar tråden…";
let votes=[];
for(let page=1;;page++){
let url=page===1?U:`${U}page-${page}`,r=await fetch(url);
if(!r.ok)break;
let html=await r.text(),doc=new DOMParser().parseFromString(html,"text/html");
votes.push(...PV(doc));
if(!doc.querySelector(".pageNav-jump--next"))break;
}
votes.sort((a,b)=>+new Date(a.ts)-+new Date(b.ts));
return votes;
}
function Sub(){
let vs=S.votes;
if(S.lim)vs=vs.filter(v=>+new Date(v.ts)<=+S.lim);
if(V()==="latest")vs=Latest(vs);
return vs;
}
function Bars(ent){
let ctx=L.cv.getContext("2d"),W=L.cv.width,H=L.cv.height;
ctx.clearRect(0,0,W,H);
let pad=10,left=160,lab=ent.map(e=>e[0]),dat=ent.map(e=>e[1]),mx=Math.max(1,...dat);
ctx.font="18px Arial";
lab.forEach((name,i)=>{
let barH=Math.max(12,Math.floor((H-2*pad)/Math.max(1,lab.length))-2),
y=pad+i*(barH+2),
w=Math.floor((W-left-pad-10)*dat[i]/mx),
c=S.colors[name]||"#999",
val=""+dat[i],
tw=ctx.measureText(val).width;
ctx.fillStyle=c;ctx.fillText(name,pad,y+barH-2);
ctx.fillStyle=c;ctx.fillRect(left,y,w,barH);
ctx.fillStyle="#fff";
ctx.fillText(val,Math.max(left+4,left+w-tw-4),y+barH-2);
});
}
function Sort(k){
let rows=$$("#voteTable tbody tr"),asc=!S.sort.endsWith("-desc"),col=k.startsWith("from")?0:2;
rows.sort((a,b)=>{
let A=a.children[col].textContent.trim(),B=b.children[col].textContent.trim();
return asc?A.localeCompare(B,"sv"):B.localeCompare(A,"sv");
});
L.tb.innerHTML="";rows.forEach(r=>L.tb.appendChild(r));
}
function Empty(msg){
L.sum.textContent=msg||"";
L.tb.innerHTML="";
L.cv.getContext("2d").clearRect(0,0,L.cv.width,L.cv.height);
}
function Render(){
let vs=Sub();
if(!vs.length)return Empty("Inga röster att visa.");
let cnt={},first={};
vs.slice().sort((a,b)=>+new Date(a.ts)-+new Date(b.ts)).forEach(v=>{
cnt[v.to]=(cnt[v.to]||0)+1;
if(!first[v.to]||+new Date(v.ts)<+new Date(first[v.to]))first[v.to]=v.ts;
});
let ord=Object.entries(cnt).sort((a,b)=>b[1]-a[1]||(+new Date(first[a[0]])-+new Date(first[b[0]]))),
[danger,dCnt]=ord[0]||["Ingen",0],
last=vs.reduce((acc,v)=>!acc||+new Date(v.ts)>+new Date(acc)?v.ts:acc,null);
L.sum.textContent=`⚠️ Risk för utröstning: ${danger} (${dCnt} röster, sedan ${F(first[danger])}). Senast röst lagd ${F(last)}.`;
L.tb.innerHTML="";
let hist={},run={},GC=n=>S.colors[n]||"#000";
vs.slice().sort((a,b)=>+new Date(a.ts)-+new Date(b.ts)).forEach(v=>{
run[v.to]=(run[v.to]||0)+1;
let stand=Object.entries(run).sort((x,y)=>y[1]-x[1]),
leader=stand[0]?`${stand[0][0]} (${stand[0][1]})`:"–",
runner=stand[1]?`${stand[1][0]} (${stand[1][1]})`:"–";
hist[v.from]=hist[v.from]||[];
if(hist[v.from][hist[v.from].length-1]!==v.to)hist[v.from].push(v.to);
let chain=hist[v.from].map((n,i,a)=>{
let c=GC(n),safe=E(n);
return i===a.length-1
?`<a target=_blank href="${U}post-${v.post}" style="color:${c};font-weight:bold">${safe}</a>`
:`<span style="color:${c}">${safe}</span>`;
}).join(" → ");
let tr=document.createElement("tr");
tr.dataset.from=v.from;
tr.innerHTML=`<td style="color:${GC(v.from)};font-weight:bold">${E(v.from)}</td><td>${chain}</td><td>${F(v.ts)}</td><td>${leader}</td><td>${runner}</td>`;
L.tb.appendChild(tr);
});
if(S.fp)$$("#voteTable tbody tr").forEach(r=>r.style.display=r.dataset.from===S.fp?"":"none");
if(S.sort)Sort(S.sort);
Bars(ord);
}
function Slider(){
S.pct=parseInt(L.slider.value||"100",10);
if(!S.range.min||!S.range.max){S.lim=null;L.lbl.textContent="–";return;}
let min=+S.range.min,max=+S.range.max;
S.lim=new Date(min+(max-min)*S.pct/100);
L.lbl.textContent=F(S.lim);
if(!S.anim)Render();
}
function Play(){
if(S.anim)return;
S.anim=1;
L.live.disabled=true;
let d=parseInt(L.delay.value||"200",10),lim=S.lim,
all=S.votes.filter(v=>!lim||+new Date(v.ts)<=+lim).sort((a,b)=>+new Date(a.ts)-+new Date(b.ts));
let i=0;
(function step(){
if(i>all.length){S.anim=0;L.live.disabled=false;return;}
let sub=all.slice(0,i),show=V()==="all"?sub:Latest(sub),old=S.votes;
S.votes=show;Render();S.votes=old;
i++;setTimeout(step,d);
})();
}
function CSV(){
let csv=["Röstgivare,Röst,Tidpunkt,Post"];
S.votes.forEach(v=>csv.push(`"${v.from}","${v.to}","${v.ts}","${v.post}"`));
let a=document.createElement("a");
a.href=URL.createObjectURL(new Blob([csv.join("\n")],{type:"text/csv"}));
a.download="rostdata.csv";a.click();
}
L.exp.addEventListener("click",CSV);
L.view.forEach(r=>r.addEventListener("change",Render));
L.live.addEventListener("click",Play);
L.slider.addEventListener("input",Slider);
L.fp.addEventListener("change",()=>{S.fp=L.fp.value||"";Render()});
L.ths.forEach(th=>{
let k=th.dataset.sort;if(!k)return;
th.addEventListener("click",()=>{
let cur=S.sort||`${k}-asc`,desc=cur.startsWith(k)&&cur.endsWith("-asc");
S.sort=`${k}-${desc?"desc":"asc"}`;Render();
});
});
S.votes=await FA();
S.players=[...new Set(S.votes.flatMap(v=>[v.from,v.to]))];
S.colors=C(S.players);
L.fp.innerHTML='<option value="">Alla</option>';
S.players.slice().sort((a,b)=>a.localeCompare(b,"sv")).forEach(n=>{
let o=document.createElement("option");
o.value=n;o.textContent=n;o.style.color=S.colors[n]||"#000";o.style.fontWeight="bold";
L.fp.appendChild(o);
});
let t=S.votes.map(v=>+new Date(v.ts)).sort((a,b)=>a-b);
S.range={min:t[0]?new Date(t[0]):null,max:t[t.length-1]?new Date(t[t.length-1]):null};
Slider();Render();
})();
