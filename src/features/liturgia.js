'use strict';
// Beauté Liturgia: Roman calendar foundations. Not a substitute for official local ordo.
const LITURGIA_COMMANDS=new Set(['liturgi','liturgia','sanctoral']);
const MS=86400000;
const utc=(y,m,d)=>new Date(Date.UTC(y,m-1,d));
const iso=d=>d.toISOString().slice(0,10);
const shift=(d,n)=>new Date(d.getTime()+n*MS);
function parseDate(s){if(!/^\d{4}-\d{2}-\d{2}$/.test(s||''))throw Error('Tanggal harus YYYY-MM-DD.');const d=new Date(s+'T00:00:00Z');if(Number.isNaN(d.getTime())||iso(d)!==s)throw Error('Tanggal tidak valid.');return d;}
function easter(y){const a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k+700)%7,m=Math.floor((a+11*h+22*l)/451),z=h+l-7*m+114;return utc(y,Math.floor(z/31),z%31+1);}
function sundayOnOrBefore(d){return shift(d,-d.getUTCDay());}
function advent(y){const d=utc(y,11,27);return shift(d,(7-d.getUTCDay())%7);}
const title=(id,en,la)=>({id,en,la});
const CHRIST_KING_MODERN=title('Hari Raya Tuhan Kita Yesus Kristus Raja Semesta Alam','Solemnity of Our Lord Jesus Christ, King of the Universe','Domini Nostri Iesu Christi Universorum Regis');
const CHRIST_KING_1962=title('Pesta Tuhan Kita Yesus Kristus Raja','Feast of Our Lord Jesus Christ the King','Domini Nostri Iesu Christi Regis');
const celebrations=[
 {month:1,day:1,name:title('Santa Maria Bunda Allah','Mary, the Holy Mother of God','Sancta Dei Genetrix Maria'),modern:'Hari raya',traditional:null},
 {month:1,day:6,name:title('Penampakan Tuhan','Epiphany of the Lord','Epiphania Domini'),modern:'Hari raya',traditional:'Kelas I'},
 {month:3,day:19,name:title('Santo Yusuf, Suami Santa Perawan Maria','Saint Joseph, Spouse of the Blessed Virgin Mary','Sancti Ioseph, Sponsi Beatae Mariae Virginis'),modern:'Hari raya',traditional:'Kelas I'},
 {month:6,day:29,name:title('Santo Petrus dan Paulus, Rasul','Saints Peter and Paul, Apostles','Sanctorum Petri et Pauli, Apostolorum'),modern:'Hari raya',traditional:'Kelas I'},
 {month:8,day:15,name:title('Santa Perawan Maria Diangkat ke Surga','Assumption of the Blessed Virgin Mary','Assumptio Beatae Mariae Virginis'),modern:'Hari raya',traditional:'Kelas I'},
 {month:11,day:1,name:title('Semua Orang Kudus','All Saints','Omnium Sanctorum'),modern:'Hari raya',traditional:'Kelas I'},
 {month:11,day:2,name:title('Peringatan Arwah Semua Orang Beriman','Commemoration of All the Faithful Departed','Commemoratio Omnium Fidelium Defunctorum'),modern:'Peringatan',traditional:'Peringatan khusus'},
 {month:12,day:8,name:title('Santa Perawan Maria Dikandung Tanpa Noda','Immaculate Conception of the Blessed Virgin Mary','Immaculata Conceptio Beatae Mariae Virginis'),modern:'Hari raya',traditional:'Kelas I'},
 {month:12,day:25,name:title('Kelahiran Tuhan','Nativity of the Lord','Nativitas Domini'),modern:'Hari raya',traditional:'Kelas I'}
];
const feasts=y=>{const e=easter(y),a=advent(y),oct=utc(y,10,31);return {
 easter:e,ash:shift(e,-46),palm:shift(e,-7),thursday:shift(e,-3),friday:shift(e,-2),pentecost:shift(e,49),advent:a,
 christModern:shift(a,-7),christ1962:shift(oct,-oct.getUTCDay())
};};
function pickName(name,lang){return name[lang]||name.id;}
function calculate(date,rite='modern',lang='id'){
 if(!['modern','1962'].includes(rite))throw Error('Kalender: modern atau 1962.');
 if(!['id','en','la'].includes(lang))throw Error('Bahasa: id, en, la.');
 const y=date.getUTCFullYear();if(y<1583||y>4099)throw Error('Tahun harus 1583–4099.');
 const f=feasts(y),key=iso(date),traditional=rite==='1962';
 const special=[
  [f.easter,title('Minggu Paskah Kebangkitan Tuhan','Easter Sunday of the Resurrection of the Lord','Dominica Resurrectionis Domini')],
  [f.palm,title('Minggu Palma','Palm Sunday','Dominica in Palmis')],
  [f.thursday,title('Kamis Putih','Holy Thursday','Feria V in Cena Domini')],
  [f.friday,title('Jumat Agung','Good Friday','Feria VI in Passione et Morte Domini')],
  [f.pentecost,title('Minggu Pentakosta','Pentecost Sunday','Dominica Pentecostes')],
  [f.christModern,CHRIST_KING_MODERN],
  [f.christ1962,CHRIST_KING_1962]
 ].filter(([d,n])=>iso(d)===key&&(!traditional?n!==CHRIST_KING_MODERN:n!==CHRIST_KING_1962));
 let found=special[0]?.[1]||null;
 if(!found){const entry=celebrations.find(x=>x.month===date.getUTCMonth()+1&&x.day===date.getUTCDate());if(entry&&(traditional?entry.traditional:entry.modern))found=entry.name;}
 let season='Masa Biasa',color='Hijau';
 if(date>=f.advent&&date<utc(y,12,25)){season='Adven';color='Ungu';}
 else if(date>=utc(y,12,25)||date<utc(y,1,13)){season='Natal';color='Putih';}
 else if(date>=f.ash&&date<f.easter){season='Prapaskah';color='Ungu';}
 else if(date>=f.easter&&date<=f.pentecost){season='Paskah';color='Putih';}
 // Previous year's Advent/Nativity and movable calendar boundaries require separate local ordo verification.
 if(key===iso(f.friday)||key===iso(f.palm))color='Merah';
 if(key===iso(f.pentecost))color='Merah';
 if(found&&celebrations.some(x=>x.name===found))color='Putih';
 if(key===iso(f.christModern)&&!traditional||key===iso(f.christ1962)&&traditional)color='Putih';
 const rank=found?(traditional?'Kelas I / perayaan khusus':'Hari raya / perayaan khusus'):'Feria / Minggu (tingkat belum diverifikasi)';
 return {date:key,rite,lang,name:found?pickName(found,lang):null,season,color,rank,verified:!!found,notes:'Kalender Roma umum (parsial). Perayaan lokal, pemindahan, precedensi dan bacaan belum diverifikasi.'};
}
function format(c){return ['Beauté · LITURGIA',c.rite==='1962'?'Calendarium Romanum 1960 / Missale 1962':'Calendarium Romanum Generale (modern)',c.date,'Perayaan: '+(c.name||'Belum tersedia dalam basis data'),'Masa: '+c.season,'Warna (indikatif): '+c.color,'Tingkat (indikatif): '+c.rank,'Catatan: '+c.notes].join('\n');}
async function handleLiturgia(ctx,{clock=()=>new Date()}={}){
 if(!LITURGIA_COMMANDS.has(ctx.cmd.name))return false;
 try{
  const args=[...ctx.cmd.args].map(x=>String(x).toLowerCase());
  if(ctx.cmd.name==='sanctoral')return ctx.reply('Sanctoral lengkap belum tersedia. Kalender umum parsial dapat dilihat dengan: liturgi YYYY-MM-DD');
  const compare=args.includes('bandingkan')||args.includes('compare');
  const rite=args.includes('1962')||args.includes('tradisional')?'1962':'modern';
  const lang=args.includes('latin')||args.includes('la')?'la':args.includes('english')||args.includes('en')?'en':'id';
  const dateArg=args.find(x=>/^\d{4}-\d{2}-\d{2}$/.test(x));
  const yearArg=args.find(x=>/^\d{4}$/.test(x));
  if(yearArg&&!dateArg){const y=Number(yearArg),f=feasts(y);return ctx.reply('Beauté · Tahun '+y+'\nPaskah: '+iso(f.easter)+'\nRabu Abu: '+iso(f.ash)+'\nPentakosta: '+iso(f.pentecost)+'\nAdven I: '+iso(f.advent)+'\nKristus Raja (modern): '+iso(f.christModern)+'\nKristus Raja (1962): '+iso(f.christ1962)+'\nKalender umum parsial; cek ordo lokal.');}
  const parts=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(clock());
  const p=Object.fromEntries(parts.map(x=>[x.type,x.value]));
  const date=dateArg?parseDate(dateArg):parseDate(p.year+'-'+p.month+'-'+p.day);
  if(compare)return ctx.reply(format(calculate(date,'modern',lang))+'\n\n'+format(calculate(date,'1962',lang)));
  return ctx.reply(format(calculate(date,rite,lang)));
 }catch(e){await ctx.reply('Liturgia: '+String(e.message).slice(0,140));}
 return true;
}
module.exports={LITURGIA_COMMANDS,handleLiturgia,calculate,feasts,easter,advent,parseDate};
