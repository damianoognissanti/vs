javascript:(async function(){
const currentUrl=window.location.href;
const match=currentUrl.match(/(https:\/\/www\.rollspel\.nu\/threads\/[^\/]+\/)/);
if(!match){alert("Kunde inte hitta trådens URL.");return;}
const threadUrl=match[1];
const voteStart=/\bröst\s*:\s*/i;
const userTag=/data-username="@([^"]+)"/i;
const votes=[];
const firstAfter=function(line){
  const d=document.createElement("div");
  d.innerHTML=line;
  const w=document.createTreeWalker(d,NodeFilter.SHOW_TEXT|NodeFilter.SHOW_ELEMENT);
  let seen=false,buf="";
  while(w.nextNode()){
    const n=w.currentNode;
    if(n.nodeType===3){
      buf+=(n.nodeValue||"");
      if(!seen&&voteStart.test(buf)) seen=true;
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
for(let page=1;;page++){
  const url=page===1?threadUrl:`${threadUrl}page-${page}`;
  try{
    const response=await fetch(url);
    if(!response.ok)throw new Error(`Misslyckades att hämta sida ${page}`);
    const html=await response.text();
    const doc=new DOMParser().parseFromString(html,'text/html');
    const posts=doc.querySelectorAll('article[data-author]');
    posts.forEach(post=>{
      const username=post.getAttribute('data-author')||'';
      post.querySelectorAll('blockquote').forEach(bq=>bq.remove());
      const content=post.querySelector('.message-content')?.innerHTML;
      const postId=post.id?.replace('js-post-','');
      if(content){
        content.split(/\n|<br\s*\/?>/i).forEach(line=>{
          const plain=line.replace(/<[^>]+>/g,' ');
          if(!voteStart.test(plain)) return;
          const to=firstAfter(line);
          if(to&&postId){
            votes.push({from:username,to:to,postId});
          }
        });
      }
    });
    const nextPage=doc.querySelector('.pageNav-jump--next');
    if(!nextPage)break;
  }catch(err){
    console.error(err);
    break;
  }
}
const votesByUser={};
votes.forEach(v=>{
  if(!votesByUser[v.from])votesByUser[v.from]=[];
  votesByUser[v.from].push(v);
});
const voteCounts={};
Object.values(votesByUser).forEach(voteList=>{
  const last=voteList[voteList.length-1];
  if(!last) return;
  voteCounts[last.to]=(voteCounts[last.to]||0)+1;
});
let mostVoted=null;
let mostVotes=-1;
for(const[person,count]of Object.entries(voteCounts)){
  if(count>mostVotes){
    mostVotes=count;
    mostVoted=person;
  }
}
const old=document.getElementById('wwVotesWrap');
if(old) old.remove();
const table=document.createElement('table');
table.style.borderCollapse='collapse';
table.style.marginTop='20px';
table.style.fontFamily='Arial, sans-serif';
table.style.width='100%';
table.style.maxWidth='800px';
table.style.margin='20px auto';
table.style.border='2px solid #333';
table.style.backgroundColor='#f4f4f9';
table.innerHTML=`<thead>
<tr>
<th style="border:1px solid #333;background-color:#3c8dbc;color:white;padding:8px;font-size:18px;">Röstgivare</th>
<th style="border:1px solid #333;background-color:#3c8dbc;color:white;padding:8px;font-size:18px;">Röster</th>
</tr>
</thead>`;
const tbody=document.createElement('tbody');
Object.entries(votesByUser).forEach(([from,voteList])=>{
  const tr=document.createElement('tr');
  tr.style.backgroundColor='#ffffff';
  tr.style.borderBottom='1px solid #ddd';
  const voteLinks=voteList.map(v=>
    `<a href="${threadUrl}post-${v.postId}" target="_blank" style="color:#007bff;">${v.to}</a>`
  );
  tr.innerHTML=`
<td style="border:1px solid #333;padding:8px;text-align:center;font-size:16px;">${from}</td>
<td style="border:1px solid #333;padding:8px;text-align:center;font-size:16px;">${voteLinks.join(', ')}</td>
`;
  tbody.appendChild(tr);
});
table.appendChild(tbody);
const hr=document.createElement('hr');
hr.style.margin='20px 0';
hr.style.borderTop='3px solid #333';
const dangerText=document.createElement('div');
dangerText.textContent=`Risk för utröstning: ${mostVoted} (${mostVotes})`;
dangerText.style.fontSize='22px';
dangerText.style.fontWeight='bold';
dangerText.style.color='#d9534f';
dangerText.style.textAlign='center';
const wrap=document.createElement('div');
wrap.id='wwVotesWrap';
wrap.appendChild(table);
wrap.appendChild(hr);
wrap.appendChild(dangerText);
document.body.appendChild(wrap);
wrap.scrollIntoView({behavior:'smooth',block:'start'});
})();
