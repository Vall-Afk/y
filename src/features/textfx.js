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

const LEGACY_STYLES=Object.freeze({
  "game8bit": "neon",
  "layered": "wood",
  "coolg": "rainbow",
  "coolwg": "rainbow",
  "realistic": "metallic",
  "gtiktok": "metallic",
  "stone": "wood",
  "marvel": "rainbow",
  "marvel2": "rainbow",
  "pornhub": "metallic",
  "avengers": "rainbow",
  "metalg2": "metallic",
  "lion": "space",
  "wolf_bw": "space",
  "wolf_g": "space",
  "ninja": "space",
  "bagel": "wood",
  "blackpink": "space",
  "water_pipe": "ice",
  "sircuit": "metallic",
  "discovery": "neon",
  "metallic2": "metallic",
  "fiction": "space",
  "demon": "horror",
  "transformer": "neon",
  "berry": "rainbow",
  "harry_potter": "metallic",
  "embossed": "wood",
  "broken": "horror",
  "papercut": "wood",
  "gradient": "rainbow",
  "glossy": "rainbow",
  "multicolor": "rainbow",
  "neon_devil": "horror",
  "underwater": "ice",
  "bear": "space",
  "wonderfulg": "space",
  "luxury2": "metallic",
  "gradient2": "rainbow",
  "summer": "wood",
  "engraved": "wood",
  "summery": "wood",
  "3dglue": "metallic",
  "metaldark": "metallic",
  "neonlight": "neon",
  "oscar": "space",
  "minion": "space",
  "holographic": "rainbow",
  "glossyb": "rainbow",
  "deluxe2": "metallic",
  "glossyc": "rainbow",
  "fabric": "wood",
  "neonc": "neon",
  "newyear": "christmas",
  "newyear2": "christmas",
  "blood": "horror",
  "darkg": "metallic",
  "joker": "rainbow",
  "wicker": "wood",
  "firework": "horror",
  "skeleton": "metallic",
  "balloon": "space",
  "balloon2": "space",
  "balloon3": "space",
  "balloon4": "space",
  "balloon5": "space",
  "balloon6": "space",
  "balloon7": "space",
  "steel": "metallic",
  "gloss": "rainbow",
  "denim": "wood",
  "decorate": "wood",
  "decorate2": "wood",
  "peridot": "rainbow",
  "rock": "wood",
  "glass": "ice",
  "glass2": "ice",
  "glass3": "ice",
  "glass4": "ice",
  "glass5": "ice",
  "glass6": "ice",
  "glass7": "ice",
  "glass8": "ice",
  "captain_as2": "space",
  "robot": "neon",
  "equalizer": "neon",
  "toxic": "horror",
  "sparkling": "rainbow",
  "sparkling2": "rainbow",
  "sparkling3": "rainbow",
  "sparkling4": "rainbow",
  "sparkling5": "rainbow",
  "sparkling6": "rainbow",
  "sparkling7": "rainbow",
  "decorative": "metallic",
  "chocolate": "wood",
  "strawberry": "rainbow",
  "koifish": "ice",
  "bread": "wood",
  "blood2": "horror",
  "neonligth2": "neon",
  "thunder2": "horror",
  "3dbox": "metallic",
  "neon2": "neon",
  "roadw": "metallic",
  "bokeh": "neon",
  "advanced": "metallic",
  "dropwater": "ice",
  "wall": "wood",
  "chrismast": "christmas",
  "honey": "ice",
  "drug": "horror",
  "marble": "wood",
  "marble2": "wood",
  "juice": "rainbow",
  "rusty": "horror",
  "abstra": "metallic",
  "biscuit": "wood",
  "scifi": "neon",
  "purpleg": "space",
  "shiny": "rainbow",
  "jewelry": "rainbow",
  "jewelry2": "rainbow",
  "jewelry3": "rainbow",
  "jewelry4": "rainbow",
  "jewelry5": "rainbow",
  "jewelry6": "rainbow",
  "jewelry7": "rainbow",
  "jewelry8": "rainbow",
  "metalh": "metallic",
  "golden": "metallic",
  "glitter": "rainbow",
  "glitter2": "rainbow",
  "glitter3": "rainbow",
  "glitter4": "rainbow",
  "glitter5": "rainbow",
  "glitter6": "rainbow",
  "glitter7": "rainbow",
  "metale": "metallic",
  "carbon": "metallic",
  "candy": "rainbow",
  "metalb": "metallic",
  "gemb": "rainbow",
  "3dchrome": "metallic",
  "metalb2": "metallic"
});
const ALIAS=Object.freeze({
  ...LEGACY_STYLES,
  neon2:'neon',gneon:'neon',neonlight:'neon',neon_light:'neon',
  glitch2:'glitch',rainbow2:'rainbow',halloween2:'halloween',
  horror2:'horror',lava:'fire',magma:'fire',thunder:'fire',
  ices:'ice',underwater:'ice',
  cloudsky:'snow',xmas:'christmas',
  christmas2:'christmas',
  metalg:'metallic',metalr:'metallic',metals:'metallic',
  '3dsteel':'metallic',steel:'metallic',silver:'metallic',
  space3d:'space','3dstone':'metallic',purple:'space',
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
  const style=String(theme||'').toLowerCase();
  const canonical=nameFor(style);
  const selected=THEMES[canonical];
  // Stable local procedural variations for each advertised legacy name.
  // They are original artwork, not proprietary TextPro templates.
  let seed=2166136261;
  for(const char of style){seed=Math.imul(seed^char.codePointAt(0),16777619)>>>0;}
  const variant=Object.hasOwn(LEGACY_STYLES,style);
  const hue=seed%360;
  const palette=variant?{...selected,
    back:'hsl('+hue+',36%,13%)',
    from:'hsl('+((hue+30)%360)+',93%,76%)',
    to:'hsl('+((hue+168)%360)+',85%,57%)',
    stroke:'hsl('+((hue+232)%360)+',70%,25%)'}:selected;
  if(typeof text!=='string'||!text.trim()||[...text].length>85)
    throw new Error('Text must be 1–85 characters.');
  const lines=splitText(text.trim(),85);
  const widest=Math.max(1,...lines.map(s=>[...s].length));
  const size=Math.max(30,Math.min(108,850/(widest*0.65),345/lines.length));
  const start=256-(lines.length-1)*size*0.54;
  const tspan=lines.map((line,i)=>'<text x="512" y="'+(start+i*size*1.13)+
    '" font-size="'+size+'" font-weight="900" text-anchor="middle" '+
    'font-family="Arial,Helvetica,sans-serif" stroke="'+palette.stroke+
    '" stroke-width="3" paint-order="stroke" fill="url(#txt)">'+xmlSafe(line)+'</text>').join('');
  const backdrop='<rect width="1024" height="512" rx="24" fill="'+palette.back+'"/>';
  const decor=variant?Array.from({length:20},(_,i)=>{
    const x=(seed+i*173)%1024,y=((seed>>>8)+i*97)%512;
    const r=4+((seed>>>4)+i*13)%34;
    return i%3===0?'<circle cx="'+x+'" cy="'+y+'" r="'+r+
      '" fill="hsl('+((hue+i*19)%360)+',90%,75%)" opacity=".18"/>':
      '<path d="M'+x+' '+y+' l'+(r*2)+' '+(i%2?-r:r)+'" stroke="hsl('+((hue+i*17)%360)+
      ',90%,75%)" stroke-width="'+(1+i%4)+'" opacity=".2"/>';
  }).join(''):'';
  const stars=canonical==='space'||canonical==='snow'?
    Array.from({length:16},(_,i)=>'<circle cx="'+(40+i*61)+'" cy="'+(20+(i*41)%390)+
      '" r="'+(2+i%4)+'" fill="#ffffff" opacity=".6"/>').join(''):'';
  const matrix=canonical==='matrix'?Array.from({length:12},(_,i)=>
    '<text x="'+(10+i*84)+'" y="'+(60+i%3*120)+'" fill="#227d47" opacity=".35" font-size="31">10101</text>').join(''):'';
  // Named material effects: distinct geometry and texture, not just a different hue.
  // SVG primitives are intentionally self-contained for reliable Sharp rendering.
  const is=(pattern)=>pattern.test(style);
  let material='';
  let textLayer=tspan;
  if(is(/game8bit|pixel|8bit/)){
    material='<g opacity=".22" shape-rendering="crispEdges">'+
      Array.from({length:30},(_,i)=>'<rect x="'+(i*73%1024)+'" y="'+(i*109%512)+
      '" width="24" height="24" fill="#ffffff"/>').join('')+'</g>';
    textLayer='<g shape-rendering="crispEdges">'+tspan+'</g>';
  }else if(is(/3dchrome|metallic|steel|silver|golden|metal[gbhrse]|luxury|deluxe/)){
    material='<g opacity=".28">'+Array.from({length:15},(_,i)=>
      '<path d="M0 '+(i*37)+' L1024 '+(i*37-180)+
      '" stroke="#ffffff" stroke-width="2"/>').join('')+'</g>';
    textLayer='<g transform="translate(9,12)" opacity=".85" fill="#101522">'+tspan+
      '</g><g filter="url(#materialShadow)">'+tspan+'</g>';
  }else if(is(/glass|dropwater|water_pipe|underwater/)){
    material='<g opacity=".30">'+Array.from({length:24},(_,i)=>{
      const x=(seed+i*79)%1024,y=((seed>>>7)+i*59)%512;
      return '<circle cx="'+x+'" cy="'+y+'" r="'+(8+i%7*5)+
        '" fill="none" stroke="#d5faff" stroke-width="3"/>';
    }).join('')+'</g>';
    textLayer='<g opacity=".48" transform="translate(0,-6)">'+tspan+'</g>'+tspan;
  }else if(is(/firework|sparkling|glitter|jewelry|shiny/)){
    material='<g stroke="#fff4bc" opacity=".75">'+Array.from({length:18},(_,i)=>{
      const x=(seed+i*89)%1024,y=((seed>>>6)+i*73)%512;
      return '<path d="M'+(x-13)+' '+y+' h26 M'+x+' '+(y-13)+
        ' v26 M'+(x-9)+' '+(y-9)+' l18 18 M'+(x+9)+' '+(y-9)+
        ' l-18 18" stroke-width="2"/>';
    }).join('')+'</g>';
  }else if(is(/papercut|layered|3dbox|embossed/)){
    textLayer='<g transform="translate(16,18)" opacity=".65">'+tspan+
      '</g><g transform="translate(10,12)" opacity=".72">'+tspan+
      '</g><g transform="translate(5,6)" opacity=".85">'+tspan+'</g>'+tspan;
  }else if(is(/sketch|writing|engraved/)){
    material='<g opacity=".15">'+Array.from({length:36},(_,i)=>
      '<path d="M'+(i*37%1024)+' 0 l-180 512" stroke="#ffffff" stroke-width="1"/>'
    ).join('')+'</g>';
    textLayer='<g fill="none" stroke="#ffffff" stroke-dasharray="6 3">'+tspan+'</g>';
  }else if(is(/blood|horror|demon|toxic/)){
    material='<g fill="#a90d2d" opacity=".75">'+Array.from({length:14},(_,i)=>{
      const x=(seed+i*97)%1024,y=(seed>>>4)+i*37;
      return '<path d="M'+x+' 0 v'+(y%160+50)+' q-9 15 0 23 q9-8 0-23Z"/>';
    }).join('')+'</g>';
  }else if(is(/neon|robot|scifi|equalizer|bokeh/)){
    material='<g opacity=".35">'+Array.from({length:24},(_,i)=>{
      const x=i*44;
      return '<rect x="'+x+'" y="'+(410-(i*37%120))+
        '" width="17" height="'+(i*37%120+65)+'" rx="4" fill="#29f6fa"/>';
    }).join('')+'</g>';
  }
  const blur=palette.glow?'<g opacity=".72" filter="url(#blur)">'+tspan+'</g>':'';
  const glitch=canonical==='glitch'?'<g transform="translate(8,-4)" opacity=".5" fill="#f52b6c">'+tspan+'</g>':'';
  return Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="512">'+
    '<defs><filter id="materialShadow"><feDropShadow dx="2" dy="5" stdDeviation="4" flood-opacity=".8"/></filter><linearGradient id="txt" x1="0" x2="1" y1="0" y2="1">'+
    '<stop offset="0%" stop-color="'+palette.from+'"/><stop offset="100%" stop-color="'+
    palette.to+'"/></linearGradient><filter id="blur"><feGaussianBlur stdDeviation="9"/></filter></defs>'+
    backdrop+decor+stars+matrix+material+glitch+blur+textLayer+'</svg>');
}
async function textEffect(style,text){
  nameFor(style);
  const image=await sharp(effectSvg(style,text),{limitInputPixels:1024*512})
    .png({compressionLevel:8}).toBuffer();
  if(image.length>2*1024*1024)throw new Error('Effect output too large.');
  return image;
}
async function handleTextFx(ctx){
  const {cmd,lang,reply,sock,chat,message}=ctx;
  if(!TEXTFX_COMMANDS.has(cmd.name))return false;
  if(cmd.name==='textfx'&&cmd.args[0]==='list'){
    const page=cmd.args[1]===undefined?1:Number(cmd.args[1]);
    const names=Object.keys(LEGACY_STYLES);
    const pages=Math.ceil(names.length/30);
    if(!Number.isInteger(page)||page<1||page>pages){
      await reply('Use textfx list 1-'+pages);return true;
    }
    await reply('✦ Beauté. · TextFX original alternatives ('+page+'/'+pages+')\n'+
      names.slice((page-1)*30,page*30).join(' · ')+
      '\nExample: '+names[(page-1)*30]+' Beauté.');
    return true;
  }
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
module.exports={THEMES,ALIAS,LEGACY_STYLES,TEXTFX_COMMANDS,nameFor,effectSvg,textEffect,handleTextFx};
