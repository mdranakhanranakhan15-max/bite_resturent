(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))n(s);new MutationObserver(s=>{for(const i of s)if(i.type==="childList")for(const o of i.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&n(o)}).observe(document,{childList:!0,subtree:!0});function r(s){const i={};return s.integrity&&(i.integrity=s.integrity),s.referrerPolicy&&(i.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?i.credentials="include":s.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function n(s){if(s.ep)return;s.ep=!0;const i=r(s);fetch(s.href,i)}})();const ae=["pos","kitchen","menu","inventory","bills","staff"],F={users:[{id:"u1",name:"Zayan Khan",username:"zayan",role:"Admin",pin:"1234",active:!0,permissions:[...ae]},{id:"u2",name:"Tariq Mahmud",username:"tariq",role:"Manager",pin:"1234",active:!0,permissions:[...ae]},{id:"u3",name:"Ayesha Noor",username:"ayesha",role:"Cashier",pin:"1234",active:!0,permissions:["pos","menu","bills"]},{id:"u4",name:"Samiul Haque",username:"samiul",role:"Waiter",pin:"1234",active:!0,permissions:["pos","menu"]},{id:"u5",name:"Chef Arman",username:"arman",role:"Chef",pin:"1234",active:!0,permissions:["kitchen","menu","inventory"]}],categories:["Burgers","Sandwiches","Pizza","Sides","Beverages","Desserts"],kitchenStations:["Grill","Fryer","Cold","Oven","Bar","Pastry"],inventory:[{id:"ing1",name:"Brioche Burger Bun",qty:18,unit:"pcs",minAlert:20,unitCost:.4,supplier:"Crust Bakery"},{id:"ing2",name:"Smashed Beef Patty (130g)",qty:42,unit:"pcs",minAlert:15,unitCost:1.1,supplier:"Prime Meats"},{id:"ing3",name:"Crispy Chicken Fillet",qty:12,unit:"pcs",minAlert:15,unitCost:.95,supplier:"Golden Poultry"},{id:"ing4",name:"Cheddar & Mozzarella Mix",qty:900,unit:"g",minAlert:1e3,unitCost:.012,supplier:"Dairy Fresh"},{id:"ing5",name:"Artisan Sourdough Slice",qty:64,unit:"pcs",minAlert:20,unitCost:.3,supplier:"Crust Bakery"},{id:"ing6",name:"Pizza Dough Ball (250g)",qty:8,unit:"pcs",minAlert:10,unitCost:.55,supplier:"In-House Prep"},{id:"ing7",name:"Shoestring Potatoes",qty:7400,unit:"g",minAlert:2500,unitCost:.004,supplier:"Agro Farm"},{id:"ing8",name:"Arabica Espresso & Milk Mix",qty:12,unit:"serv",minAlert:15,unitCost:.65,supplier:"Roast Co."}],menu:[{id:"m1",code:"BG-01",name:"Smash Classic",category:"Burgers",station:"Grill",price:12.5,cost:4.2,available:!0,ingredients:7,desc:"Double-smashed beef, aged cheddar, pickles and house sauce on a toasted brioche bun.",recipe:[{ingId:"ing1",qty:1},{ingId:"ing2",qty:1},{ingId:"ing4",qty:25}]},{id:"m2",code:"BG-02",name:"Double Stack",category:"Burgers",station:"Grill",price:16,cost:5.4,available:!0,ingredients:9,desc:"Two seared patties, smoked bacon, caramelised onion and molten American cheese.",recipe:[{ingId:"ing1",qty:1},{ingId:"ing2",qty:2},{ingId:"ing4",qty:40}]},{id:"m3",code:"BG-03",name:"Truffle Mushroom",category:"Burgers",station:"Grill",price:15.5,cost:5.1,available:!0,ingredients:8,desc:"Garlic-buttered mushrooms, truffle aioli and Swiss cheese over a flame-grilled patty.",recipe:[{ingId:"ing1",qty:1},{ingId:"ing2",qty:1},{ingId:"ing4",qty:30}]},{id:"m4",code:"BG-04",name:"Crispy Chicken",category:"Burgers",station:"Fryer",price:13,cost:4,available:!0,ingredients:6,desc:"Buttermilk-brined chicken thigh, slaw and spicy honey mayo in a potato bun.",recipe:[{ingId:"ing1",qty:1},{ingId:"ing3",qty:1}]},{id:"m5",code:"SW-01",name:"Club Sandwich",category:"Sandwiches",station:"Grill",price:11,cost:3.6,available:!0,ingredients:8,desc:"Triple-decker sourdough with roast chicken, bacon, tomato and herb aioli.",recipe:[{ingId:"ing5",qty:3},{ingId:"ing3",qty:1},{ingId:"ing4",qty:30}]},{id:"m6",code:"SW-02",name:"Classic BLT",category:"Sandwiches",station:"Cold",price:9.5,cost:2.9,available:!0,ingredients:5,desc:"Smoked bacon, butter lettuce and vine tomato with cracked pepper mayo.",recipe:[{ingId:"ing5",qty:2},{ingId:"ing4",qty:15}]},{id:"m7",code:"SW-03",name:"Italian Sub",category:"Sandwiches",station:"Cold",price:12,cost:3.9,available:!0,ingredients:9,desc:"Salami, capicola, provolone and pickled peppers on a sesame hoagie.",recipe:[{ingId:"ing5",qty:2},{ingId:"ing4",qty:35}]},{id:"m8",code:"SW-04",name:"Grilled Veggie Sub",category:"Sandwiches",station:"Grill",price:10,cost:2.6,available:!0,ingredients:7,desc:"Charred courgette, peppers, aubergine and hummus on toasted ciabatta.",recipe:[{ingId:"ing5",qty:2},{ingId:"ing4",qty:25}]},{id:"m9",code:"SD-01",name:"Truffle Fries",category:"Sides",station:"Fryer",price:6.5,cost:1.4,available:!0,ingredients:4,desc:"Shoestring potatoes tossed in truffle oil, parmesan and fresh parsley.",recipe:[{ingId:"ing7",qty:220},{ingId:"ing4",qty:20}]},{id:"m10",code:"SD-02",name:"Peri-Peri Tenders",category:"Sides",station:"Fryer",price:8,cost:2.5,available:!0,ingredients:5,desc:"Crispy chicken tenders glazed in fiery peri-peri with a cooling dip.",recipe:[{ingId:"ing3",qty:1},{ingId:"ing7",qty:100}]},{id:"m11",code:"PZ-01",name:"Margherita",category:"Pizza",station:"Oven",price:13.5,cost:3.8,available:!0,ingredients:6,desc:"San Marzano tomato, fior di latte and basil on a 48-hour fermented base.",recipe:[{ingId:"ing6",qty:1},{ingId:"ing4",qty:100}]},{id:"m12",code:"PZ-02",name:"Pepperoni Honey",category:"Pizza",station:"Oven",price:15,cost:4.5,available:!0,ingredients:7,desc:"Cup-and-char pepperoni, chilli honey and smoked mozzarella.",recipe:[{ingId:"ing6",qty:1},{ingId:"ing4",qty:120}]},{id:"m13",code:"PZ-03",name:"Chicken Alfredo",category:"Pizza",station:"Grill",price:14.5,cost:4.2,available:!0,ingredients:6,desc:"Fettuccine in a silky parmesan cream with grilled chicken and thyme.",recipe:[{ingId:"ing3",qty:1},{ingId:"ing4",qty:60}]},{id:"m14",code:"PZ-04",name:"Arrabbiata Penne",category:"Pizza",station:"Grill",price:12,cost:3.1,available:!0,ingredients:5,desc:"Penne in a slow-cooked tomato sugo with chilli, garlic and basil.",recipe:[{ingId:"ing4",qty:45}]},{id:"m15",code:"BV-01",name:"Iced Spanish Latte",category:"Beverages",station:"Bar",price:4.5,cost:1,available:!0,ingredients:3,desc:"Double espresso, condensed milk and ice, finished with cinnamon.",recipe:[{ingId:"ing8",qty:1}]},{id:"m16",code:"BV-02",name:"Passionfruit Cooler",category:"Beverages",station:"Bar",price:3.5,cost:.7,available:!0,ingredients:3,desc:"Passionfruit, lime and sparkling water over crushed ice.",recipe:[{ingId:"ing8",qty:1}]},{id:"m17",code:"BV-03",name:"Fresh Mint Lemonade",category:"Beverages",station:"Bar",price:3,cost:.5,available:!0,ingredients:4,desc:"Fresh mint, lemon and cane sugar shaken with still water.",recipe:[{ingId:"ing8",qty:1}]},{id:"m18",code:"DS-01",name:"Dark Chocolate Tart",category:"Desserts",station:"Pastry",price:7,cost:2,available:!0,ingredients:6,desc:"70% dark chocolate ganache in a cocoa pastry shell with sea salt.",recipe:[{ingId:"ing4",qty:20}]},{id:"m19",code:"DS-02",name:"Basque Cheesecake",category:"Desserts",station:"Pastry",price:6.5,cost:1.8,available:!0,ingredients:5,desc:"Burnt-top Basque cheesecake with a soft vanilla centre.",recipe:[{ingId:"ing4",qty:30}]},{id:"m20",code:"DS-03",name:"Sticky Toffee Pudding",category:"Desserts",station:"Pastry",price:6,cost:1.5,available:!1,ingredients:5,desc:"Date sponge, toffee sauce and clotted cream.",recipe:[{ingId:"ing4",qty:20}]}],tables:[{id:"T-01",name:"T-01",status:"Occupied",waiter:"Samiul Haque",guests:3,kotStatus:"Cooking",items:[{dishId:"m1",name:"Smash Classic",price:12.5,qty:2,station:"Grill"},{dishId:"m9",name:"Truffle Fries",price:6.5,qty:1,station:"Fryer"},{dishId:"m15",name:"Iced Spanish Latte",price:4.5,qty:2,station:"Bar"}]},{id:"T-02",name:"T-02",status:"Available",waiter:"Samiul Haque",guests:0,kotStatus:"Pending",items:[]},{id:"T-03",name:"T-03",status:"Occupied",waiter:"Samiul Haque",guests:2,kotStatus:"Ready",items:[{dishId:"m5",name:"Club Sandwich",price:11,qty:1,station:"Grill"},{dishId:"m12",name:"Pepperoni Honey",price:15,qty:1,station:"Oven"}]},{id:"T-04",name:"T-04",status:"Available",waiter:"Samiul Haque",guests:0,kotStatus:"Pending",items:[]},{id:"T-05",name:"T-05",status:"Available",waiter:"Samiul Haque",guests:0,kotStatus:"Pending",items:[]},{id:"T-06",name:"T-06",status:"Available",waiter:"Samiul Haque",guests:0,kotStatus:"Pending",items:[]},{id:"T-07",name:"T-07",status:"Available",waiter:"Samiul Haque",guests:0,kotStatus:"Pending",items:[]},{id:"T-08",name:"T-08",status:"Available",waiter:"Samiul Haque",guests:0,kotStatus:"Pending",items:[]},{id:"Takeaway",name:"Takeaway",status:"Occupied",waiter:"Ayesha Noor",guests:1,kotStatus:"Pending",items:[{dishId:"m4",name:"Crispy Chicken",price:13,qty:1,station:"Fryer"}]}],invoices:[{id:"INV-1001",tableId:"T-02",cashier:"Ayesha Noor",payMethod:"Card",createdAt:"2026-10-20 19:45",items:[{name:"Smash Classic",qty:2,price:12.5},{name:"Iced Spanish Latte",qty:2,price:4.5}],subtotal:34,discount:2,vat:1.6,service:1.6,total:35.2},{id:"INV-1002",tableId:"Takeaway",cashier:"Ayesha Noor",payMethod:"Cash",createdAt:"2026-10-20 20:15",items:[{name:"Pepperoni Honey",qty:1,price:15},{name:"Truffle Fries",qty:1,price:6.5}],subtotal:21.5,discount:0,vat:1.08,service:0,total:22.58}]},V="bite_restaurant_erp_v1",G="bite_pos_v3",W="bite_current_user",ve=()=>{try{const e=typeof window<"u"?sessionStorage.getItem(W):null;return e?JSON.parse(e):null}catch{return null}},ie=["POS_ADD_ITEM","KOT_STATUS","STOCK_WASTE","SETTLE_INVOICE","EDIT_DISH","STOCK_BUY"],ye=()=>Array.from({length:18},(e,t)=>({id:`ACT-SEED-${String(t+1).padStart(2,"0")}`,actionType:ie[t%ie.length],payload:{seed:!0},timestamp:new Date(Date.now()-(18-t)*45e3).toISOString()}));class xe{constructor(){this.listeners=[],this.pushTimer=null,this.state=this.loadState(),window.addEventListener("online",()=>{this.state.isOfflineSim||this.syncNow(),this.notify()}),window.addEventListener("offline",()=>this.notify())}loadState(){const t=ve();try{const s=localStorage.getItem(V)||localStorage.getItem(G);if(s){const i=JSON.parse(s),o=Array.isArray(i.users)&&i.users.length>0?i.users:F.users,a=t?o.find(l=>l.id===t.id)||t:null;return{...F,...i,users:o,isOfflineSim:!!i.isOfflineSim,pendingQueue:Array.isArray(i.pendingQueue)?i.pendingQueue:[],currentUser:a}}}catch(s){console.warn("Local state load fallback:",s)}const r=structuredClone(F);r.isOfflineSim=!1,r.pendingQueue=ye(),r.currentUser=t;const n=JSON.stringify({...r,currentUser:null});return localStorage.setItem(V,n),localStorage.setItem(G,n),r}saveState(){const t=JSON.stringify({...this.state,currentUser:null});localStorage.setItem(V,t),localStorage.setItem(G,t),this.syncSessionUser(this.state.currentUser),this.notify()}persistUserUpdate(t="USER_UPDATED"){return this.pushTimer&&(clearTimeout(this.pushTimer),this.pushTimer=null),this.syncSessionUser(this.state.currentUser),this.isOffline()?Promise.resolve({ok:!1,offline:!0}):this.pushStateToServer(t)}syncSessionUser(t){try{t?sessionStorage.setItem(W,JSON.stringify(t)):sessionStorage.removeItem(W)}catch{}}isOffline(){return this.state.isOfflineSim||!navigator.onLine}setOfflineSim(t){this.state.isOfflineSim=!!t,this.saveState(),!this.state.isOfflineSim&&navigator.onLine&&this.syncNow()}mutate(t,r,n={}){r(this.state),this.isOffline()&&this.state.pendingQueue.push({id:"ACT-"+Date.now()+"-"+Math.random().toString(36).slice(2,6),actionType:t,payload:n,timestamp:new Date().toISOString()}),this.saveState(),this.schedulePush()}deductRecipeForItems(t){t.forEach(r=>{const n=this.state.menu.find(s=>s.id===r.dishId||s.name===r.name);n&&Array.isArray(n.recipe)&&n.recipe.forEach(s=>{const i=this.state.inventory.find(o=>o.id===(s.ingredientId??s.ingId));i&&(i.qty=Math.max(0,Number((i.qty-s.qty*r.qty).toFixed(2))))})})}async syncNow(){if(this.isOffline())return this.notify(),{synced:0,offline:!0};const t=[...this.state.pendingQueue];return(await this.pushStateToServer()).ok?(this.state.pendingQueue=[],this.saveState(),{synced:t.length}):(t.length||this.notify(),{synced:0,offline:!0})}serverState(){const{users:t,categories:r,kitchenStations:n,inventory:s,menu:i,tables:o,invoices:a}=this.state;return{users:t,categories:r,kitchenStations:n,inventory:s,menu:i,tables:o,invoices:a}}async pushStateToServer(t="STATE_SYNC"){try{return{ok:(await fetch("/api/sync",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({state:this.serverState(),reason:t})})).ok}}catch{return{ok:!1,offline:!0}}}schedulePush(){this.isOffline()||(this.pushTimer&&clearTimeout(this.pushTimer),this.pushTimer=setTimeout(()=>{this.pushTimer=null,this.pushStateToServer()},900))}async hydrateFromServer(){var r;const t=Object.keys(this.serverState());try{const n=await fetch("/api/sync",{headers:{Accept:"application/json"}});if(!n.ok)return{hydrated:!1};const s=await n.json(),i=s&&s.state;if(!i||typeof i!="object")return{hydrated:!1};if(!t.some(l=>Array.isArray(i[l])&&i[l].length))return{hydrated:!1,seeded:(await this.pushStateToServer()).ok};t.forEach(l=>{Array.isArray(i[l])&&i[l].length&&(this.state[l]=i[l])});const a=(r=this.state.currentUser)==null?void 0:r.id;return this.state.currentUser=a&&(this.state.users.find(l=>l.id===a)||this.state.users[0])||null,this.saveState(),{hydrated:!0}}catch{return{hydrated:!1,offline:!0}}}subscribe(t){this.listeners.push(t)}notify(){this.listeners.forEach(t=>t(this.state))}}const m=new xe,M=e=>`৳${Math.round(Number(e||0))}`,Q=(e="")=>String(e).trim().split(/\s+/).filter(Boolean).slice(0,2).map(r=>r[0].toUpperCase()).join("")||"AN",h=(e="")=>String(e).replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t]);function pe(e){const t=document.getElementById("modal-root"),r=document.getElementById("thermal-receipt-area"),n=`
    <div class="font-mono text-[10px] leading-relaxed text-black">
      <div class="border-b border-dashed border-slate-400 pb-2 mb-2 text-center">
        <div class="text-[13px] font-extrabold tracking-wide">BITE RESTAURANT</div>
        <div>12 Artisan Ave • Tel: 01700-000000</div>
        <div>VAT Reg: #99410238</div>
      </div>
      <div class="flex justify-between"><span>Inv: ${e.id}</span><span>Table: ${e.tableId}</span></div>
      <div class="mb-2 flex justify-between border-b border-dashed border-slate-400 pb-2">
        <span>Cashier: ${h(e.cashier)}</span><span>${e.createdAt}</span>
      </div>
      <div class="mb-2 space-y-1 border-b border-dashed border-slate-400 pb-2">
        ${e.items.map(s=>`<div class="flex justify-between gap-2"><span>${s.qty}x ${h(s.name)}</span><span>${M(s.qty*s.price)}</span></div>`).join("")}
      </div>
      <div class="space-y-0.5 text-right">
        <div>Subtotal: ${M(e.subtotal)}</div>
        <div>Discount: -${M(e.discount)}</div>
        <div>VAT (5%): ${M(e.vat)}</div>
        <div>Service (5%): ${M(e.service)}</div>
        <div class="border-t border-slate-400 pt-1 text-[11px] font-bold">TOTAL: ${M(e.total)} (${e.payMethod})</div>
      </div>
      <div class="mt-3 border-t border-dashed border-slate-400 pt-2 text-center text-[9px]">Thank you for dining with Bite!</div>
    </div>
  `;r.innerHTML=n,t.innerHTML=`
    <div class="modal-shell">
      <div class="modal-panel space-y-3" style="max-width: 360px;">
        <div class="flex items-center justify-between">
          <h3 class="serif text-[18px] font-bold text-[#1c1a17]">Receipt</h3>
          <span class="badge-pill badge-neutral">80mm thermal</span>
        </div>
        <div class="rounded-xl border border-[#e8e0d1] bg-white p-3">${n}</div>
        <div class="flex gap-2">
          <button type="button" id="print-receipt-btn" class="btn-primary flex-1">Print 80mm</button>
          <button type="button" id="close-receipt-btn" class="btn-cream">Close</button>
        </div>
      </div>
    </div>
  `,document.getElementById("print-receipt-btn").onclick=()=>window.print(),document.getElementById("close-receipt-btn").onclick=()=>{t.innerHTML=""}}function ke(e,t,r){const{tables:n,menu:s,categories:i,currentUser:o}=m.state,a=n.find(p=>p.id===t.selectedTableId)||n[0],l=t.posCategory||"All",f=Number(t.discount||0),b=s.filter(p=>p.available&&(l==="All"||p.category===l)),v=a.items.reduce((p,w)=>p+w.price*w.qty,0),u=Math.max(0,v-f),S=Number((u*.05).toFixed(2)),E=a.id==="Takeaway"?0:Number((u*.05).toFixed(2)),g=Number((u+S+E).toFixed(2)),c=n.filter(p=>p.status==="Occupied").length,x=n.length-c,d=n.reduce((p,w)=>p+w.items.reduce((A,C)=>A+C.qty,0),0),y=n.reduce((p,w)=>p+w.items.reduce((A,C)=>A+C.price*C.qty,0),0),k=n.map(p=>{const w=p.id===a.id,A=p.items.reduce((q,O)=>q+O.price*O.qty,0),C=p.items.length?p.items.map(q=>`
          <div class="flex justify-between gap-2 text-[9px] text-[#6b665a]">
            <span class="truncate">${q.qty}× ${h(q.name)}</span>
            <span class="serif shrink-0 text-[10px] font-semibold text-[#4c473d]">${M(q.qty*q.price)}</span>
          </div>
        `).join(""):'<div class="text-[9px] italic text-[#b0a997]">No active items</div>';return`
      <div data-table-id="${p.id}" class="table-card warm-card cursor-pointer p-3.5 ${w?"is-active":""}">
        <div class="flex items-start justify-between gap-2">
          <span class="serif text-[15px] font-bold text-[#1c1a17]">${p.name}</span>
          <span class="badge-pill ${p.status==="Occupied"?"badge-low":"badge-ok"}">${p.status} · ${p.kotStatus}</span>
        </div>
        <div class="mt-1 flex items-end justify-between gap-2">
          <span class="text-[9px] text-[#8a8578]">Waiter: ${h(p.waiter)}</span>
          <span class="serif text-[13px] font-bold text-[#1c1a17]">${M(A)}</span>
        </div>
        <div class="scroll-thin mt-2 max-h-[66px] space-y-0.5 overflow-y-auto border-t border-[#ece4d6] pt-1.5">${C}</div>
      </div>
    `}).join(""),$=["All",...i].map(p=>{const w=l===p;return`
      <button type="button" data-cat="${h(p)}" class="pos-cat-btn whitespace-nowrap rounded-full border px-2.5 py-1 text-[9.5px] font-medium transition ${w?"border-[#1c1a17] bg-[#1c1a17] text-[#f6f1e7]":"border-[#e0d6c2] bg-[#fbf7f0] text-[#6b665a] hover:bg-[#f3ead9]"}">${p==="All"?"All dishes":h(p)}</button>
    `}).join(""),I=b.map(p=>`
    <button type="button" data-add-dish="${p.id}" class="pos-dish">
      <div class="flex w-full items-start justify-between gap-2">
        <span class="text-[10.5px] font-semibold leading-tight text-[#1c1a17]">${h(p.name)}</span>
        <span class="badge-pill badge-neutral shrink-0">${h(p.station)}</span>
      </div>
      <div class="mt-2 flex w-full items-end justify-between">
        <span class="text-[8px] uppercase tracking-[0.12em] text-[#a39c8d]">${h(p.category)}</span>
        <span class="serif text-[12.5px] font-bold text-[#1c1a17]">${M(p.price)}</span>
      </div>
    </button>
  `).join(""),T=a.items.length?a.items.map(p=>`
        <div class="flex items-center justify-between gap-2 rounded-xl border border-[#ece4d6] bg-[#fffdf9] px-2.5 py-2">
          <div class="min-w-0">
            <p class="truncate text-[10px] font-semibold text-[#1c1a17]">${h(p.name)}</p>
            <p class="serif text-[9.5px] text-[#a39c8d]">${M(p.price)} each</p>
          </div>
          <div class="flex shrink-0 items-center gap-1.5">
            <button type="button" data-qty-dish="${p.dishId}" data-delta="-1" class="mini-btn px-2">−</button>
            <span class="w-4 text-center text-[10px] font-semibold text-[#1c1a17]">${p.qty}</span>
            <button type="button" data-qty-dish="${p.dishId}" data-delta="1" class="mini-btn px-2">+</button>
          </div>
        </div>
      `).join(""):'<p class="rounded-xl border border-dashed border-[#ddd3bf] px-3 py-8 text-center text-[10px] text-[#a39c8d]">Tap a dish to start this order</p>',L=`
    <div class="flex items-start justify-between gap-4">
      <div>
        <h2 class="serif text-[30px] font-bold leading-[1.08] text-[#1c1a17]">Tables &amp; POS</h2>
        <p class="mt-1.5 text-[11.5px] text-[#8a8578]">Select a table to take orders, fire the kitchen ticket or settle an 80 mm bill.</p>
      </div>
      <div class="flex shrink-0 items-center gap-2 pt-1">
        <span class="badge-pill badge-ok">● ${x} available</span>
        <span class="badge-pill badge-low">● ${c} occupied</span>
      </div>
    </div>
  `,be=`
    <div class="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div class="kpi kpi--peach">
        <span class="kpi-blob"></span>
        <span class="kpi-watermark">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M6 7h12l1.5 14h-15L6 7Z"/><path d="M9 7a3 3 0 0 1 6 0"/></svg>
        </span>
        <p class="kpi-label">Occupied tables</p>
        <p class="kpi-value serif">${c}</p>
        <p class="kpi-note">In service right now</p>
      </div>
      <div class="kpi kpi--mint">
        <span class="kpi-blob"></span>
        <span class="kpi-watermark">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3v5.5a2.5 2.5 0 0 0 5 0V3"/><path d="M7.5 11v10"/><path d="M18 3c-1.5 1.6-2.3 3.8-2.3 6 0 1.9 1 2.9 2.3 2.9h1V3h-1Z"/><path d="M19 12v9"/></svg>
        </span>
        <p class="kpi-label">Open items</p>
        <p class="kpi-value serif">${d}</p>
        <p class="kpi-note">Across the floor</p>
      </div>
      <div class="kpi kpi--pink">
        <span class="kpi-blob"></span>
        <span class="kpi-watermark">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 2h14v20l-2.3-1.6-2.4 1.6-2.3-1.6L9.7 22 7.3 20.4 5 22V2Z"/><path d="M9 7h6M9 11h6M9 15h4"/></svg>
        </span>
        <p class="kpi-label">Running total</p>
        <p class="kpi-value serif small">${M(y)}</p>
        <p class="kpi-note">Unsettled tabs</p>
      </div>
    </div>
  `,he=`
    <div class="mt-5 flex items-center justify-between gap-3">
      <p class="section-label">Floor plan</p>
      <p class="text-[8.5px] uppercase tracking-[0.14em] text-[#a39c8d]">${a.name} selected</p>
    </div>
    <div class="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">${k}</div>
  `;e.innerHTML=`
    <div class="pb-6">
      ${L}
      ${be}
      ${he}

      <div class="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div class="col-span-1 flex flex-col p-4 warm-card lg:col-span-7">
          <div class="flex items-center justify-between gap-2">
            <div>
              <p class="section-label">Order builder</p>
              <h3 class="serif mt-0.5 text-[16px] font-bold text-[#1c1a17]">Add to ${a.name}</h3>
            </div>
            <span class="badge-pill badge-neutral">${b.length} dishes</span>
          </div>
          <div class="mt-3 flex flex-wrap gap-1.5">${$}</div>
          <div class="scroll-thin mt-3 grid max-h-[330px] grid-cols-2 gap-2.5 overflow-y-auto pr-1">${I}</div>
        </div>

        <div class="col-span-1 flex flex-col justify-between p-4 warm-card lg:col-span-5">
          <div>
            <div class="flex items-start justify-between gap-2 border-b border-[#ece4d6] pb-3">
              <div>
                <p class="section-label">Active order</p>
                <h3 class="serif mt-0.5 text-[16px] font-bold text-[#1c1a17]">${a.name}</h3>
                <p class="mt-0.5 text-[9px] text-[#8a8578]">KOT · <span class="font-semibold text-[#c2410c]">${a.kotStatus}</span> · ${h(o.name)}</p>
              </div>
              <select id="kot-status-select" class="rounded-lg border border-[#e0d6c2] bg-[#fffdf9] px-2 py-1 text-[9.5px] text-[#4c473d] outline-none focus:border-[#f59e0b]">
                ${["Pending","Cooking","Ready","Served"].map(p=>`<option value="${p}" ${a.kotStatus===p?"selected":""}>${p}</option>`).join("")}
              </select>
            </div>

            <div class="scroll-thin mt-3 max-h-[200px] space-y-2 overflow-y-auto pr-1">${T}</div>
          </div>

          <div class="mt-3 space-y-1.5 border-t border-[#ece4d6] pt-3 text-[10px] text-[#6b665a]">
            <div class="flex justify-between">
              <span>Subtotal</span>
              <span class="serif text-[11px] font-semibold text-[#1c1a17]">${M(v)}</span>
            </div>
            <div class="flex items-center justify-between">
              <span>Discount</span>
              <input id="pos-discount-input" type="number" min="0" step="0.01" value="${f}" class="w-16 rounded-md border border-[#e4dbc9] bg-[#fffdf9] px-1.5 py-0.5 text-right text-[10px] outline-none focus:border-[#f59e0b]" />
            </div>
            <div class="flex justify-between">
              <span>VAT (5%) + Service (${a.id==="Takeaway"?"0%":"5%"})</span>
              <span>${M(S+E)}</span>
            </div>
            <div class="flex items-end justify-between border-t border-[#ece4d6] pt-2">
              <span class="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#8a8578]">Grand total</span>
              <span class="serif text-[20px] font-bold text-[#1c1a17]">${M(g)}</span>
            </div>
            <div class="grid grid-cols-2 gap-2 pt-1">
              <button type="button" id="fire-kot-btn" class="btn-dark">Fire KOT</button>
              <button type="button" id="settle-bill-btn" class="btn-primary">Settle &amp; print</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,e.querySelectorAll(".table-card").forEach(p=>{p.onclick=()=>{t.selectedTableId=p.dataset.tableId,r()}}),e.querySelectorAll(".pos-cat-btn").forEach(p=>{p.onclick=()=>{t.posCategory=p.dataset.cat,r()}}),e.querySelectorAll("[data-add-dish]").forEach(p=>{p.onclick=()=>{const w=s.find(A=>A.id===p.dataset.addDish);w&&m.mutate("POS_ADD_ITEM",A=>{const C=A.tables.find(O=>O.id===a.id),q=C.items.find(O=>O.dishId===w.id);q?q.qty+=1:C.items.push({dishId:w.id,name:w.name,price:w.price,qty:1,station:w.station}),C.status="Occupied"},{tableId:a.id,dishId:w.id})}}),e.querySelectorAll("[data-qty-dish]").forEach(p=>{p.onclick=()=>{const w=p.dataset.qtyDish,A=Number(p.dataset.delta);m.mutate("POS_QTY_CHANGE",C=>{const q=C.tables.find(R=>R.id===a.id),O=q.items.find(R=>R.dishId===w);O&&(O.qty+=A,O.qty<=0&&(q.items=q.items.filter(R=>R.dishId!==w))),q.items.length||(q.status="Available",q.kotStatus="Pending")},{tableId:a.id,dishId:w,delta:A})}}),document.getElementById("kot-status-select").onchange=p=>{m.mutate("KOT_STATUS",w=>{const A=w.tables.find(C=>C.id===a.id);A.kotStatus=p.target.value},{tableId:a.id,status:p.target.value})},document.getElementById("pos-discount-input").onchange=p=>{t.discount=Math.max(0,Number(p.target.value||0)),r()},document.getElementById("fire-kot-btn").onclick=()=>{a.items.length&&m.mutate("FIRE_KOT",p=>{const w=p.tables.find(A=>A.id===a.id);w.kotStatus="Cooking",w.kotDeducted=!0,m.deductRecipeForItems(w.items)},{tableId:a.id})},document.getElementById("settle-bill-btn").onclick=()=>{if(!a.items.length)return;let p=null;m.mutate("SETTLE_INVOICE",w=>{const A=w.tables.find(C=>C.id===a.id);A.kotDeducted||m.deductRecipeForItems(A.items),p={id:"INV-"+(1001+w.invoices.length),tableId:A.id,cashier:o.name,payMethod:"Cash",createdAt:new Date().toISOString().slice(0,16).replace("T"," "),items:structuredClone(A.items),subtotal:v,discount:f,vat:S,service:E,total:g},w.invoices.unshift(p),A.items=[],A.status="Available",A.kotStatus="Pending",A.kotDeducted=!1},{tableId:a.id,grandTotal:g}),t.discount=0,p&&pe(p)}}const ue={Burgers:"🍔",Sandwiches:"🥪",Pizza:"🍕",Sides:"🍟",Beverages:"🥤",Desserts:"🍰"},K={utensils:'<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3v5.5a2.5 2.5 0 0 0 5 0V3"/><path d="M7.5 11v10"/><path d="M18 3c-1.5 1.6-2.3 3.8-2.3 6 0 1.9 1 2.9 2.3 2.9h1V3h-1Z"/><path d="M19 12v9"/></svg>',check:'<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m8.5 12.2 2.4 2.4 4.7-4.9"/></svg>',eyeOff:'<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M10.6 5.2A9.9 9.9 0 0 1 12 5c6 0 9 7 9 7a16 16 0 0 1-2.2 3"/><path d="M6.3 6.6A15.7 15.7 0 0 0 3 12s3 7 9 7a9.8 9.8 0 0 0 4.6-1.1"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/><path d="m3 3 18 18"/></svg>'};function z({label:e,value:t,note:r,tone:n="peach",icon:s="",action:i="",small:o=!1}){return`
    <div class="kpi kpi--${n}">
      <span class="kpi-blob"></span>
      <span class="kpi-watermark">${s}</span>
      <p class="kpi-label">${e}</p>
      <p class="kpi-value serif${o?" small":""}">${t}</p>
      <p class="kpi-note">${i||r}</p>
    </div>
  `}const te='<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M6 6l1 15h10l1-15"/><path d="M10 11v6M14 11v6"/></svg>',we=["pcs","g","kg","ml","l","serv","pack"];function ne(e=[],t){return(e||[]).map(n=>{const s=n.ingredientId??n.ingId,i=t.find(a=>a.id===s),o=n.unit||(i?i.unit:"pcs");return`<div class="recipe-row flex items-center gap-2 rounded-xl border border-[#e4dbc9] bg-[#fffdf9] p-2">
      <select name="recipe-ing" class="rounded-lg border border-[#e4dbc9] bg-[#fffdf9] px-2 py-1.5 text-[10px] outline-none focus:border-[#f59e0b] flex-1">
        ${t.map(a=>`<option value="${a.id}" ${s===a.id?"selected":""}>${h(a.name)}</option>`).join("")}
      </select>
      <input name="recipe-qty" type="number" step="0.01" min="0" value="${Number(n.qty||1)}" class="w-20 rounded-lg border border-[#e4dbc9] bg-[#fffdf9] px-2 py-1.5 text-[10px] outline-none focus:border-[#f59e0b]" />
      <select name="recipe-unit" class="w-[76px] shrink-0 rounded-lg border border-[#e4dbc9] bg-[#fffdf9] px-2 py-1.5 text-[10px] outline-none focus:border-[#f59e0b]">
        ${we.map(a=>`<option value="${a}" ${a===o?"selected":""}>${a}</option>`).join("")}
      </select>
      <button type="button" class="mini-btn red" data-remove-recipe-row>${te}</button>
    </div>`}).join("")||'<div class="text-[10px] text-[#8a8578]">No ingredients</div>'}function Se(e){const t=h(e.category),r=h(e.station),n=Number(e.ingredients||(e.recipe||[]).length),s=ue[e.category]||"🍽";return`
    <article class="dish-card">
      <div class="flex items-start justify-between gap-2">
        <div class="min-w-0">
          <p class="dish-cat">${t} · ${r}</p>
          <h3 class="dish-title serif">${h(e.name)}</h3>
        </div>
        <label class="stock-toggle" title="Toggle POS availability">
          <span class="stock-label${e.available?"":" off"}">${e.available?"In stock":"Sold out"}</span>
          <input type="checkbox" data-toggle-dish="${e.id}" ${e.available?"checked":""} aria-label="Toggle availability for ${h(e.name)}" />
          <span class="switch-track"></span>
        </label>
      </div>

      <p class="dish-desc">${h(e.desc||"")}</p>

      <div class="dish-tags">
        <span class="dish-tag">⚙ ${n} ingredients</span>
        <span class="dish-tag">🔥 ${r}</span>
        <span class="dish-tag">${s} ${t}</span>
      </div>

      <div class="dish-foot">
        <div>
          <p class="dish-price serif">${M(e.price)}</p>
          <p class="dish-note">${e.available?"Visible on the POS":"Hidden from the POS"}</p>
        </div>
        <div class="flex items-center gap-1.5">
          <button type="button" data-edit-dish="${e.id}" class="edit-btn">✎ Edit</button>
          <button type="button" data-del-dish="${e.id}" class="del-btn" aria-label="Delete ${h(e.name)}">${te}</button>
        </div>
      </div>
    </article>
  `}function se(e=null){var v;const t=document.getElementById("modal-root"),{categories:r,kitchenStations:n,inventory:s}=m.state,i=!!e,o=((v=m.state.currentUser)==null?void 0:v.role)==="Admin";t.innerHTML=`
    <div class="modal-shell">
      <form id="dish-form" class="modal-panel space-y-3">
        <div class="flex items-start justify-between gap-3">
          <div>
            <h3 class="modal-title serif">${i?"Edit dish":"Add a dish"}</h3>
            <p class="modal-sub">${i?"Update the listing, station and recipe link.":"Publish a new dish to the POS menu."}</p>
          </div>
          <button type="button" id="close-dish-x" class="mini-btn" aria-label="Close">✕</button>
        </div>

        <div class="grid grid-cols-3 gap-2">
          <div class="field">
            <label for="dish-code">Code</label>
            <input id="dish-code" name="code" required value="${h((e==null?void 0:e.code)||"BG-09")}" />
          </div>
          <div class="field col-span-2">
            <label for="dish-name">Dish name</label>
            <input id="dish-name" name="name" required value="${h((e==null?void 0:e.name)||"")}" placeholder="e.g. Smoked Brisket Bun" />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div class="field flex items-baseline gap-2">
            <label for="dish-category">Category</label>${o?'<button type="button" data-manage="categories" class="manage-btn" title="Manage food categories">⚙️ Manage</button>':""}
            <select id="dish-category" name="category">
              ${r.map(u=>`<option value="${h(u)}" ${(e==null?void 0:e.category)===u?"selected":""}>${h(u)}</option>`).join("")}
            </select>
          </div>
          <div class="field flex items-baseline gap-2">
            <label for="dish-station">Kitchen station</label>${o?'<button type="button" data-manage="stations" class="manage-btn" title="Manage kitchen stations">⚙️ Manage</button>':""}
            <select id="dish-station" name="station">
              ${n.map(u=>`<option value="${u}" ${(e==null?void 0:e.station)===u?"selected":""}>${u}</option>`).join("")}
            </select>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div class="field">
            <label for="dish-price">Selling price (৳)</label>
            <input id="dish-price" name="price" type="number" step="0.01" min="0" required value="${Number((e==null?void 0:e.price)??12.5)}" />
          </div>
          <div class="field">
            <label for="dish-cost">Unit cost (৳)</label>
            <input id="dish-cost" name="cost" type="number" step="0.01" min="0" required value="${Number((e==null?void 0:e.cost)??4)}" />
          </div>
        </div>

        <div class="field">
          <label for="dish-desc">Description</label>
          <textarea id="dish-desc" name="desc" placeholder="Short menu description shown on the dish card...">${h((e==null?void 0:e.desc)||"")}</textarea>
        </div>

        <div class="field flex items-baseline gap-2">
          <label>Recipe Ingredients & Quantities</label>${o?'<button type="button" data-manage="ingredients" class="manage-btn" title="Manage recipe ingredients">⚙️ Manage</button>':""}
        </div>
        <div id="recipe-rows" class="space-y-2">
          ${ne(e==null?void 0:e.recipe,s)}
        </div>
        <div class="field">
          <button type="button" id="add-recipe-row" class="btn-cream" style="width:fit-content;padding:7px 14px">+ Add ingredient</button>
        </div>

        <div class="flex justify-end gap-2 pt-1">
          <button type="button" id="close-dish-modal" class="btn-cream">Cancel</button>
          <button type="submit" class="btn-primary">Save dish</button>
        </div>
      </form>
    </div>
  `;const a=()=>{t.innerHTML=""};document.getElementById("close-dish-x").onclick=a,document.getElementById("close-dish-modal").onclick=a,document.getElementById("dish-form").onsubmit=u=>{u.preventDefault();const S=new FormData(u.target),E=[];document.querySelectorAll(".recipe-row").forEach(c=>{const x=c.querySelector('[name="recipe-ing"]').value,d=Number(c.querySelector('[name="recipe-qty"]').value||1),y=s.find($=>$.id===x),k=c.querySelector('[name="recipe-unit"]');x&&E.push({ingredientId:x,name:y?y.name:"",qty:d,unit:k&&k.value||(y?y.unit:"")})});const g={id:(e==null?void 0:e.id)||"m"+Date.now(),code:String(S.get("code")||"").trim(),name:String(S.get("name")||"").trim(),category:S.get("category"),station:S.get("station"),price:Number(S.get("price")),cost:Number(S.get("cost")),available:e?e.available:!0,desc:String(S.get("desc")||"").trim(),ingredients:E.length,recipe:E};m.mutate(i?"EDIT_DISH":"ADD_DISH",c=>{if(i){const x=c.menu.findIndex(d=>d.id===e.id);x>-1&&(c.menu[x]=g)}else c.menu.unshift(g)},g),t.innerHTML=""},t.querySelectorAll("[data-manage]").forEach(u=>{u.onclick=()=>{t.innerHTML="",D(u.dataset.manage)}});const l=()=>{const u=[];return document.querySelectorAll(".recipe-row").forEach(S=>{const E=S.querySelector('[name="recipe-ing"]').value,g=Number(S.querySelector('[name="recipe-qty"]').value||1),c=s.find(d=>d.id===E),x=S.querySelector('[name="recipe-unit"]').value;E&&u.push({ingredientId:E,name:c?c.name:"",qty:g,unit:x||(c?c.unit:"")})}),u},f=u=>{const S=u||l();document.getElementById("recipe-rows").innerHTML=ne(S,s),b()},b=()=>{document.querySelectorAll("[data-remove-recipe-row]").forEach(u=>{u.onclick=()=>{u.closest(".recipe-row").remove(),f()}}),document.querySelectorAll('[name="recipe-ing"]').forEach(u=>{u.onchange=()=>{const S=u.closest(".recipe-row"),E=s.find(c=>c.id===u.value),g=S.querySelector('[name="recipe-unit"]');E&&g&&Array.from(g.options).some(c=>c.value===E.unit)&&(g.value=E.unit)}})};b(),document.getElementById("add-recipe-row").onclick=()=>{f([...l(),{ingredientId:"",name:"",qty:1,unit:"pcs"}])}}function J(){const e=document.getElementById("modal-root"),{categories:t,menu:r}=m.state;e.innerHTML=`
    <div class="modal-shell">
      <div class="modal-panel space-y-3">
        <div class="flex items-start justify-between gap-3">
          <div>
            <h3 class="modal-title serif">Categories</h3>
            <p class="modal-sub">${t.length} categories · ${r.length} dishes</p>
          </div>
          <button type="button" id="close-cat-x" class="mini-btn" aria-label="Close">✕</button>
        </div>

        <div class="space-y-1.5">
          ${t.map(n=>{const s=r.filter(i=>i.category===n).length;return`
              <div class="flex items-center justify-between rounded-xl border border-[#ece4d6] bg-[#fffdf9] px-3 py-2">
                <div class="flex items-center gap-2">
                  <span class="text-[13px]">${ue[n]||"🍽"}</span>
                  <div>
                    <p class="text-[11px] font-semibold text-[#1c1a17]">${h(n)}</p>
                    <p class="text-[8.5px] text-[#a39c8d]">${s} ${s===1?"dish":"dishes"}</p>
                  </div>
                </div>
                <button type="button" data-del-cat="${h(n)}" class="mini-btn red">Remove</button>
              </div>
            `}).join("")}
        </div>

        <form id="add-cat-form" class="flex gap-2 border-t border-[#ece4d6] pt-3">
          <input name="catName" required placeholder="New category name..." class="min-w-0 flex-1 rounded-lg border border-[#e4dbc9] bg-[#fffdf9] px-2.5 py-2 text-[11px] outline-none focus:border-[#f59e0b]" />
          <button type="submit" class="btn-dark">Add</button>
        </form>
      </div>
    </div>
  `,document.getElementById("close-cat-x").onclick=()=>{e.innerHTML=""},e.querySelectorAll("[data-del-cat]").forEach(n=>{n.onclick=()=>{m.mutate("REMOVE_CATEGORY",s=>{s.categories=s.categories.filter(i=>i!==n.dataset.delCat)},{category:n.dataset.delCat}),J()}}),document.getElementById("add-cat-form").onsubmit=n=>{n.preventDefault();const s=String(new FormData(n.target).get("catName")||"").trim();s&&!m.state.categories.includes(s)&&(m.mutate("ADD_CATEGORY",i=>{i.categories.push(s)},{category:s}),J())}}function D(e="categories"){const t=document.getElementById("modal-root"),{categories:r,kitchenStations:n,inventory:s,menu:i}=m.state,o=[{key:"categories",label:"Food categories"},{key:"stations",label:"Kitchen stations"},{key:"ingredients",label:"Recipe ingredients"}],a=o.find(g=>g.key===e)||o[0],l=e==="categories"?r:e==="stations"?n:s,f=g=>e==="categories"?i.filter(c=>c.category===g).length:e==="stations"?i.filter(c=>c.station===g).length:i.filter(c=>Array.isArray(c.recipe)&&c.recipe.some(x=>(x.ingredientId??x.ingId)===g)).length,b=g=>e==="ingredients"?g.name:g,v=g=>e==="ingredients"?g.id:g;let u=null;t.innerHTML=`
    <div class="modal-shell">
      <form id="manage-form" class="modal-panel space-y-3" style="max-width:540px">
        <div class="flex items-start justify-between gap-3">
          <div>
            <h3 class="modal-title serif">Manage Options</h3>
            <p class="modal-sub">Updates dish dropdowns, filter pills and cards everywhere.</p>
          </div>
          <button type="button" id="close-mgr-x" class="mini-btn" aria-label="Close">✕</button>
        </div>

        <div class="seg" role="group" aria-label="Manage domain">
          ${o.map(g=>`<button type="button" data-mgr-tab="${g.key}" class="seg-btn${g.key===e?" is-active":""}">${g.label}</button>`).join("")}
        </div>

        <div class="space-y-1.5">
          ${l.length?l.map(g=>{const c=b(g),x=v(g),d=f(x);return`
                  <div class="flex items-center justify-between rounded-xl border border-[#ece4d6] bg-[#fffdf9] px-3 py-2 gap-2">
                    <p class="text-[11px] font-semibold text-[#1c1a17] truncate flex-1">${h(c)}${d?` <span class="text-[9px] text-[#a39c8d]">${d} dish${d===1?"":"s"}</span>`:""}</p>
                    <div class="flex items-center gap-1">
                      ${u&&u.kind===e&&u.id===x?`<input name="rename-value" value="${h(c)}" class="rounded-lg border border-[#e4dbc9] bg-[#fffdf9] px-2 py-1.5 text-[10px] outline-none focus:border-[#f59e0b] w-40" /><button type="button" data-mgr-save-rename="${e}" data-mgr-id="${h(String(x))}" class="mini-btn green">Save</button><button type="button" data-mgr-cancel-rename="${e}" data-mgr-id="${h(String(x))}" class="mini-btn">Cancel</button>`:`<button type="button" data-mgr-rename="${e}" data-mgr-id="${h(String(x))}" data-mgr-name="${h(c)}" class="mini-btn">Rename</button>`}
                      <button type="button" data-mgr-delete="${e}" data-mgr-id="${h(String(x))}" data-mgr-name="${h(c)}" class="mini-btn red">${te}</button>
                    </div>
                  </div>
                `}).join(""):'<p class="text-[10px] text-[#8a8578]">None yet</p>'}
        </div>

        <form id="mgr-add-${e}" class="flex gap-2 border-t border-[#ece4d6] pt-3">
          ${e==="ingredients"?'<input name="name" required placeholder="Ingredient name" class="min-w-0 flex-1 rounded-lg border border-[#e4dbc9] bg-[#fffdf9] px-2.5 py-2 text-[11px] outline-none focus:border-[#f59e0b]" /><select name="unit" class="rounded-lg border border-[#e4dbc9] bg-[#fffdf9] px-2.5 py-2 text-[11px] outline-none focus:border-[#f59e0b]"><option>pcs</option><option>slice</option><option>g</option><option>kg</option><option>L</option><option>ml</option><option>serv</option></select>':`<input name="value" required placeholder="New ${a.label.toLowerCase()}..." class="min-w-0 flex-1 rounded-lg border border-[#e4dbc9] bg-[#fffdf9] px-2.5 py-2 text-[11px] outline-none focus:border-[#f59e0b]" />`}
          <button type="submit" class="btn-dark">Add</button>
        </form>
      </form>
    </div>
  `;const S=()=>{t.innerHTML=""};document.getElementById("close-mgr-x").onclick=S,t.querySelectorAll("[data-mgr-tab]").forEach(g=>{g.onclick=()=>D(g.dataset.mgrTab)}),t.querySelectorAll("[data-mgr-delete]").forEach(g=>{g.onclick=()=>{const c=g.dataset.mgrDelete,x=g.dataset.mgrId,d=g.dataset.mgrName,y=m.state,k=f(x);if(c==="categories"){if(y.categories.length<=1){window.alert("Keep at least one food category.");return}const $=y.categories.find(I=>I!==d);if(k&&!window.confirm('Delete "'+d+'"? '+k+" dish"+(k===1?"":"s")+' will be moved to "'+$+'".'))return}else if(c==="stations"){if(y.kitchenStations.length<=1){window.alert("Keep at least one kitchen station.");return}const $=y.kitchenStations.find(I=>I!==d);if(k&&!window.confirm('Delete "'+d+'"? '+k+" dish"+(k===1?"":"s")+' will be moved to "'+$+'".'))return}else{if(y.inventory.length<=1){window.alert("Keep at least one ingredient.");return}if(k&&!window.confirm('Delete "'+d+'"? '+k+" dish"+(k===1?"":"s")+" use it; their recipe lines will be removed."))return}m.mutate(`MANAGE_DELETE_${c.toUpperCase()}`,$=>{if(c==="categories"){const I=$.categories.find(T=>T!==d);$.menu.forEach(T=>{T.category===d&&(T.category=I)}),$.categories=$.categories.filter(T=>T!==d)}else if(c==="stations"){const I=$.kitchenStations.find(T=>T!==d);$.menu.forEach(T=>{T.station===d&&(T.station=I)}),$.kitchenStations=$.kitchenStations.filter(T=>T!==d)}else $.inventory=$.inventory.filter(I=>I.id!==x),$.menu.forEach(I=>{if(!Array.isArray(I.recipe))return;const T=I.recipe.filter(L=>(L.ingredientId??L.ingId)!==x);T.length!==I.recipe.length&&(I.recipe=T,I.ingredients=Math.max(1,T.length))})},{key:c,id:x,name:d}),D(e)}}),t.querySelectorAll("[data-mgr-rename]").forEach(g=>{g.onclick=()=>{u={kind:e,id:g.dataset.mgrId,name:g.dataset.mgrName},D(e)}}),t.querySelectorAll("[data-mgr-save-rename]").forEach(g=>{g.onclick=()=>{const c=g.dataset.mgrSaveRename,x=g.dataset.mgrId,d=t.querySelector('input[name="rename-value"]');if(!d)return;const y=String(d.value||"").trim(),k=u&&u.id===x&&u.kind===e?u.name:"";if(!y||y===k){u=null,D(e);return}if(c!=="ingredients"&&m.state[c].includes(y)){window.alert("That name already exists.");return}m.mutate(`MANAGE_RENAME_${c.toUpperCase()}`,$=>{if(c==="categories"||c==="stations")$[c]=$[c].map(I=>I===k?y:I),$.menu.forEach(I=>{c==="categories"&&I.category===k&&(I.category=y),c==="stations"&&I.station===k&&(I.station=y)});else{const I=$.inventory.find(T=>T.id===x);I&&(I.name=y,$.menu.forEach(T=>{Array.isArray(T.recipe)&&T.recipe.forEach(L=>{(L.ingredientId??L.ingId)===x&&(L.name=y)})}))}},{key:c,id:x,name:k,value:y}),u=null,D(e)}}),t.querySelectorAll("[data-mgr-cancel-rename]").forEach(g=>{g.onclick=()=>{u=null,D(e)}});const E=document.getElementById(`mgr-add-${e}`);E.onsubmit=g=>{g.preventDefault();const c=new FormData(g.target),x=m.state;if(e==="ingredients"){const d=String(c.get("name")||"").trim(),y=String(c.get("unit")||"pcs");if(!d)return;if(x.inventory.some(k=>k.name.toLowerCase()===d.toLowerCase())){window.alert("That ingredient already exists.");return}m.mutate("MANAGE_ADD_INGREDIENTS",k=>{k.inventory.push({id:"ing-"+Date.now(),name:d,unit:y,qty:0,minAlert:0,unitCost:0,supplier:""})},{kind:e,name:d,unit:y})}else{const d=String(c.get("value")||"").trim();if(!d||x[e].includes(d))return;m.mutate(`MANAGE_ADD_${e.toUpperCase()}`,y=>{y[e].push(d)},{kind:e,value:d})}D(e)}}function oe(e,t,r){var x;const n=Array.isArray(m.state.menu)?m.state.menu:[],s=Array.isArray(m.state.categories)?m.state.categories:[],i=String(t.menuSearch||"").trim().toLowerCase(),o=t.menuCat||"All",a=t.menuAvail||"All",l=n.filter(d=>{const y=`${d.name} ${d.code} ${d.category} ${d.station}`.toLowerCase(),k=!i||y.includes(i),$=o==="All"||d.category===o,I=a==="All"||(a==="InStock"?d.available:!d.available);return k&&$&&I}),f=n.filter(d=>d.available).length,b=n.length-f,v=["Admin","Manager","Chef"].includes((x=m.state.currentUser)==null?void 0:x.role),u=[{key:"All",label:"All"},{key:"InStock",label:"Available"},{key:"SoldOut",label:"Sold out"}];e.innerHTML=`
    <div class="pb-6">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h2 class="serif text-[30px] font-bold leading-[1.08] text-[#1c1a17]">Food menu</h2>
          <p class="mt-1.5 text-[11.5px] text-[#8a8578]">Read-only access. Chefs, managers and admins can edit the menu.</p>
        </div>
        ${v?'<button type="button" id="open-add-dish" class="btn-primary mt-1">+ Add dish</button>':""}
      </div>

      <div class="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
        ${z({label:"Dishes",value:n.length,tone:"peach",icon:K.utensils,action:`<button type="button" id="open-cat-mgr">${s.length} categories</button>`})}
        ${z({label:"Available",value:f,note:"Orderable right now",tone:"mint",icon:K.check})}
        ${z({label:"Sold out",value:b,note:"Hidden from the POS",tone:"pink",icon:K.eyeOff})}
      </div>

      <div class="mt-4 flex flex-wrap items-center gap-2.5">
        <label class="filter-search" for="menu-search">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.6-3.6" /></svg>
          <input id="menu-search" type="text" autocomplete="off" value="${h(t.menuSearch||"")}" placeholder="Search dishes, stations, categories..." />
        </label>

        <div class="filter-select">
          <select id="menu-cat-filter" aria-label="Filter by category">
            <option value="All" ${o==="All"?"selected":""}>All categories</option>
            ${s.map(d=>`<option value="${h(d)}" ${o===d?"selected":""}>${h(d)}</option>`).join("")}
          </select>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6" /></svg>
        </div>

        <div class="seg" role="group" aria-label="Availability">
          ${u.map(d=>`<button type="button" data-avail="${d.key}" class="seg-btn${a===d.key?" is-active":""}">${d.label}</button>`).join("")}
        </div>

        <span class="count-badge">${l.length} DISHES</span>
      </div>

      <div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        ${l.map(Se).join("")}
        ${l.length===0?`
          <div class="col-span-1 rounded-2xl border border-dashed border-[#ddd3bf] bg-[#faf6ee] px-6 py-14 text-center sm:col-span-2 lg:col-span-3">
            <p class="serif text-lg font-bold text-[#1c1a17]">No dishes match this view</p>
            <p class="mt-1 text-[10.5px] text-[#8a8578]">Try another search, category or availability filter.</p>
          </div>
        `:""}
      </div>
    </div>
  `;const S=document.getElementById("open-cat-mgr");S&&(S.onclick=J);const E=document.getElementById("header-manage-options");E&&(E.onclick=()=>D("categories"));const g=document.getElementById("open-add-dish");g&&(g.onclick=()=>se());const c=document.getElementById("menu-search");c.oninput=d=>{t.menuSearch=d.target.value,r();const y=document.getElementById("menu-search");if(y){y.focus();const k=y.value.length;y.setSelectionRange(k,k)}},document.getElementById("menu-cat-filter").onchange=d=>{t.menuCat=d.target.value,r()},e.querySelectorAll("[data-avail]").forEach(d=>{d.onclick=()=>{t.menuAvail=d.dataset.avail,r()}}),e.querySelectorAll("[data-toggle-dish]").forEach(d=>{d.onchange=()=>{m.mutate("TOGGLE_DISH_STOCK",y=>{const k=y.menu.find($=>$.id===d.dataset.toggleDish);k&&(k.available=d.checked)},{dishId:d.dataset.toggleDish,available:d.checked})}}),e.querySelectorAll("[data-edit-dish]").forEach(d=>{d.onclick=()=>{const y=n.find(k=>k.id===d.dataset.editDish);y&&se(y)}}),e.querySelectorAll("[data-del-dish]").forEach(d=>{d.onclick=()=>{const y=n.find(k=>k.id===d.dataset.delDish);y&&window.confirm(`Delete "${y.name}" from the menu?`)&&m.mutate("DELETE_DISH",k=>{k.menu=k.menu.filter($=>$.id!==y.id)},{dishId:y.id})}})}const $e=["Pending","Cooking","Ready","Served"],Ie={Pending:"badge-neutral",Cooking:"badge-low",Ready:"badge-ok",Served:"badge-neutral"},U={clock:'<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',flame:'<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c4 0 7-2.7 7-6.5 0-3.5-2.4-5.4-4-7.5-.8-1-1.4-2-1.5-3.5-2 .8-3.2 2.5-3.2 4.2 0 1 .3 1.8.8 2.6-1.2-.4-2.1-1.3-2.7-2.4C6.7 10 6 12.4 6 14.5 6 18.3 8.6 22 12 22Z"/></svg>',bell:'<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 8-3 8h18s-3-1-3-8"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>',check:'<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m8.5 12.2 2.4 2.4 4.7-4.9"/></svg>'};function H({label:e,value:t,note:r,tone:n,icon:s}){return`
    <div class="kpi kpi--${n}">
      <span class="kpi-blob"></span>
      <span class="kpi-watermark">${s}</span>
      <p class="kpi-label">${e}</p>
      <p class="kpi-value serif">${t}</p>
      <p class="kpi-note">${r}</p>
    </div>
  `}function Ae(e){const t=e.items.reduce((o,a)=>o+a.price*a.qty,0),r=e.items.reduce((o,a)=>o+a.qty,0),n=e.id==="Takeaway"?"Takeaway order":"Dine in",s=e.kotStatus==="Served",i=e.items.map(o=>`
    <div class="flex items-start justify-between gap-2">
      <div class="flex min-w-0 items-start gap-2">
        <span class="serif shrink-0 text-[11px] font-bold text-[#1c1a17]">${o.qty}×</span>
        <div class="min-w-0">
          <p class="truncate text-[10px] font-semibold text-[#1c1a17]">${h(o.name)}</p>
          <p class="text-[8px] uppercase tracking-[0.12em] text-[#a39c8d]">${h(o.station)}</p>
        </div>
      </div>
      <span class="serif shrink-0 text-[10px] font-semibold text-[#4c473d]">${M(o.qty*o.price)}</span>
    </div>
  `).join("");return`
    <article class="warm-card flex flex-col p-4${s?" opacity-80":""}">
      <div class="flex items-start justify-between gap-2">
        <div class="min-w-0">
          <p class="section-label">${e.id==="Takeaway"?"TAKEAWAY KOT":"KOT · DINE IN"}</p>
          <h3 class="serif mt-0.5 text-[20px] font-bold leading-tight text-[#1c1a17]">${e.name}</h3>
          <p class="mt-0.5 truncate text-[9px] text-[#8a8578]">${h(e.waiter)} · ${e.guests||1} ${Number(e.guests)===1?"guest":"guests"} · ${r} ${r===1?"item":"items"}</p>
        </div>
        <span class="badge-pill ${Ie[e.kotStatus]||"badge-neutral"} shrink-0">${e.kotStatus}</span>
      </div>

      <div class="mt-3 flex-1 space-y-1.5 rounded-xl border border-[#ece4d6] bg-[#fffdf9] p-2.5">
        ${i}
      </div>

      <div class="mt-3 flex items-center justify-between border-t border-[#ece4d6] pt-2.5">
        <span class="text-[8.5px] uppercase tracking-[0.12em] text-[#a39c8d]">${n}</span>
        <span class="serif text-[13px] font-bold text-[#1c1a17]">${M(t)}</span>
      </div>

      <div class="mt-3">
        <p class="section-label mb-1.5">Bump ticket</p>
        <div class="grid grid-cols-4 gap-1">
          ${$e.map(o=>`
            <button type="button" data-ticket-status="${o}" data-table-id="${e.id}" class="ticket-status${e.kotStatus===o?" is-active":""}">${o}</button>
          `).join("")}
        </div>
      </div>
    </article>
  `}function Te(e){const{tables:t}=m.state,r=t.filter(i=>i.items.length>0),n=i=>r.filter(o=>o.kotStatus===i).length,s=r.filter(i=>i.kotStatus!=="Served").length;e.innerHTML=`
    <div class="pb-6">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h2 class="serif text-[30px] font-bold leading-[1.08] text-[#1c1a17]">Kitchen KOT</h2>
          <p class="mt-1.5 text-[11.5px] text-[#8a8578]">Live chef tickets from the floor · bump each ticket as plates leave the pass.</p>
        </div>
        <span class="badge-pill badge-neutral mt-1 shrink-0 border border-[#e6dec8] bg-[#faf6ee] px-2.5 py-1">
          <span class="h-1.5 w-1.5 rounded-full bg-[#ea580c]"></span> ${s} active on the pass
        </span>
      </div>

      <div class="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        ${H({label:"Pending",value:n("Pending"),note:"Waiting to fire",tone:"peach",icon:U.clock})}
        ${H({label:"Cooking",value:n("Cooking"),note:"On the line now",tone:"mint",icon:U.flame})}
        ${H({label:"Ready",value:n("Ready"),note:"Waiting to be run",tone:"pink",icon:U.bell})}
        ${H({label:"Served",value:n("Served"),note:"Delivered to tables",tone:"blue",icon:U.check})}
      </div>

      <div class="mt-5 flex items-center justify-between gap-3">
        <p class="section-label">Live tickets</p>
        <p class="text-[8.5px] uppercase tracking-[0.14em] text-[#a39c8d]">${r.length} on the rail</p>
      </div>

      <div class="mt-2 grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        ${r.length?r.map(Ae).join(""):`
          <div class="col-span-1 rounded-2xl border border-dashed border-[#ddd3bf] bg-[#faf6ee] px-6 py-14 text-center lg:col-span-2 xl:col-span-3">
            <p class="serif text-lg font-bold text-[#1c1a17]">The pass is clear</p>
            <p class="mt-1 text-[10.5px] text-[#8a8578]">New orders fired from Tables &amp; POS will appear here instantly.</p>
          </div>
        `}
      </div>
    </div>
  `,e.querySelectorAll("[data-ticket-status]").forEach(i=>{i.onclick=()=>{const o=i.dataset.tableId,a=i.dataset.ticketStatus;m.mutate("KOT_STATUS",l=>{const f=l.tables.find(b=>b.id===o);f&&(f.kotStatus=a,a==="Cooking"&&!f.kotDeducted&&(m.deductRecipeForItems(f.items),f.kotDeducted=!0))},{tableId:o,status:a})}})}const N={box:'<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>',alert:'<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 2.8 20h18.4L12 3Z"/><path d="M12 9v4"/><circle cx="12" cy="16.6" r=".8"/></svg>',coins:'<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6"/><path d="M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/></svg>',receipt:'<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 2h14v20l-2.3-1.6-2.4 1.6-2.3-1.6L9.7 22 7.3 20.4 5 22V2Z"/><path d="M9 7h6M9 11h6M9 15h4"/></svg>',trend:'<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="m3 17 6-6 4 4 8-8"/><path d="M15 7h6v6"/></svg>',users:'<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',shield:'<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3Z"/><path d="m9 12 2 2 4-4"/></svg>',key:'<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="15" r="4"/><path d="m11 12 9-9 2 2-3 3 2 2-3 3-2-2-3 3"/></svg>'};function j({label:e,value:t,note:r,tone:n="peach",icon:s="",small:i=!1}){return`
    <div class="kpi kpi--${n}">
      <span class="kpi-blob"></span>
      <span class="kpi-watermark">${s}</span>
      <p class="kpi-label">${e}</p>
      <p class="kpi-value serif${i?" small":""}">${t}</p>
      <p class="kpi-note">${r}</p>
    </div>
  `}function re(e=null){const t=document.getElementById("modal-root"),r=!!e;t.innerHTML=`
    <div class="modal-shell">
      <form id="inv-form" class="modal-panel space-y-3">
        <div class="flex items-start justify-between gap-3">
          <div>
            <h3 class="modal-title serif">${r?"Edit ingredient":"New ingredient"}</h3>
            <p class="modal-sub">${r?"Adjust stock levels, cost and supplier.":"Register a raw material for recipe tracking."}</p>
          </div>
          <button type="button" id="close-inv-x" class="mini-btn" aria-label="Close">✕</button>
        </div>

        <div class="field">
          <label for="inv-name">Ingredient name</label>
          <input id="inv-name" name="name" required value="${h((e==null?void 0:e.name)||"")}" placeholder="e.g. Smoked Cheddar" />
        </div>

        <div class="grid grid-cols-3 gap-2">
          <div class="field">
            <label for="inv-qty">Stock qty</label>
            <input id="inv-qty" name="qty" type="number" step="0.1" min="0" required value="${(e==null?void 0:e.qty)??25}" />
          </div>
          <div class="field">
            <label for="inv-unit">Unit</label>
            <input id="inv-unit" name="unit" required value="${h((e==null?void 0:e.unit)||"pcs")}" />
          </div>
          <div class="field">
            <label for="inv-min">Min alert</label>
            <input id="inv-min" name="minAlert" type="number" min="0" required value="${(e==null?void 0:e.minAlert)??10}" />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div class="field">
            <label for="inv-cost">Unit cost (৳)</label>
            <input id="inv-cost" name="unitCost" type="number" step="0.01" min="0" required value="${(e==null?void 0:e.unitCost)??1.5}" />
          </div>
          <div class="field">
            <label for="inv-supplier">Supplier</label>
            <input id="inv-supplier" name="supplier" required value="${h((e==null?void 0:e.supplier)||"Local Vendor")}" />
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-1">
          <button type="button" id="close-inv-modal" class="btn-cream">Cancel</button>
          <button type="submit" class="btn-primary">Save stock</button>
        </div>
      </form>
    </div>
  `;const n=()=>{t.innerHTML=""};document.getElementById("close-inv-x").onclick=n,document.getElementById("close-inv-modal").onclick=n,document.getElementById("inv-form").onsubmit=s=>{s.preventDefault();const i=new FormData(s.target),o={id:(e==null?void 0:e.id)||"ing"+Date.now(),name:String(i.get("name")||"").trim(),qty:Number(i.get("qty")),unit:String(i.get("unit")||"").trim(),minAlert:Number(i.get("minAlert")),unitCost:Number(i.get("unitCost")),supplier:String(i.get("supplier")||"").trim()};m.mutate(r?"EDIT_INVENTORY":"ADD_INVENTORY",a=>{if(r){const l=a.inventory.findIndex(f=>f.id===e.id);l>-1&&(a.inventory[l]=o)}else a.inventory.push(o)},o),t.innerHTML=""}}function Ee(e){const{inventory:t}=m.state,r=t.filter(i=>i.qty<=i.minAlert),n=t.reduce((i,o)=>i+o.qty*o.unitCost,0),s=t.map(i=>{const o=i.qty<=i.minAlert;return`
      <tr>
        <td class="font-semibold text-[#1c1a17]">${h(i.name)}</td>
        <td class="text-[#8a8578]">${h(i.supplier)}</td>
        <td class="serif text-[11.5px] font-semibold text-[#1c1a17]">${i.qty} <span class="text-[8px] uppercase tracking-[0.1em] text-[#a39c8d]">${h(i.unit)}</span></td>
        <td class="serif">${M(i.unitCost,i.unitCost<.1?3:2)}</td>
        <td><span class="badge-pill ${o?"badge-low":"badge-ok"}">${o?"Low stock":"Optimal"}</span></td>
        <td class="space-x-1 text-right">
          <button type="button" data-stock-adj="${i.id}" data-delta="5" class="mini-btn green">+5 Buy</button>
          <button type="button" data-stock-adj="${i.id}" data-delta="-1" class="mini-btn red">−1 Waste</button>
          <button type="button" data-edit-ing="${i.id}" class="mini-btn">Edit</button>
        </td>
      </tr>
    `}).join("");e.innerHTML=`
    <div class="pb-6">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h2 class="serif text-[30px] font-bold leading-[1.08] text-[#1c1a17]">Inventory</h2>
          <p class="mt-1.5 text-[11.5px] text-[#8a8578]">Raw ingredients auto-deduct on KOT &amp; billing · purchase and waste logging included.</p>
        </div>
        <button type="button" id="add-ing-btn" class="btn-primary mt-1">+ New ingredient</button>
      </div>

      <div class="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
        ${j({label:"Total SKUs",value:t.length,note:"Tracked raw materials",tone:"peach",icon:N.box})}
        ${j({label:"Low stock alerts",value:r.length,note:"At or below minimum",tone:"pink",icon:N.alert})}
        ${j({label:"Stock value",value:M(n),note:"At current unit cost",tone:"mint",icon:N.coins,small:!0})}
      </div>

      <div class="mt-4 warm-card overflow-x-auto">
        <table class="warm-table min-w-[640px]">
          <thead>
            <tr>
              <th>Ingredient</th>
              <th>Supplier</th>
              <th>On hand</th>
              <th>Unit cost</th>
              <th>Status</th>
              <th class="text-right">Quick actions</th>
            </tr>
          </thead>
          <tbody>${s}</tbody>
        </table>
      </div>
    </div>
  `,document.getElementById("add-ing-btn").onclick=()=>re(),e.querySelectorAll("[data-stock-adj]").forEach(i=>{i.onclick=()=>{const o=i.dataset.stockAdj,a=Number(i.dataset.delta);m.mutate(a>0?"STOCK_BUY":"STOCK_WASTE",l=>{const f=l.inventory.find(b=>b.id===o);f&&(f.qty=Math.max(0,Number((f.qty+a).toFixed(2))))},{id:o,delta:a})}}),e.querySelectorAll("[data-edit-ing]").forEach(i=>{i.onclick=()=>{const o=t.find(a=>a.id===i.dataset.editIng);o&&re(o)}})}function Me(e){const{invoices:t}=m.state,r=t.reduce((o,a)=>o+a.total,0),n=t.reduce((o,a)=>o+a.vat,0),s=t.length?r/t.length:0,i=t.map(o=>`
    <tr>
      <td class="font-mono text-[10px] font-semibold text-[#1c1a17]">${o.id}</td>
      <td class="font-semibold text-[#4c473d]">${o.tableId}</td>
      <td class="text-[#8a8578]">${h(o.cashier)}</td>
      <td class="font-mono text-[9.5px] text-[#a39c8d]">${o.createdAt}</td>
      <td><span class="badge-pill badge-neutral">${o.payMethod}</span></td>
      <td class="serif text-[12px] font-bold text-[#1c1a17]">${M(o.total)}</td>
      <td class="text-right">
        <button type="button" data-reprint="${o.id}" class="mini-btn">Reprint 80mm</button>
      </td>
    </tr>
  `).join("");e.innerHTML=`
    <div class="pb-6">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h2 class="serif text-[30px] font-bold leading-[1.08] text-[#1c1a17]">Bills &amp; analytics</h2>
          <p class="mt-1.5 text-[11.5px] text-[#8a8578]">Settled thermal receipts, VAT ledger and one-click CSV export.</p>
        </div>
        <button type="button" id="export-csv-btn" class="btn-dark mt-1">Export CSV</button>
      </div>

      <div class="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
        ${j({label:"Gross revenue",value:M(r),note:"All settled invoices",tone:"peach",icon:N.trend,small:!0})}
        ${j({label:"Settled invoices",value:t.length,note:"Printed & archived",tone:"mint",icon:N.receipt})}
        ${j({label:"Average ticket",value:M(s),note:`VAT collected ${M(n)}`,tone:"pink",icon:N.coins,small:!0})}
      </div>

      <div class="mt-4 warm-card overflow-x-auto">
        <table class="warm-table min-w-[640px]">
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Table</th>
              <th>Cashier</th>
              <th>Timestamp</th>
              <th>Payment</th>
              <th>Total</th>
              <th class="text-right">Receipt</th>
            </tr>
          </thead>
          <tbody>${i}</tbody>
        </table>
      </div>
    </div>
  `,e.querySelectorAll("[data-reprint]").forEach(o=>{o.onclick=()=>{const a=t.find(l=>l.id===o.dataset.reprint);a&&pe(a)}}),document.getElementById("export-csv-btn").onclick=()=>{const a=[["InvoiceID","Table","Cashier","Date","Subtotal","Discount","VAT","Service","Total"],...t.map(b=>[b.id,b.tableId,b.cashier,b.createdAt,b.subtotal,b.discount,b.vat,b.service,b.total])].map(b=>b.join(",")).join(`
`),l=new Blob([a],{type:"text/csv"}),f=document.createElement("a");f.href=URL.createObjectURL(l),f.download="bite-invoices.csv",f.click()}}const X=["Admin","Manager","Cashier","Waiter","Chef"],ee=[{key:"pos",label:"Tables & POS"},{key:"kitchen",label:"Kitchen KOT"},{key:"menu",label:"Food menu"},{key:"inventory",label:"Inventory"},{key:"bills",label:"Bills & analytics"},{key:"staff",label:"Staff & Roles"}];function Ce(e){const t=document.getElementById("modal-root"),r=Array.isArray(e.permissions)?e.permissions:ee.map(s=>s.key);t.innerHTML=`
    <div class="modal-shell">
      <form id="staff-edit-form" class="modal-panel space-y-3">
        <div class="flex items-start justify-between gap-3">
          <div>
            <h3 class="modal-title serif">Edit Staff &amp; Access</h3>
            <p class="modal-sub">Update credentials, role and module permissions.</p>
          </div>
          <button type="button" id="close-staff-x" class="mini-btn" aria-label="Close">✕</button>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div class="field">
            <label for="staff-edit-name">Full Name</label>
            <input id="staff-edit-name" name="name" required value="${h(e.name)}" />
          </div>
          <div class="field">
            <label for="staff-edit-username">Username</label>
            <input id="staff-edit-username" name="username" required autocomplete="off" value="${h(e.username||"")}" />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div class="field">
            <label for="staff-edit-pin">4-Digit PIN</label>
            <input id="staff-edit-pin" name="pin" required maxlength="4" inputmode="numeric" pattern="\\d{4}" value="${h(String(e.pin||""))}" />
          </div>
          <div class="field">
            <label for="staff-edit-role">Role</label>
            <select id="staff-edit-role" name="role">
              ${X.map(s=>`<option value="${s}" ${e.role===s?"selected":""}>${s}</option>`).join("")}
            </select>
          </div>
        </div>

        <div class="field">
          <label>Module Access Permissions</label>
        </div>
        <div class="grid grid-cols-2 gap-1.5 rounded-xl border border-[#e4dbc9] bg-[#fffdf9] p-2.5">
          ${ee.map(s=>`
            <label class="flex items-center gap-2 text-[10px] text-[#4c473d]">
              <input type="checkbox" name="module" value="${s.key}" ${r.includes(s.key)?"checked":""} class="h-3.5 w-3.5 accent-[#ea580c]" />
              <span>${s.label}</span>
            </label>`).join("")}
        </div>

        <div class="flex justify-end gap-2 pt-1">
          <button type="button" id="close-staff-modal" class="btn-cream">Cancel</button>
          <button type="submit" class="btn-primary">Save changes</button>
        </div>
      </form>
    </div>`;const n=()=>{t.innerHTML=""};document.getElementById("close-staff-x").onclick=n,document.getElementById("close-staff-modal").onclick=n,document.getElementById("staff-edit-form").onsubmit=s=>{s.preventDefault();const i=document.getElementById("staff-edit-name").value.trim(),o=document.getElementById("staff-edit-username").value.trim().toLowerCase(),a=document.getElementById("staff-edit-pin").value.trim(),l=document.getElementById("staff-edit-role").value,f=Array.from(document.querySelectorAll('#staff-edit-form [name="module"]:checked')).map(v=>v.value);if(!i)return window.alert("Full name is required.");if(!o)return window.alert("Username is required.");if(!/^\d{4}$/.test(a))return window.alert("PIN must be exactly 4 digits.");if(m.state.users.find(v=>v.id!==e.id&&String(v.username||v.name).toLowerCase()===o))return window.alert("That username is already taken.");if(!f.length)return window.alert("Select at least one module for this account.");m.mutate("EDIT_USER",v=>{const u=v.users.find(S=>S.id===e.id);u&&(u.name=i,u.username=o,u.pin=a,u.role=l,u.permissions=f,v.currentUser&&v.currentUser.id===u.id&&(v.currentUser=u))},{userId:e.id,username:o,permissions:f}),m.persistUserUpdate("USER_UPDATED"),n()}}function qe(e){const{users:t,currentUser:r}=m.state,n=t.filter(a=>a.active).length,s=t.filter(a=>a.role==="Admin").length,i=new Set(t.map(a=>a.role)).size,o=t.map(a=>{const l=a.id===r.id;return`
      <tr>
        <td>
          <div class="flex items-center gap-2">
            <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f1e7d6] text-[8.5px] font-bold text-[#1c1a17] ring-1 ring-[#e5dbc9]">${Q(a.name)}</span>
            <div class="min-w-0">
              <p class="truncate text-[10.5px] font-semibold text-[#1c1a17]">${h(a.name)}</p>
              <p class="text-[8.5px] text-[#a39c8d]">${h(a.username||"")} · ${l?"Signed in":a.active?"Can sign in":"Access paused"}</p>
            </div>
          </div>
        </td>
        <td>
          <select data-role-user="${a.id}" class="rounded-lg border border-[#e0d6c2] bg-[#fffdf9] px-1.5 py-1 text-[9.5px] text-[#4c473d] outline-none focus:border-[#f59e0b]">
            ${X.map(f=>`<option value="${f}" ${a.role===f?"selected":""}>${f}</option>`).join("")}
          </select>
        </td>
        <td>
          <div class="flex items-center gap-1.5">
            <span class="font-mono text-[10px] tracking-[0.16em] text-[#6b665a]">••••</span>
            <button type="button" data-reset-pin="${a.id}" class="mini-btn">Reset PIN</button>
          </div>
        </td>
        <td><span class="badge-pill ${a.active?"badge-ok":"badge-neutral"}">${a.active?"Active":"Disabled"}</span></td>
        <td class="text-right">
          <div class="flex items-center justify-end gap-1.5 whitespace-nowrap">
            ${a.active?`<button type="button" data-pin-login="${a.id}" class="mini-btn shrink-0">PIN login</button>`:""}
            <button type="button" data-edit-user="${a.id}" class="mini-btn shrink-0">Edit</button>
            <button type="button" data-toggle-user="${a.id}" class="mini-btn shrink-0 ${a.active?"red":"green"}">${a.active?"Disable":"Enable"}</button>
          </div>
        </td>
      </tr>
    `}).join("");e.innerHTML=`
    <div class="pb-6">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h2 class="serif text-[30px] font-bold leading-[1.08] text-[#1c1a17]">Staff &amp; Roles</h2>
          <p class="mt-1.5 text-[11.5px] text-[#8a8578]">Manage logins, 4-digit PINs and role permissions for the whole team.</p>
        </div>
        <span class="badge-pill badge-neutral mt-1 shrink-0 border border-[#e6dec8] bg-[#faf6ee] px-2.5 py-1">
          <span class="h-1.5 w-1.5 rounded-full bg-[#5f8f6e]"></span> ${n} enabled
        </span>
      </div>

      <div class="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
        ${j({label:"Team members",value:t.length,note:"Registered staff accounts",tone:"peach",icon:N.users})}
        ${j({label:"Active logins",value:n,note:"Enabled right now",tone:"mint",icon:N.shield})}
        ${j({label:"Admin access",value:s,note:`${i} roles configured`,tone:"pink",icon:N.key})}
      </div>

      <div class="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div class="col-span-1 warm-card overflow-x-auto xl:col-span-8">
          <table class="warm-table min-w-[560px]">
            <thead>
              <tr>
                <th>Staff member</th>
                <th>Role permission</th>
                <th>4-digit PIN</th>
                <th>Status</th>
                <th class="text-right">Controls</th>
              </tr>
            </thead>
            <tbody>${o}</tbody>
          </table>
        </div>

        <form id="add-staff-form" class="col-span-1 warm-card h-fit space-y-3 p-4 xl:col-span-4">
          <div>
            <h3 class="serif text-[16px] font-bold text-[#1c1a17]">Add staff account</h3>
            <p class="mt-0.5 text-[8.5px] text-[#a39c8d]">Creates a new login with a 4-digit PIN.</p>
          </div>
          <div class="field">
            <label for="staff-name">Full name</label>
            <input id="staff-name" name="name" required placeholder="e.g. Nadia Islam" />
          </div>
          <div class="field">
            <label for="staff-username">Username</label>
            <input id="staff-username" name="username" required autocomplete="off" placeholder="e.g. nadia" />
          </div>
          <div class="field">
            <label for="staff-role">Role permission</label>
            <select id="staff-role" name="role">
              ${X.map(a=>`<option value="${a}">${a}</option>`).join("")}
            </select>
          </div>
          <div class="field">
            <label for="staff-pin">4-digit PIN</label>
            <input id="staff-pin" name="pin" required value="1234" maxlength="4" inputmode="numeric" pattern="\\d{4}" />
          </div>
          <button type="submit" class="btn-primary w-full">Create staff user</button>
        </form>
      </div>
    </div>
  `,e.querySelectorAll("[data-edit-user]").forEach(a=>{a.onclick=()=>{const l=t.find(f=>f.id===a.dataset.editUser);l&&Ce(l)}}),e.querySelectorAll("[data-pin-login]").forEach(a=>{a.onclick=()=>{const l=t.find(b=>b.id===a.dataset.pinLogin);if(!l)return;const f=window.prompt(`Enter 4-digit PIN for ${l.name} (${l.role}):`,"");f!==null&&(f.trim()===l.pin?m.mutate("SWITCH_USER",b=>{const v=b.users.find(u=>u.id===l.id);v&&(b.currentUser=v)},{userId:l.id}):window.alert("Invalid PIN. Try again."))}}),e.querySelectorAll("[data-reset-pin]").forEach(a=>{a.onclick=()=>{const l=t.find(v=>v.id===a.dataset.resetPin);if(!l)return;const f=window.prompt(`Set a new 4-digit PIN for ${l.name}:`,"");if(f===null)return;const b=f.trim();if(!/^\d{4}$/.test(b)){window.alert("PIN must be exactly 4 digits.");return}m.mutate("RESET_PIN",v=>{const u=v.users.find(S=>S.id===l.id);u&&(u.pin=b)},{userId:l.id})}}),e.querySelectorAll("[data-role-user]").forEach(a=>{a.onchange=()=>{const l=a.dataset.roleUser,f=a.value;m.mutate("UPDATE_USER_ROLE",b=>{const v=b.users.find(u=>u.id===l);v&&(v.role=f)},{userId:l,role:f})}}),e.querySelectorAll("[data-toggle-user]").forEach(a=>{a.onclick=()=>{const l=a.dataset.toggleUser;if(l===r.id){window.alert("Switch to another operator before disabling this account.");return}m.mutate("TOGGLE_USER",f=>{const b=f.users.find(v=>v.id===l);b&&(b.active=!b.active)},{userId:l})}}),document.getElementById("add-staff-form").onsubmit=a=>{a.preventDefault();const l=new FormData(a.target),f=String(l.get("pin")||"").trim();if(!/^\d{4}$/.test(f)){window.alert("PIN must be exactly 4 digits.");return}const b={id:"u"+Date.now(),name:String(l.get("name")||"").trim(),username:String(l.get("username")||"").trim().toLowerCase(),role:l.get("role"),pin:f,active:!0,permissions:ee.map(v=>v.key)};m.mutate("ADD_USER",v=>{v.users.push(b)},b)}}const Be={burger:'<path d="M14 44C14 27 30 17 50 17s36 10 36 27H14Z" /><path d="M30 26c1.5 1 1.5 2 0 3M43 22c1.5 1 1.5 2 0 3M57 22c1.5 1 1.5 2 0 3M70 27c1.5 1 1.5 2 0 3" /><path d="M10 50c5-4 10 4 15 0s10 4 15 0 10 4 15 0 10 4 15 0 10 4 15 0" /><path d="M13 57c6 2 12-2 18 0s12 2 18 0 12-2 18 0 12 2 18 0" /><path d="M16 63h68l-2 6H18l-2-6Z" /><path d="M18 73h64c0 8-7 13-16 13H34c-9 0-16-5-16-13Z" /><path d="M30 79h40" />',cup:'<path d="M30 30h40l-5 56H35l-5-56Z" /><path d="M26 30h48" /><path d="M39 30c0-7 4-11 11-11s11 4 11 11" /><path d="M55 19 64 5" /><path d="M36 44h12v10H36zM50 51h12v10H50zM37 63h12v10H37z" /><path d="M63 41a6 6 0 1 0 6 6" />',ramen:'<path d="M18 46c0-15 14-24 32-24s32 9 32 24H18Z" /><path d="M33 30c1.5 1 1.5 2 0 3M48 26c1.5 1 1.5 2 0 3M62 30c1.5 1 1.5 2 0 3" /><path d="M14 52c6-4 12 4 18 0s12 4 18 0 12 4 18 0 12 4 18 0" /><path d="M20 59h60l-3 7H23l-3-7Z" /><path d="M22 70h56c0 8-6 12-14 12H36c-8 0-14-4-14-12Z" />',glass:'<path d="M30 80 44 24h12l14 56c-13 5-27 5-40 0Z" /><path d="M40 38c7 3 13 3 20 0M35 58c10 4 20 4 30 0" /><path d="M44 22c1-7 10-9 12-2" /><circle cx="61" cy="15" r="4" /><circle cx="43" cy="40" r="1.5" /><circle cx="58" cy="50" r="1.5" /><circle cx="47" cy="63" r="1.5" />',fries:'<path d="M28 44h44l-6 42H34l-6-42Z" /><path d="M31 57h38M33 70h34" /><path d="M32 44V21M39 44V13M46 44V18M53 44V11M60 44V17M67 44V24" /><path d="M26 44h48" /><circle cx="42" cy="52" r="1" /><circle cx="55" cy="61" r="1" /><circle cx="48" cy="76" r="1" />',pizza:'<path d="M50 12 78 80c-18 6-38 6-56 0L50 12Z" /><path d="M26 64c15 6 33 6 48 0" /><path d="M50 12c-7 1-12 4-16 9 10 4 22 4 32 0-4-5-9-8-16-9Z" /><circle cx="44" cy="38" r="3.5" /><circle cx="56" cy="49" r="3.5" /><circle cx="44" cy="60" r="3" />',taco:'<path d="M12 60c5-18 20-30 38-30s33 12 38 30c-24 10-52 10-76 0Z" /><path d="M18 55c10-6 20-9 32-9s22 3 32 9" /><path d="M22 63c4-3 8 2 12-1s8 2 12-1 8 2 12-1 8 2 12-1" /><path d="M34 68c10 3 22 3 32 0" /><circle cx="36" cy="46" r="2.5" /><circle cx="50" cy="42" r="2.5" /><circle cx="64" cy="47" r="2.5" />',kettle:'<path d="M32 28h36l-4 58H36l-4-58Z" /><path d="M28 28h44" /><path d="M40 28c0-6 4-10 10-10s10 4 10 10" /><path d="M53 18 61 4" /><path d="M37 42h11v9H37zM50 49h11v9H50zM38 61h11v9H38z" /><path d="M64 38a6 6 0 1 0 7 6" />',sub:'<path d="M14 62c0-16 14-28 36-28s36 12 36 28c0 8-8 12-18 12H32c-10 0-18-4-18-12Z" /><path d="M20 56c14 5 46 5 60 0" /><path d="M30 41c2-3 5-3 7 0M44 37c2-3 5-3 7 0M58 39c2-3 5-3 7 0" /><path d="M28 66c8 3 36 3 44 0" />',chefhat:'<path d="M30 74V52c-8-2-13-8-13-16 0-9 8-16 17-16 3-6 9-10 16-10s13 4 16 10c9 0 17 7 17 16 0 8-5 14-13 16v22Z" /><path d="M28 74h44" /><path d="M34 62h32M34 68h32" />',coffee:'<path d="M24 40h44v18c0 9-7 16-16 16H40c-9 0-16-7-16-16V40Z" /><path d="M68 46h6a7 7 0 0 1 0 14h-6" /><path d="M18 80h56" /><path d="M36 32c0-5 4-6 4-10M48 32c0-5 4-6 4-10M60 32c0-5 4-6 4-10" />',donut:'<circle cx="50" cy="52" r="28" /><circle cx="50" cy="52" r="9" /><path d="M34 34c3 2 6 2 9 0M60 40c3 2 6 2 9 0M30 58c3 2 6 2 9 0M58 66c3 2 6 2 9 0M48 30c3 2 6 2 9 0M40 70c2 2 5 2 7 0" />',chicken:'<path d="M70 20c8-2 15 4 13 12-2 9-11 14-19 12l-9 9c-4 4-10 4-13 0s-4-9 0-13l9-9c-2-8 3-17 12-19" /><circle cx="37" cy="67" r="7" /><path d="M31 74l-6 6" />'},le=["burger","fries","pizza","cup","sub","taco","chefhat","coffee","donut","chicken","ramen","glass","kettle","burger"],Z=7,de=4,me=[];for(let e=0;e<de;e+=1)for(let t=0;t<Z;t+=1){const r=e*Z+t,n=r*37%7-3,s=r*53%9-4;me.push({art:le[r%le.length],x:Number(((t+.5)*(100/Z)+n).toFixed(2)),y:Number(((e+.5)*(100/de)+s).toFixed(2)),size:75+r*13%36,rotate:-25+r*17%54,opacity:Number((.2+r%4*.02).toFixed(2))})}function Oe(e){e&&(e.innerHTML=me.map(({art:t,x:r,y:n,size:s,rotate:i,opacity:o})=>`<svg viewBox="0 0 100 100" style="left:${r}%;top:${n}%;width:${s}px;height:${s}px;transform:translate(-50%,-50%) rotate(${i}deg);opacity:${o}">${Be[t]}</svg>`).join(""))}const _={pos:{crumb:"🍽 TABLES & POS",title:"Tables & POS"},kitchen:{crumb:"🍳 KITCHEN KOT",title:"Kitchen KOT"},menu:{crumb:"🍴 MENU & RECIPES",title:"Food menu"},inventory:{crumb:"📦 INVENTORY",title:"Inventory"},bills:{crumb:"🧾 BILLS & ANALYTICS",title:"Bills & analytics"},staff:{crumb:"👥 STAFF & ROLES",title:"Staff & Roles"}},B={activeTab:"menu",selectedTableId:"T-01",posCategory:"All",discount:0,menuSearch:"",menuCat:"All",menuAvail:"All"},Y=new URLSearchParams(window.location.search).get("tab");Y&&_[Y]&&(B.activeTab=Y);const ce=Object.keys(_);function ge(e){return e&&Array.isArray(e.permissions)?e.permissions:ce}function De(){const e=_[B.activeTab]||_.menu,{currentUser:t}=m.state;document.getElementById("crumb").textContent=e.crumb,document.getElementById("crumb-title").textContent=e.title;const r=document.getElementById("header-manage-options");r&&(r.hidden=!(B.activeTab==="menu"&&t&&t.role==="Admin"))}function Ne(){const{currentUser:e,pendingQueue:t,tables:r,inventory:n}=m.state,s=ge(e);document.querySelectorAll("#sidebar-nav .navlink").forEach(c=>{const x=s.includes(c.dataset.tab);c.hidden=!x,c.classList.toggle("active",x&&c.dataset.tab===B.activeTab)});const i=r.filter(c=>c.status==="Occupied"&&c.id!=="Takeaway").length,o=n.filter(c=>c.qty<=c.minAlert).length,a=r.filter(c=>c.items.length>0&&c.kotStatus!=="Served").length;document.getElementById("tables-badge").textContent=String(i),document.getElementById("kitchen-badge").textContent=String(a),document.getElementById("menu-badge").textContent=String(m.state.menu.length),document.getElementById("inventory-badge").textContent=String(o);const l=t.length,f=document.getElementById("sync-btn-count"),b=document.getElementById("pending-sync-badge");f&&(f.textContent=String(l)),b&&(b.textContent=String(l));const v=document.getElementById("sync-dot"),u=document.getElementById("sync-title"),S=document.getElementById("sync-subtitle"),E=document.getElementById("sync-now-btn");l>0?(v.style.background="#f59e0b",v.style.boxShadow="0 0 0 3px rgba(245,158,11,0.14)",u.textContent="Sync needs attention",S.textContent=`${l} queued · not synced to server yet`,E.innerHTML=`<span class="text-[12px] leading-none">↻</span> Sync <span id="sync-btn-count">${l}</span>`):(v.style.background="#5f8f6e",v.style.boxShadow="0 0 0 3px rgba(95,143,110,0.16)",u.textContent="Everything synced",S.textContent="Queue is clear · server up to date",E.innerHTML='<span class="text-[12px] leading-none">↻</span> Synced');const g=document.getElementById("offline-sim-toggle");if(g.dataset.on=String(m.state.isOfflineSim),g.setAttribute("aria-checked",String(m.state.isOfflineSim)),e){const c=e.role;document.getElementById("user-avatar").textContent=Q(e.name),document.getElementById("user-name").textContent=e.name,document.getElementById("user-role").textContent=c==="Admin"?"Admin · Full access":`${c} · Evening`,document.getElementById("header-avatar").textContent=Q(e.name)}}function P(){const e=m.state.currentUser,t=document.getElementById("app-shell");if(t&&(t.hidden=!e),!e){document.getElementById("app-viewport").innerHTML="",je();return}const r=ge(e);r.includes(B.activeTab)||(B.activeTab=r[0]||"pos"),document.getElementById("login-root").replaceChildren(),De(),Ne();const n=document.getElementById("app-viewport");switch(B.activeTab){case"pos":ke(n,B,P);break;case"kitchen":Te(n);break;case"menu":oe(n,B,P);break;case"inventory":Ee(n);break;case"bills":Me(n);break;case"staff":qe(n);break;default:oe(n,B,P)}}function fe(){const e=new Date,t=e.getHours(),r=t%12||12,n=String(e.getMinutes()).padStart(2,"0");document.getElementById("live-clock").textContent=`${r}:${n} ${t>=12?"PM":"AM"}`,document.getElementById("live-date").textContent=e.toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})}function je(){const e=document.getElementById("login-root");if(!e)return;const t=m.state.users.filter(a=>a.active),r=["1","2","3","4","5","6","7","8","9","C","0","⌫"];e.innerHTML=`
    <div class="login-screen">
      <div class="login-card">
        <div class="login-emblem">
          <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 3v7a2 2 0 0 0 2 2v9" /><path d="M10 3v7a2 2 0 0 1-2 2" /><path d="M6 3v7" />
            <path d="M17 3c1.6 1.4 2.4 3 2.4 4.8 0 1.9-1 3.2-2.4 4.2V21" />
          </svg>
        </div>
        <h1 class="login-title serif">Bite Restaurant POS</h1>
        <p class="login-sub">Sign in to open your shift</p>

        <form id="login-form" class="login-form" autocomplete="off">
          <div class="field">
            <label for="login-username">Username</label>
            <input id="login-username" required autocomplete="off" placeholder="Enter your username" />
          </div>
          <div class="field">
            <label for="login-pin">4-digit PIN</label>
            <div class="relative">
              <input id="login-pin" type="password" required maxlength="4" inputmode="numeric" pattern="[0-9]{4}" placeholder="••••" class="pr-10 tracking-widest" style="padding-right: 38px; letter-spacing: 0.22em;" />
              <button type="button" id="toggle-pin-visibility" aria-label="Show PIN" aria-pressed="false" class="absolute right-3 top-1/2 -translate-y-1/2 text-[#8a8578] transition hover:text-[#4c473d]">👁️</button>
            </div>
          </div>
          <div class="login-keypad" role="group" aria-label="Touchscreen PIN keypad">
            ${r.map(a=>`<button type="button" data-pin-key="${a}">${a}</button>`).join("")}
          </div>
          <p id="login-error" class="login-error" role="alert"></p>
          <button type="submit" class="btn-primary login-submit">Sign In</button>
        </form>

        <p class="login-foot">Restricted access · authorised staff only</p>
      </div>
    </div>`;const n=document.getElementById("login-pin"),s=document.getElementById("login-error");e.querySelectorAll("[data-pin-key]").forEach(a=>{a.onclick=()=>{const l=a.dataset.pinKey;l==="C"?n.value="":l==="⌫"?n.value=n.value.slice(0,-1):n.value.length<4&&(n.value+=l),s.classList.remove("show")}});const i=document.getElementById("toggle-pin-visibility");let o=!1;i&&(i.onclick=()=>{o=!o,n.type=o?"text":"password",i.textContent=o?"🙈":"👁️",i.setAttribute("aria-pressed",String(o)),i.setAttribute("aria-label",o?"Hide PIN":"Show PIN"),n.focus()}),document.getElementById("login-form").onsubmit=a=>{a.preventDefault();const l=document.getElementById("login-username").value.trim().toLowerCase(),f=n.value.trim(),b=t.find(v=>(String(v.username||v.name).toLowerCase()===l||v.name.toLowerCase()===l)&&String(v.pin)===f);if(!b){s.textContent="Invalid username or 4-digit PIN.",s.classList.add("show"),n.value="";return}sessionStorage.setItem("bite_current_user",JSON.stringify(b)),m.mutate("SWITCH_USER",v=>{v.currentUser=v.users.find(u=>u.id===b.id)},{userId:b.id})}}function Le(){sessionStorage.removeItem("bite_current_user"),localStorage.removeItem("bite_active_user"),m.mutate("LOGOUT",e=>{e.currentUser=null})}function Pe(){document.querySelectorAll("#sidebar-nav .navlink").forEach(e=>{e.addEventListener("click",()=>{B.activeTab!==e.dataset.tab&&(B.activeTab=e.dataset.tab,P(),document.getElementById("app-viewport").scrollTop=0)})}),document.getElementById("offline-sim-toggle").addEventListener("click",()=>{m.setOfflineSim(!m.state.isOfflineSim)}),document.getElementById("sync-now-btn").addEventListener("click",async()=>{await m.syncNow()}),["logout-btn","header-logout-btn"].forEach(e=>{const t=document.getElementById(e);t&&t.addEventListener("click",Le)})}m.subscribe(()=>P());Oe(document.getElementById("doodle-wall"));Pe();fe();setInterval(fe,15e3);P();m.hydrateFromServer();
