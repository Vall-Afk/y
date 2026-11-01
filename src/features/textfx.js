'use strict';
// Locally rendered text effects using Sharp SVG. These are ORIGINAL styles,
// not copies of proprietary external TextPro service effects.
const sharp=require('sharp');
const {xmlSafe,splitText}=require('./sticker-tools');
const THEMES=Object.freeze({
  neon:{back:'#09142e',from:'#00f5ff',to:'#ae58ff',stroke:'#12ceff',glow:true},
  rainbow:{back:'#20112b',from:'#ff355d',to:'#fdde39',stroke:'#812bda'},
  glitch:{back:'#101218',from:'#ffffff',to:'#c5efff',stroke:'#00ffff',glow:true},
  halloween:{back:'#231022',from:'#ff8e30',to:'#ffdb50',stroke:'#7f3726',glow:true},
  horror:{back:'#101012',from:'#f24b58',to:'#a52b44',stroke:'#ff2b36'},
  ice:{back:'#143d55',from:'#e1ffff',to:'#68c7ff',stroke:'#44a9ff'},
  fire:{back:'#340e0e',from:'#ffff6d',to:'#e7351c',stroke:'#f24e10',glow:true},
  matrix:{back:'#03170b',from:'#95ff7f',to:'#24ba56',stroke:'#277b42',glow:true},
  snow:{back:'#243c66',from:'#ffffff',to:'#c0dffd',stroke:'#b2d8ff'},
  wood:{back:'#472d1b',from:'#e1b776',to:'#97633c',stroke:'#5c2d19'},
  metallic:{back:'#1c2631',from:'#ffffff',to:'#869cad',stroke:'#3c4956'},
  space:{back:'#140e36',from:'#6dffff',to:'#ad8dff',stroke:'#595fff',glow:true},
  watercolor:{back:'#f7eafb',from:'#a341d8',to:'#f384af',stroke:'#9743a4'},
  christmas:{back:'#163628',from:'#ffffff',to:'#e7d86a',stroke:'#c11d35'}
});
const ALIAS=Object.freeze({
  neon2:'neon',gneon:'neon',neonlight:'neon',neon_light:'neon',
  glitch2:'glitch',rainbow2:'rainbow',halloween2:'halloween',
  horror2:'horror',lava:'fire',magma:'fire',thunder:'fire',
  ices:'ice',underwater:'ice',
  cloudsky:'snow',xmas:'christmas',
  christmas2:'christmas',
  metalg:'metallic',metalr:'metallic',metals:'metallic',
  3dsteel:'metallic',steel:'metallic',silver:'metallic',
  space3d:'space',3dstone:'metallic',purple:'space',
  natural:'wood',writing:'watercolor',sketch:'watercolor'
});
const TEXTFX_COMMANDS=new Set(['textfx',...Object.keys(THEMES),...Object.keys(ALIAS)]);
function nameFor(input){
  const name=String(input||'').toLowerCase();
  const key=Object.hasOwn(ALIAS,name)?ALIAS[name]:name;
  if(!Object.hasOwn(THEMES,key))throw new Error('Unknown style. Use textfx neon <text>.');
  return key;
}
function effectSvg(theme,text){
  const selected=THEMES[nameFor(theme)];
  if(typeof text!=='string'||!text.trim()||[...text].length>85)
    throw new Error('Text must be 1–85 characters.');
  const lines=splitText(text.trim(),85);
  const size=Math.max(56,Math.min(115,650/Math.max(1,...lines.map(s=>[...s].length))));
  const start=256-(lines.length-1)*size*0.54;
  const tspan=lines.map((line,i)=>'<text x="512" y="'+(start+i*size*1.13)+
    '" font-size="'+size+'" font-weight="900" text-anchor="middle" '+
    'font-family="Arial,Helvetica,sans-serif" stroke="'+selected.stroke+
    '" stroke-width="3" paint-order="stroke" fill="url(#txt)">'+xmlSafe(line)+'</text>').join('');
  const backdrop='<rect width="1024" height="512" rx="24" fill="'+selected.back+'"/>';
  const stars=theme==='space'||theme==='snow'?
    Array.from({length:16},(_,i)=>'<circle cx="'+(40+i*61)+'" cy="'+(20+(i*41)%390)+
      '" r="'+(2+i%4)+'" fill="#ffffff" opacity=".6"/>').join(''):'';
  const matrix=theme==='matrix'?Array.from({length:12},(_,i)=>
    '<text x="'+(10+i*84)+'" y="'+(60+i%3*120)+'" fill="#227d47" opacity=".35" font-size="31">10101</text>').join(''):'';
  const blur=selected.glow?'<g opacity=".72" filter="url(#blur)">'+tspan+'</g>':'';
  const glitch=theme==='glitch'?'<g transform="translate(8,-4)" opacity=".5" fill="#f52b6c">'+tspan+'</g>':'';
  return Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="512">'+
    '<defs><linearGradient id="txt" x1="0" x2="1" y1="0" y2="1">'+
    '<stop offset="0%" stop-color="'+selected.from+'"/><stop offset="100%" stop-color="'+
    selected.to+'"/></linearGradient><filter id="blur"><feGaussianBlur stdDeviation="9"/></filter></defs>'+
    backdrop+stars+matrix+glitch+blur+tspan+'</svg>');
}
async function textEffect(style,text){
  const theme=nameFor(style);
  const image=await sharp(effectSvg(theme,text),{limitInputPixels:1024*512})
    .png({compressionLevel:8}).toBuffer();
  if(image.length>2*1024*1024)throw new Error('Effect output too large.');
  return image;
}
async function handleTextFx(ctx){
  const {cmd,lang,reply,sock,chat,message}=ctx;
  if(!TEXTFX_COMMANDS.has(cmd.name))return false;
  const style=cmd.name==='textfx'?cmd.args[0]:cmd.name;
  const body=(cmd.name==='textfx'?cmd.args.slice(1):cmd.args).join(' ');
  try{
    if(!body)throw new Error('Example: textfx neon Beauté.');
    await sock.sendMessage(chat,{image:await textEffect(style,body),
      caption:'✦ '+style+' · Beauté.'},{quoted:message});
  }catch(err){
    await reply((lang==='en'?'Text effect failed: ':'Efek teks gagal: ')+err.message);
  }
  return true;
}
module.exports={THEMES,ALIAS,TEXTFX_COMMANDS,nameFor,effectSvg,textEffect,handleTextFx};
