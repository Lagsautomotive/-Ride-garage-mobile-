import { mkdir, writeFile, rm } from 'node:fs/promises';
import { join, dirname } from 'node:path';
const root = 'https://raw.githubusercontent.com/Lagsautomotive/Ride-garage/main/';
const api = 'https://api.github.com/repos/Lagsautomotive/Ride-garage/git/trees/main?recursive=1';
const result = await fetch(api, { headers: { 'User-Agent': 'RideGarageCloudBuild' }});
if (!result.ok) throw new Error('Cannot get Ride Garage files: '+result.status);
const tree = (await result.json()).tree;
const allowed = /\.(html|js|css|json|webmanifest|png|jpg|jpeg|webp|svg|ico|woff2?|txt)$/i;
const files=tree.filter(x=>x.type==='blob' && allowed.test(x.path) && !x.path.startsWith('.'));
if(!files.some(x=>x.path==='index.html')) throw new Error('Missing index.html');
await rm('www',{recursive:true,force:true});
for(const file of files){
  const response=await fetch(root+file.path);
  if(!response.ok) throw new Error('Download failed: '+file.path);
  await mkdir(dirname(join('www',file.path)),{recursive:true});
  let bytes=Buffer.from(await response.arrayBuffer());
  if(file.path==='index.html'){
    let html=bytes.toString('utf8');
    html=html.replace(/<script>if\('serviceWorker' in navigator\).*?<\/script>/s,'');
    bytes=Buffer.from(html);
  }
  await writeFile(join('www',file.path),bytes);
}
console.log('Prepared '+files.length+' web files');
