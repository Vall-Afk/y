'use strict';
const fs=require('node:fs/promises');
const crypto=require('node:crypto');

function readHidden(label){
  return new Promise((resolve,reject)=>{
    const input=process.stdin,output=process.stdout;
    output.write(label);
    if(!input.isTTY||typeof input.setRawMode!=='function'){
      reject(new Error('Jalankan setup dari terminal interaktif agar password tidak ditampilkan.'));
      return;
    }
    let value='';
    const finish=(err)=>{
      input.removeListener('data',onData);
      try{input.setRawMode(false);}catch{}
      input.pause();
      output.write('\n');
      err?reject(err):resolve(value);
    };
    const onData=chunk=>{
      for(const ch of chunk.toString('utf8')){
        if(ch==='\u0003'){finish(new Error('Cancelled.'));return;}
        if(ch==='\r'||ch==='\n'){finish();return;}
        if(ch==='\u0008'||ch==='\u007f'){value=value.slice(0,-1);continue;}
        if(ch>=' '&&value.length<256)value+=ch;
      }
    };
    try{input.setRawMode(true);input.resume();input.on('data',onData);}catch(err){reject(err);}
  });
}
async function main(){
  const envPath='.env';
  let body;
  try{body=await fs.readFile(envPath,'utf8');}
  catch(err){if(err.code==='ENOENT')throw Error('File .env tidak ditemukan. Salin .env.example menjadi .env terlebih dahulu.');throw err;}
  const password=await readHidden('Buat password dashboard (minimal 16 karakter): ');
  if(password.length<16)throw Error('Password minimal 16 karakter.');
  const confirm=await readHidden('Ulangi password: ');
  if(password!==confirm)throw Error('Password tidak cocok.');
  const salt=crypto.randomBytes(16).toString('hex');
  const hash=crypto.scryptSync(password,Buffer.from(salt,'hex'),64,{N:16384,r:8,p:1,maxmem:64*1024*1024}).toString('hex');
  const secret=crypto.randomBytes(48).toString('base64url');
  const values={DASHBOARD_PASSWORD_HASH:'scrypt$'+salt+'$'+hash,DASHBOARD_SESSION_SECRET:secret};
  for(const [key,value] of Object.entries(values)){
    const line=key+'='+value;
    const re=new RegExp('^'+key+'=.*$','m');
    body=re.test(body)?body.replace(re,line):body.replace(/\s*$/,'')+'\n'+line+'\n';
  }
  const temp=envPath+'.'+crypto.randomUUID()+'.tmp';
  try{
    await fs.writeFile(temp,body,{encoding:'utf8',flag:'wx',mode:0o600});
    await fs.rename(temp,envPath);
    try{await fs.chmod(envPath,0o600);}catch{}
  }finally{await fs.rm(temp,{force:true}).catch(()=>{});}
  console.log('Dashboard credentials saved to .env. Password hash and session secret were not printed.');
  console.log('Restart Beauté with: npm start');
}
main().catch(err=>{console.error('Dashboard setup failed:',err.message);process.exitCode=1;});
