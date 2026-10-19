(() => {
 const install=document.getElementById('app-install'),button=document.getElementById('install-app'),help=document.getElementById('install-help'),connection=document.getElementById('connection');
 const standalone=matchMedia('(display-mode: standalone)');let prompt;
 const visibility=()=>{install.hidden=standalone.matches||navigator.standalone===true;};visibility();standalone.addEventListener('change',visibility);
 window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();prompt=event;button.hidden=false;});
 button.addEventListener('click',async()=>{if(!prompt)return;button.disabled=true;try{await prompt.prompt();const result=await prompt.userChoice;if(result.outcome==='accepted')install.hidden=true;}finally{prompt=null;button.hidden=true;button.disabled=false;}});
 window.addEventListener('appinstalled',()=>{prompt=null;install.hidden=true;});
 const online=()=>{connection.hidden=navigator.onLine;};online();window.addEventListener('online',online);window.addEventListener('offline',online);
 if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js',{scope:'./',updateViaCache:'none'}).catch(()=>{help.open=true;});
})();
