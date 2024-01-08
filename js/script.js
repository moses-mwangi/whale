"use strict";

///////////////////////////////////////
// Modal window

const scrollTo = document.querySelector(".btn--scroll-to");
const section1 = document.querySelector("#section--1");

const navLogo = document.querySelector(".nav_logo");

const modal = document.querySelector(".modal");
const overlay = document.querySelector(".overlay");
const btnCloseModal = document.querySelector(".btn--close-modal");
const btnsOpenModal = document.querySelectorAll(".btn--show-modal");

const openModal = function (e) {
  e.preventDefault();
  modal.classList.remove("hidden");
  overlay.classList.remove("hidden");
};

const closeModal = function () {
  modal.classList.add("hidden");
  overlay.classList.add("hidden");
};

btnsOpenModal.forEach((btn) => btn.addEventListener("click", openModal));

btnCloseModal.addEventListener("click", closeModal);
overlay.addEventListener("click", closeModal);

document.addEventListener("keydown", function (e) {
  if (e.key === "Escape" && !modal.classList.contains("hidden")) {
    closeModal();
  }
});

//////////////////   button scroll  ////////////////////////////////////////
scrollTo.addEventListener("click", function (e) {
  const s1coord = section1.getBoundingClientRect();
  console.log(s1coord);
  console.log("current scroll (x/y)", window.pageXOffset, pageYOffset);

  //   window.scrollTo(
  //     s1coord.left + window.pageXOffset,
  //     s1coord.top + window.pageYOffset
  //   );

  //   window.scrollTo({
  //     left: s1coord.left + window.pageXOffset,
  //     top: s1coord.top + window.pageYOffset,
  //     behavior: "smooth",
  //   });
  section1.scrollIntoView({ behavior: "smooth" });
});

//////////////////////////page navigation///////////////////////
document.querySelectorAll(".nav__link").forEach((el) =>
  el.addEventListener("click", function (e) {
    e.preventDefault();
    const id = this.getAttribute("href");
    document.querySelector(id).scrollIntoView({ behavior: "smooth" });
  })
);

/////////////////////////////////selecting element////////////////////
/*
console.log(document.documentElement);
console.log(document.head);
console.log(document.body);

const header = document.querySelector(".header");
const allSection = document.querySelectorAll(".section");
console.log(allSection);

const allb = document.getElementsByTagName("p");
const ty = document.getElementsByClassName("btn");
console.log(allb);
*/
//////////////////////////////// ceate and inserting element /////////////////////
/*
// const para = document.createElement("p");
// para.classList.add("cookie-message");
// const node = document.createTextNode("This is new.<p class=btn >got it</p>");
// para.appendChild(node);
// header.prepend(para);

const message = document.createElement("div");
message.classList.add("cookie-message");
// message.textContent = "we use cookie for improved functionality and anlytical";
message.innerHTML =
  "we use cookie for improved functionality and anlytical <p class=btn >got it</p>";
// header.prepend(message);
header.append(message);
// header.append(message.cloneNode(true));
// header.before(message);
// header.before(message);
*/
//////////////////////////////////////////// delete ///////////////////////////////////////
// document.querySelector(".btn").addEventListener("click", function () {
//   message.remove();
// });

////////////////////////////////styling//////////////////////
/*
message.style.backgroundColor = "#345678";
message.style.width = "120%";
console.log(getComputedStyle(message).height);
message.style.height =
  Number.parseFloat(getComputedStyle(message).height, 10) + 30 + "px";

document.documentElement.style.setProperty("--color-primary", "blue");

const logo = document.querySelector(".nav__logo");
logo.setAttribute("company", "bankist");
// console.log(logo.getAttribute("designer"));

logo.alt = "hahahahahah";
console.log(logo.alt);
console.log(logo.className);
console.log(logo.src);
console.log(logo.getAttribute("src"));

////data atribute/////////////////////

console.log(logo.dataset.versionNumber);*/

/////////////////////// smoth scroll ////////////////////

////////////////// event ////////////////////
const h1 = document.querySelector("h1");
const HH1 = function () {
  alert("helo love");
};
h1.addEventListener("mouseenter", HH1);
setTimeout(() => h1.removeEventListener("mouseenter", HH1), 1000);

const randomInt = (max, min) =>
  Math.floor(Math.random() * (max - min + 1) + min);
const randomColor = () =>
  `rgba(${randomInt(0, 255)},${randomInt(0, 255)},${randomInt(0, 255)})`;

const link = document.querySelector(".nav__link");

document.querySelector(".nav__link").addEventListener("click", function (e) {
  this.style.backgroundColor = randomColor();
  console.log("link", e.target);
});

document.querySelector(".nav__links").addEventListener("click", function (e) {
  this.style.backgroundColor = randomColor();
  console.log("nav", e.target);
});

document.querySelector(".nav").addEventListener("click", function (e) {
  this.style.backgroundColor = randomColor();
  console.log("conta", e.target, e.currentTarget);
});
