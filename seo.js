// Keep canonical and sharing URLs aligned with the rendered language.
function updateSeo(language){
 const route=location.pathname.endsWith('house.html')?'/house.html':location.pathname.endsWith('booking.html')?'/booking.html':'/';
 const url='https://lakehousedalarna.com'+route+(language==='en'?'':'?lang='+language);
 document.querySelector('link[rel="canonical"]').href=url;
 document.querySelector('meta[property="og:url"]').content=url;
 let locale=document.querySelector('meta[property="og:locale"]');
 if(!locale){locale=document.createElement('meta');locale.setAttribute('property','og:locale');document.head.append(locale);}
 locale.content={en:'en_GB',sv:'sv_SE',de:'de_DE'}[language]||'en_GB';
}
window.addEventListener('site-language-change',event=>updateSeo(event.detail.language));
document.addEventListener('DOMContentLoaded',()=>updateSeo(document.documentElement.lang||'en'));
