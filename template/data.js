/* THE ONLY FILE YOU NEED TO OPEN to change the content.
   Figures, running order, speaker notes, pacing. */

/* 'presenter' : you click through, each step reveals one element.
   'auto'      : everything runs on a clock, for a screen with nobody
                 in front of it. */
var MODE = 'presenter';

/* Multiplies every duration and delay. 1.3 slows everything by 30 %. */
var TEMPO = 1;

/* Open the speaker notes on load. Useful when rehearsing. */
var NOTES_AT_START = false;

/* Target length in minutes. Drives the timer, nothing else. */
var TARGET_MINUTES = 40;

/* The figures. One place, so nothing can drift apart. */
var DATA = {
  market: { share: 96, base: 400 },
  curve:  { series: [232, 268, 285, 321, 359, 402, 470, 538, 617, 708,
                     795, 848, 905, 991, 1078, 1154, 1230], start: 2009 },
  clients: { total: 12480, weekly: 540 }
};

/* The running order. This order is the order of the talk.
     id        matches the <section> in index.html
     title     what the contents panel shows
     chapter   groups slides in the contents panel, optional
     steps     one delay in ms per step, used in auto mode; its length
               is the number of clicks in presenter mode
     seconds   time on screen in auto mode
     notes     what the speaker says */
var SLIDES = [
  { id: 'opening', title: 'Opening', chapter: 'Introduction',
    steps: [400], seconds: 8,
    notes: 'State the subject in one sentence. Do not read the title out loud.' },

  { id: 'market', title: 'The market', chapter: 'Introduction',
    steps: [600, 2000, 3400], seconds: 18,
    notes: 'The 96 % is the number that matters. Let the grid fill before you speak.\n'
         + 'Usual question: where is this from? Answer: national register, December.' },

  { id: 'growth', title: 'The growth', chapter: 'The case',
    steps: [400, 2600], seconds: 16,
    notes: 'Let the curve draw itself before you talk. The point is the slope,\n'
         + 'not the level. Source: national register, annual series.' },

  { id: 'result', title: 'The result', chapter: 'The case',
    steps: [300, 2400], seconds: 14,
    notes: 'Say the number before the counter finishes, or the room just waits for it.' },

  { id: 'closing', title: 'Closing', chapter: 'Closing',
    steps: [400, 1400], seconds: 10,
    notes: 'Two sentences, then stop talking and let the first question come.' }
];
