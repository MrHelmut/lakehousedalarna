// Disable a campaign with data-campaign-enabled="false"; it also expires automatically.
function updateSeason(summer) {
 const hero=document.querySelector('.hero');
 if(!hero)return;
 hero.classList.toggle('summer-hero',summer);
 document.querySelectorAll('.winter-only').forEach(el=>{
  const expired=el.dataset.campaignEnd && new Date()>=new Date(el.dataset.campaignEnd+'T00:00:00+01:00');
  el.hidden=summer || el.dataset.campaignEnabled==='false' || Boolean(expired);
 });
 document.querySelectorAll('.summer-only').forEach(el=>el.hidden=!summer);
 document.querySelectorAll('[data-season]').forEach(el=>el.setAttribute('aria-pressed',String((el.dataset.season==='summer')===summer)));
 const winter=document.getElementById('winter');if(winter)winter.hidden=summer;
}
document.querySelectorAll('[data-season]').forEach(button=>button.addEventListener('click',()=>updateSeason(button.dataset.season==='summer')));
updateSeason(false);
