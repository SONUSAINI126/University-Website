const iconPaths={
  map:'<path d="m3 5 6-2 6 3 6-2v15l-6 2-6-3-6 2zM9 3v15m6-12v15"/>',
  people:'<circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2M16 5a3 3 0 0 1 0 6m1 3a5 5 0 0 1 4 5"/>',
  book:'<path d="M12 6C9 4 5 4 2 5v14c4-1 7-1 10 1 3-2 6-2 10-1V5c-3-1-7-1-10 1Zm0 0v14"/>',
  pin:'<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
  cube:'<path d="m12 2 9 5v10l-9 5-9-5V7ZM3 7l9 5 9-5m-9 5v10"/>',
  layers:'<path d="m12 3 10 6-10 6L2 9Zm-9 11 9 5 9-5M3 18l9 5 9-5"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',minus:'<path d="M5 12h14"/>',
  focus:'<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/><circle cx="12" cy="12" r="3"/>',
  sunset:'<path d="M3 17h18M5 21h14M7 17a5 5 0 0 1 10 0M12 3v4m-8 1 3 3m13-3-3 3M2 14h2m16 0h2"/>',
  sliders:'<path d="M4 6h5m4 0h7M4 12h10m4 0h2M4 18h2m4 0h10"/><circle cx="11" cy="6" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="8" cy="18" r="2"/>',
  search:'<circle cx="10" cy="10" r="6.5"/><path d="m15 15 6 6"/>',route:'<circle cx="5" cy="17" r="2.5"/><circle cx="19" cy="6" r="2.5"/><path d="M8 17h6a3 3 0 0 0 0-6h-4a2.5 2.5 0 0 1 0-5h6"/>',
  academic:'<path d="m2 8 10-5 10 5-10 5Zm4 3v5q6 5 12 0v-5m4-3v8"/>',
  hostel:'<path d="M3 20V6m0 9h18v5M3 11h5v4m0-5h10a3 3 0 0 1 3 3v2"/>',
  landmark:'<path d="m3 8 9-5 9 5ZM3 21h18M5 18V10m5 8v-8m5 8v-8m4 8v-8"/>',
  sport:'<circle cx="12" cy="12" r="9"/><path d="m12 8 4 3-2 5h-4l-2-5Zm0 0V3m4 8 5-2m-7 7 3 4m-7-4-3 4m1-9L3 9"/>',
  service:'<path d="m3 9 2-5h14l2 5q-1 5-5 2-4 3-8 0-4 3-5-2Zm1 4v7h16v-7m-11 7v-5h5v5"/>',
  tree:'<path d="m12 2 6 8h-3l5 7H4l5-7H6Zm0 15v5"/>',
  chev:'<path d="m9 5 7 7-7 7"/>',back:'<path d="m15 5-7 7 7 7"/>',x:'<path d="m6 6 12 12M18 6 6 18"/>',
  phone:'<path d="m5 3 4 1 1 4-2 2a13 13 0 0 0 6 6l2-2 4 1 1 4c-2 6-16-1-18-12 0-2 1-3 2-4Z"/>',
  mail:'<rect x="2" y="4" width="20" height="16" rx="3"/><path d="m3 6 9 7 9-7"/>',swap:'<path d="M7 20V4m-4 4 4-4 4 4m6-4v16m-4-4 4 4 4-4"/>',
  link:'<path d="M9 15l6-6m-2-3 2-2a4 4 0 0 1 6 6l-3 3m-7 5-2 2a4 4 0 0 1-6-6l3-3"/>',walk:'<circle cx="14" cy="4" r="2"/><path d="m6 13 4-4 4-1 2 4 4 2m-7-5-2 6 5 6m-5-6-4 6"/>'
};
function icon(name){return '<i data-i="'+name+'" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">'+(iconPaths[name]||iconPaths.pin)+'</svg></i>'}
document.querySelectorAll('i[data-i]').forEach(el=>el.outerHTML=icon(el.dataset.i));
