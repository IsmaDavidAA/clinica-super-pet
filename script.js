const TZ = "America/La_Paz";

const schedule = {
  0: [],
  1: [[8 * 60 + 30, 12 * 60 + 30], [14 * 60 + 30, 19 * 60]],
  2: [[8 * 60 + 30, 12 * 60 + 30], [14 * 60 + 30, 19 * 60]],
  3: [[8 * 60 + 30, 12 * 60 + 30], [14 * 60 + 30, 19 * 60]],
  4: [[8 * 60 + 30, 12 * 60 + 30], [14 * 60 + 30, 19 * 60]],
  5: [[8 * 60 + 30, 12 * 60 + 30], [14 * 60 + 30, 19 * 60]],
  6: [[9 * 60, 13 * 60 + 30]],
};

const dayNames = [
  "el domingo",
  "el lunes",
  "el martes",
  "el miércoles",
  "el jueves",
  "el viernes",
  "el sábado",
];

const clock = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
};

const nowInLaPaz = () => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const days = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return {
    day: days[value.weekday],
    minutes: Number(value.hour) * 60 + Number(value.minute),
  };
};

const nextOpening = (day) => {
  for (let step = 1; step <= 7; step += 1) {
    const next = (day + step) % 7;
    const blocks = schedule[next];
    if (blocks.length) return { day: next, start: blocks[0][0] };
  }
  return null;
};

const statusFor = ({ day, minutes }) => {
  const blocks = schedule[day];
  const current = blocks.find(([start, end]) => minutes >= start && minutes < end);
  if (current) {
    const later = blocks.find(([start]) => start >= current[1]);
    const extra = later ? ` · vuelve a las ${clock(later[0])}` : "";
    return { open: true, text: `Abierto ahora · hasta las ${clock(current[1])}${extra}` };
  }

  const upcoming = blocks.find(([start]) => minutes < start);
  if (upcoming) {
    const closedForBreak = blocks.some(([, end]) => minutes >= end && minutes < upcoming[0]);
    return {
      open: false,
      text: closedForBreak
        ? `Cerrado por el corte · abre a las ${clock(upcoming[0])}`
        : `Cerrado · abre hoy a las ${clock(upcoming[0])}`,
    };
  }

  const next = nextOpening(day);
  return {
    open: false,
    text: next ? `Cerrado · abre ${dayNames[next.day]} a las ${clock(next.start)}` : "Cerrado",
  };
};

const renderStatus = () => {
  const current = nowInLaPaz();
  if (current.day === undefined || Number.isNaN(current.minutes)) return;
  const status = statusFor(current);
  document.querySelectorAll("[data-status]").forEach((node) => {
    node.textContent = status.text;
    node.dataset.open = status.open ? "true" : "false";
  });
  document.querySelectorAll("[data-day], [data-days]").forEach((row) => {
    const days = (row.dataset.days || row.dataset.day).split(",").map(Number);
    row.classList.toggle("is-today", days.includes(current.day));
  });
};

const setupMenu = () => {
  const toggle = document.querySelector(".nav-toggle");
  const menu = document.querySelector("#menu");
  if (!toggle || !menu) return;

  const close = () => {
    toggle.setAttribute("aria-expanded", "false");
    menu.classList.remove("is-open");
  };

  toggle.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", open ? "false" : "true");
    menu.classList.toggle("is-open", !open);
  });

  menu.querySelectorAll("a").forEach((link) => link.addEventListener("click", close));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") close();
  });
  window.addEventListener("resize", () => {
    if (window.innerWidth > 860) close();
  });
};

const setupHeader = () => {
  const top = document.querySelector(".top");
  const toggle = document.querySelector(".nav-toggle");
  const float = document.querySelector(".call-float");
  const hero = document.querySelector(".hero");
  if (!top) return;
  const sync = () => {
    const menuOpen = toggle?.getAttribute("aria-expanded") === "true";
    top.classList.toggle("is-solid", menuOpen || window.scrollY > 20);
    if (float && hero) {
      float.classList.toggle("is-visible", hero.getBoundingClientRect().bottom < 72);
    }
  };
  sync();
  window.addEventListener("scroll", sync, { passive: true });
  toggle?.addEventListener("click", () => requestAnimationFrame(sync));
};

renderStatus();
setupMenu();
setupHeader();
document.querySelectorAll("[data-year]").forEach((node) => {
  node.textContent = String(new Date().getFullYear());
});
setInterval(renderStatus, 60000);
