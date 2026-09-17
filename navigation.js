document.addEventListener('DOMContentLoaded',()=>{const nav=document.querySelector('.navbar'),links=nav?.querySelector('.mobile-quick-nav'),languages=nav?.querySelector('.language-switcher');if(links&&languages)nav.insertBefore(languages,links);});

document.addEventListener('DOMContentLoaded',()=>{const nav=document.querySelector('.navbar');if(!nav)return;const update=()=>document.documentElement.style.setProperty('--mobile-nav-height',nav.offsetHeight+'px');new ResizeObserver(update).observe(nav);update();});
