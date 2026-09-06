const labels={0:"Minggu",1:"Senin",2:"Selasa",3:"Rabu",4:"Kamis",5:"Jumat",6:"Sabtu"};
const months=["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
if(!window.SUPABASE_URL||window.SUPABASE_URL.startsWith("PASTE_")){document.getElementById("emptyState").style.display="block";document.getElementById("emptyText").textContent="Konfigurasi Supabase belum diisi. Silakan ikuti README.";throw new Error("Supabase config belum diisi.");}
const sb=window.supabase.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY);
const params=new URLSearchParams(location.search);
let selectedDate=/^\d{4}-\d{2}-\d{2}$/.test(params.get("date")||"")?params.get("date"):toISO(new Date());
function toISO(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`}
function parseISO(s){const[a,b,c]=s.split("-").map(Number);return new Date(a,b-1,c)}
function mondayOf(s){const d=parseISO(s),day=d.getDay();d.setDate(d.getDate()+(day===0?-6:1-day));return d}
function fmtDate(s){const d=parseISO(s);return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`}
function setURL(){history.replaceState(null,"",`?date=${selectedDate}`)}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
async function loadWeek(){const start=mondayOf(selectedDate),dates=[];for(let i=0;i<5;i++){const d=new Date(start);d.setDate(start.getDate()+i);dates.push(toISO(d))}
const{data,error}=await sb.from("menus").select("menu_date").in("menu_date",dates);if(error)console.error(error);
const have=new Set((data||[]).map(x=>x.menu_date));document.getElementById("weeklyButtons").innerHTML=dates.map(iso=>{const d=parseISO(iso),a=iso===selectedDate?" active":"";return `<button class="day-button${a}" type="button" data-date="${iso}"><strong>${labels[d.getDay()]}</strong><span>${d.getDate()}</span></button>`}).join("");
document.querySelectorAll(".day-button").forEach(b=>b.onclick=()=>{selectedDate=b.dataset.date;setURL();render()})}
async function loadMenu(){const d=parseISO(selectedDate);document.getElementById("dayName").textContent=labels[d.getDay()];document.getElementById("displayDate").textContent=fmtDate(selectedDate);document.getElementById("photoCaption").textContent=`MENU ${labels[d.getDay()].toUpperCase()}`;
const{data:m,error}=await sb.from("menus").select("*").eq("menu_date",selectedDate).maybeSingle();if(error){showEmpty("Gagal mengambil data menu. Periksa konfigurasi Supabase dan RLS.");return}
const img=document.getElementById("menuPhoto"),ph=document.getElementById("photoPlaceholder");if(m?.photo_url){img.src=m.photo_url;img.alt=`Foto menu ${fmtDate(selectedDate)}`;img.style.display="block";ph.style.display="none"}else{img.style.display="none";ph.style.display="block"}
if(!m){showEmpty(`Data menu untuk tanggal ${fmtDate(selectedDate)} belum dimasukkan oleh Admin.`);return}
document.getElementById("emptyState").style.display="none";document.getElementById("menuContent").style.display="block";document.getElementById("menuTitle").textContent=m.menu_title||"Paket Makan Bergizi Gratis";document.getElementById("menuDescription").textContent=m.menu_description||"";
["carbohydrate","animal_protein","plant_protein","vegetable","fruit"].forEach(k=>document.getElementById(k).textContent=m[k]||"");
const rows=[["Energi","energy_small","energy_large"],["Protein","protein_small","protein_large"],["Lemak","fat_small","fat_large"],["Karbohidrat","carb_small","carb_large"],["Serat","fiber_small","fiber_large"]];
document.getElementById("nutritionRows").innerHTML=rows.map(r=>`<tr><td>${esc(r[0])}</td><td>${esc(m[r[1]])}</td><td>${esc(m[r[2]])}</td></tr>`).join("")}
function showEmpty(t){document.getElementById("menuContent").style.display="none";document.getElementById("emptyState").style.display="block";document.getElementById("emptyText").textContent=t}
async function render(){await loadWeek();await loadMenu()}
document.getElementById("prevWeek").onclick=()=>{const d=mondayOf(selectedDate);d.setDate(d.getDate()-7);selectedDate=toISO(d);setURL();render()};
document.getElementById("nextWeek").onclick=()=>{const d=mondayOf(selectedDate);d.setDate(d.getDate()+7);selectedDate=toISO(d);setURL();render()};render();