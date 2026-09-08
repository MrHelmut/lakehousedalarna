/* ==========================================================
   LAKE HOUSE DALARNA PREMIUM V2
========================================================== */

const navbar = document.querySelector(".navbar");

window.addEventListener("scroll", () => {

    if (!navbar) return;

    if (window.scrollY > 80) {
        navbar.classList.add("scrolled");
    } else {
        navbar.classList.remove("scrolled");
    }

});
/* ==========================================================
   FADE UP
========================================================== */

if ("IntersectionObserver" in window) {

const observer = new IntersectionObserver((entries) => {

    entries.forEach(entry => {

        if (entry.isIntersecting) {

            entry.target.classList.add("show");

        }

    });

},{
    threshold:.15
});

document.querySelectorAll("section").forEach(section=>{

    section.classList.add("fade-up");

    observer.observe(section);

});

} else {

document.documentElement.classList.add("no-scroll-reveal");

}

const hero = document.querySelector(".hero");

/* ==========================================================
   GALLERY LIGHTBOX
========================================================== */

const images=document.querySelectorAll(".gallery-grid img");

if (images.length) {

const lightbox=document.createElement("div");

lightbox.id="lightbox";

document.body.appendChild(lightbox);

const lightboxImage=document.createElement("img");

lightboxImage.alt="";

images.forEach(image=>{

    image.addEventListener("click",()=>{

        lightbox.classList.add("active");

        lightboxImage.src=image.src;

        if (!lightboxImage.parentElement) {
            lightbox.appendChild(lightboxImage);
        }

    });

});

lightbox.addEventListener("click",()=>{

    lightbox.classList.remove("active");

});

}

/* ==========================================================
   ACTIVE MENU
========================================================== */

const sections=document.querySelectorAll("section");

const menuLinks=document.querySelectorAll(".menu a");

window.addEventListener("scroll",()=>{

    let current="";

    sections.forEach(section=>{

        const top=section.offsetTop-120;

        const height=section.clientHeight;

        if(pageYOffset>=top){

            current=section.getAttribute("id");

        }

    });

    menuLinks.forEach(link=>{

        link.classList.remove("active");

        if(link.getAttribute("href")==="#"+current){

            link.classList.add("active");

        }

    });

});

/* ==========================================================
   SMOOTH HOVER
========================================================== */

document.querySelectorAll(".feature-card,.explore-card,.social-card")
.forEach(card=>{

card.addEventListener("mousemove",(e)=>{

const rect=card.getBoundingClientRect();

const x=e.clientX-rect.left;

const y=e.clientY-rect.top;

card.style.background=
`radial-gradient(circle at ${x}px ${y}px,
rgba(197,164,109,.18),
white 70%)`;

});

card.addEventListener("mouseleave",()=>{

card.style.background="white";

});

});

/* ==========================================================
   HERO FADE
========================================================== */

window.addEventListener("load",()=>{

const heroContent = document.querySelector(".hero-content");

if (!heroContent || typeof heroContent.animate !== "function") return;

heroContent.animate(

[
{
opacity:0,
transform:"translateY(50px)"
},
{
opacity:1,
transform:"translateY(0)"
}
],

{
duration:1400,
fill:"forwards"
}

);

});
