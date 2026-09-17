document.addEventListener('DOMContentLoaded',()=>{
 const dialog=document.createElement('dialog');dialog.className='house-photo-dialog';
 const close=document.createElement('button');close.type='button';close.textContent='×';
 const labels={sv:'Stäng bild',en:'Close image',de:'Bild schließen'};
 const img=document.createElement('img');dialog.append(close,img);document.body.append(dialog);
 let opener;
 const dismiss=()=>{dialog.close();opener?.focus();};
 close.addEventListener('click',dismiss);
 dialog.addEventListener('click',e=>{if(e.target===dialog)dismiss();});
 dialog.addEventListener('close',()=>opener?.focus());
 document.querySelectorAll('.space-images img').forEach(photo=>{
  const button=document.createElement('button');button.type='button';button.className='house-photo-open';
  photo.replaceWith(button);button.append(photo);
  button.addEventListener('click',()=>{opener=button;close.setAttribute('aria-label',labels[document.documentElement.lang]||labels.en);img.src=photo.dataset.full||photo.src;img.alt=photo.alt;dialog.showModal();});
 });
});
