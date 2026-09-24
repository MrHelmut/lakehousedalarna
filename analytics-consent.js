/* Lake House Dalarna: basic consent mode. No Google script before opt-in. */
(() => {
  'use strict';
  if (window.lakeConsent) return;
  if (/^\/(?:index\.html|house\.html|booking\.html)?$/.test(location.pathname)) return;
  const ID = 'G-MN82629B7R', KEY = 'lakehouse-consent-v1', AGE = 180 * 86400000;
  const denied = {analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'};
  const words = {
    en: {title:'Your privacy',text:'We use Google Analytics cookies, with your permission, to understand how visitors use our website and help us improve it.',accept:'Accept',decline:'Decline',settings:'Cookie settings',policy:'Privacy & cookies',close:'Close',mapTitle:'Discover Lake Rogsjön',map:'Show map',mapText:'Google receives your IP address and may use cookies when you open the map.',mapOff:'Hide Google map'},
    sv: {title:'Din integritet',text:'Med ditt samtycke använder vi Google Analytics-cookies för att förstå hur besökare använder webbplatsen och förbättra den.',accept:'Acceptera',decline:'Neka',settings:'Cookieinställningar',policy:'Integritet & cookies',close:'Stäng',mapTitle:'Upptäck Rogsjön',map:'Visa karta',mapText:'Google tar emot din IP-adress och kan använda cookies när du öppnar kartan.',mapOff:'Dölj Google-kartan'},
    de: {title:'Ihre Privatsphäre',text:'Mit Ihrer Einwilligung verwenden wir Google-Analytics-Cookies, um zu verstehen, wie Besucher unsere Website nutzen, und sie zu verbessern.',accept:'Akzeptieren',decline:'Ablehnen',settings:'Cookie-Einstellungen',policy:'Datenschutz & Cookies',close:'Schließen',mapTitle:'Entdecken Sie den Rogsjön',map:'Karte anzeigen',mapText:'Beim Öffnen der Karte erhält Google Ihre IP-Adresse und kann Cookies verwenden.',mapOff:'Google-Karte ausblenden'}
  };
  let choice = null, loaded = false, banner, returnFocus;
  const lang = () => words[document.documentElement.lang] ? document.documentElement.lang : 'en';
  const read = () => {try {const v=JSON.parse(localStorage.getItem(KEY)); return v && v.version===1 && ['accepted','declined'].includes(v.choice) && v.time<=Date.now() && Date.now()-v.time<AGE ? v.choice:null;} catch {return null;}};
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function(){window.dataLayer.push(arguments);};
  window['ga-disable-'+ID] = true;
  window.gtag('consent','default',denied);
  function eraseCookies() {
    document.cookie.split(';').forEach(part => {
      const name=part.trim().split('=')[0];
      if (!/^_ga(?:_|$)/.test(name)) return;
      ['',location.hostname,'.'+location.hostname,'.lakehousedalarna.com'].forEach(domain => {
        document.cookie=name+'=; Max-Age=0; path=/; SameSite=Lax'+(domain?'; domain='+domain:'');
      });
    });
  }
  function start() {
    if (choice!=='accepted') return;
    window['ga-disable-'+ID]=false;
    window.gtag('consent','update',{...denied,analytics_storage:'granted'});
    if (loaded) return;
    loaded=true;
    // Drop arbitrary queries and fragments, including contact/form content.
    let referrer='';
    try {referrer=new URL(document.referrer).origin+'/';} catch {}
    window.gtag('js',new Date());
    const query=new URLSearchParams(location.search), campaign={};
    const source=query.get('utm_source'), medium=query.get('utm_medium');
    if(['google','bing','instagram','facebook','newsletter'].includes(source))campaign.campaign_source=source;
    if(['organic','social','paid_social','cpc','email','referral'].includes(medium))campaign.campaign_medium=medium;
    window.gtag('config',ID,{
      send_page_view:true,page_location:location.origin+location.pathname,page_referrer:referrer,
      ...campaign,site_language:lang(),allow_google_signals:false,allow_ad_personalization_signals:false,
      cookie_expires:AGE/1000,cookie_update:false,cookie_flags:'SameSite=Lax;Secure'
    });
    const tag=document.createElement('script');tag.async=true;tag.src='https://www.googletagmanager.com/gtag/js?id='+ID;
    tag.id='lakehouse-ga';document.head.appendChild(tag);
  }
  function apply(next, persist=true) {
    choice=next;
    if (persist) {try {localStorage.setItem(KEY,JSON.stringify({version:1,choice:next,time:Date.now()}));} catch {}}
    if(next==='accepted') start();
    else {window['ga-disable-'+ID]=true;window.gtag('consent','update',denied);eraseCookies();}
    if(banner) banner.hidden=true;
    if(returnFocus) {returnFocus.focus();returnFocus=null;}
  }
  function show(focus=false) {
    render();banner.hidden=false;
    if(focus) {returnFocus=document.activeElement;banner.querySelector('button').focus();}
  }
  function render() {
    if(!banner)return;
    const w=words[lang()];
    banner.setAttribute('aria-label',w.settings);
    banner.innerHTML='<div><strong>'+w.title+'</strong><p>'+w.text+' <a href="/privacy/'+lang()+'.html">'+w.policy+'</a>.</p></div><div class="consent-actions"><button type="button" data-choice="accepted">'+w.accept+'</button><button type="button" data-choice="declined">'+w.decline+'</button>'+(choice?'<button type="button" data-consent-close>'+w.close+'</button>':'')+'</div>';
    document.querySelectorAll('[data-cookie-settings]').forEach(b=>b.textContent=w.settings);
    document.querySelectorAll('[data-privacy-link]').forEach(a=>{a.textContent=w.policy;a.href='/privacy/'+lang()+'.html';});
  }
  function track(event,params) {
    if(read()!==choice)apply(read(),false);
    if(choice!=='accepted')return;
    window.gtag('event',event,{send_to:ID,site_language:lang(),...params});
  }
  function init() {
    banner=document.createElement('section');banner.className='cookie-banner';banner.hidden=true;
    // In normal flow: never covers photography, navigation or booking controls.
    document.body.prepend(banner);
    const offsetNav=()=>document.documentElement.style.setProperty('--consent-nav-offset',Math.max(0,banner.getBoundingClientRect().bottom)+'px');
    new ResizeObserver(offsetNav).observe(banner);
    window.addEventListener('scroll',offsetNav,{passive:true});
    const footer=document.querySelector('footer .footer-links')||document.querySelector('footer');
    if(footer){
      const settings=document.createElement('button');settings.type='button';settings.dataset.cookieSettings='';footer.append(settings);
      const policy=document.createElement('a');policy.dataset.privacyLink='';footer.append(policy);
    }
    choice=read();render();
    if(choice==='accepted')start();else {eraseCookies();if(!choice)show();}
    document.addEventListener('click',e=>{
      const target=e.target.closest('button,a');if(!target)return;
      if(target.hasAttribute('data-cookie-settings')){show(true);banner.scrollIntoView({block:'start'});return;}
      if(target.dataset.choice){apply(target.dataset.choice);return;}
      if(target.hasAttribute('data-consent-close')){banner.hidden=true;if(returnFocus)returnFocus.focus();return;}
      if(target.tagName!=='A')return;
      const u=new URL(target.href,location.href);let event,kind;
      if(/(^|\.)airbnb\.(com|se|de|nl|at|ch|co\.uk)$/.test(u.hostname)){event='airbnb_click';kind='airbnb';}
      else if(u.hostname==='wa.me'||u.hostname==='api.whatsapp.com'){event='click_whatsapp';kind='whatsapp';}
      else if(['mailto:','tel:'].includes(u.protocol)){event='contact_click';kind=u.protocol==='mailto:'?'email':'phone';}
      else if(u.origin===location.origin && /^\/(en\/booking\/|sv\/boka\/|de\/buchen\/|booking\.html)$/.test(u.pathname)){event='booking_click';kind='booking';}
      if(event==='booking_click')track('click_check_availability',{destination:'booking'});
      if(event==='airbnb_click')track('click_airbnb',{destination:'airbnb'});
      if(event)track(event,{destination:kind,placement:target.closest('footer')?'footer':target.closest('nav')?'navigation':target.classList.contains('whatsapp-float')?'floating':'content'});
    });
    window.addEventListener('storage',e=>{if(e.key===KEY){apply(read(),false);if(!choice)show();}});
    window.addEventListener('site-language-change',render);
    window.addEventListener('lakehouse-booking-start',()=>track('start_booking_request',{placement:'booking_form'}));
    window.addEventListener('lakehouse-booking-received',()=>track('submit_booking_request',{placement:'booking_form',delivery_method:'web3forms',delivery_status:'received'}));
    window.addEventListener('lakehouse-booking-submit',()=>track('booking_request_email_handoff',{placement:'booking_form',delivery_method:'email_app',delivery_status:'handoff'}));
    window.addEventListener('lakehouse-contact-intent',()=>track('contact_click',{destination:'email',placement:'booking_form'}));
    window.addEventListener('pageshow',()=>{if(read()!==choice){apply(read(),false);if(!choice)show();}});
  }
  window.lakeConsent={open:()=>show(true)};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
