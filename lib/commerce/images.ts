import sharp from "sharp";

export async function createCommerceWebp(input:Buffer){
  const image=sharp(input,{failOn:"warning"}).rotate(); const meta=await image.metadata();
  const size=Math.max(meta.width??1200,meta.height??1200,1200);
  return image.resize({width:Math.min(size,1800),height:Math.min(size,1800),fit:"contain",background:"#ffffff",withoutEnlargement:false})
    .flatten({background:"#ffffff"}).webp({quality:86,effort:5}).toBuffer();
}
