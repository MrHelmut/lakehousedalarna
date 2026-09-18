// Legacy entry points forward to stable static language URLs; static pages never change canonical.
(() => {
 const routes={en:['/en/','/en/house/','/en/booking/'],sv:['/sv/','/sv/huset/','/sv/boka/'],de:['/de/','/de/ferienhaus/','/de/buchen/']};
 if(document.documentElement.dataset.staticLanguage)return;
 const source=['/','/index.html','/house.html','/booking.html'].indexOf(location.pathname);
 if(source<0)return;
 const params=new URLSearchParams(location.search), requested=params.get('lang');
 const lang=routes[requested]?requested:'en';
 params.delete('lang');const query=params.toString();
 location.replace(routes[lang][source<2?0:source-1]+(query?'?'+query:'')+location.hash);
})();
