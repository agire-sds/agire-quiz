import type {SupabaseClient} from '@supabase/supabase-js';

async function optimizeImage(file:File):Promise<File>{
  if(!/^image\/(jpeg|png|webp)$/.test(file.type))return file;
  let bitmap:ImageBitmap;
  try{bitmap=await createImageBitmap(file)}catch{return file}
  try{
    const scale=Math.min(1,2560/Math.max(bitmap.width,bitmap.height));
    const canvas=document.createElement('canvas');
    canvas.width=Math.max(1,Math.round(bitmap.width*scale));
    canvas.height=Math.max(1,Math.round(bitmap.height*scale));
    const context=canvas.getContext('2d');
    if(!context)return file;
    context.imageSmoothingEnabled=true;
    context.imageSmoothingQuality='high';
    context.drawImage(bitmap,0,0,canvas.width,canvas.height);
    const blob=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,'image/webp',0.92));
    if(!blob||blob.type!=='image/webp'||blob.size>=file.size*0.85)return file;
    return new File([blob],file.name.replace(/\.[^.]+$/,'')+'.webp',{type:'image/webp'});
  }finally{bitmap.close()}
}

export async function uploadQuizMedia(db:SupabaseClient,file:File):Promise<string>{
  const ready=await optimizeImage(file);
  const name=ready.name.replace(/[^a-zA-Z0-9._-]/g,'_');
  const path=`${crypto.randomUUID()}/${name}`;
  const {error}=await db.storage.from('road-media').upload(path,ready,{contentType:ready.type});
  if(error)throw error;
  return db.storage.from('road-media').getPublicUrl(path).data.publicUrl;
}
