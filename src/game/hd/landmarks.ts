// Landmarks seen from far off, on the hills beside the road: the great seated Buddhas of Diskit and Shey, and Thiksey's tiered monastery.
import { at, box, circle, hgrad, hill, oval, poly, rrect, stroke } from './draw';
import { flagString } from './flags';

/** A seated Buddha on a lotus plinth on a hill. `v` 0 is the pale, gold-faced Maitreya of Diskit; 1 the gilded Buddha of Shey. */
export function drawBuddha(sx: number, sy: number, k: number, v = 0) {
  if (k < 0.05) return;
  const robe = v ? '#e3b23c' : '#efe2c0', robeLit = v ? '#f6d068' : '#faf0d4', robeShade = v ? '#b98a22' : '#c9b990', face = v ? '#f2c94c' : '#e8c060';
  at(sx, sy, k, () => {
    hill(200, 96, '#a58060', '#c49a78', '#7a563e');
    box(-58, -112, 116, 16, '#d8d0bc'); box(-48, -128, 96, 16, '#efe6d2'); box(-58, -100, 116, 3, '#b8342b');           // the stepped plinth
    for (let i = -3; i <= 3; i++) poly([i * 15 - 8, -128, i * 15 + 8, -128, i * 15, -142], i % 2 ? '#f0b8c0' : '#f6d0d4');   // lotus petals round the seat
    poly([-42, -140, -34, -196, -16, -238, 16, -238, 34, -196, 42, -140], hgrad(-42, 42, [[0, robeShade], [0.4, robe], [0.72, robeLit], [1, robe]]));   // the body
    oval(0, -150, 46, 14, robeShade); oval(0, -153, 40, 10, robe);                                                            // crossed legs
    poly([-4, -236, 26, -216, 20, -160, -6, -170], '#b8342b'); poly([-4, -236, 8, -226, 4, -168, -6, -170], '#8a1f2a');      // the red sash over one shoulder
    stroke([-36, -190, -44, -160], robe, 10); stroke([36, -190, 44, -160], robe, 10);                                         // arms resting on the knees
    circle(0, -252, 16, face); circle(0, -270, 9, v ? '#2a4a8a' : '#2c5aa0'); circle(0, -282, 3.4, '#f4c95a');               // head, blue hair, the crown jewel
    circle(-5, -252, 1.3, '#3a2a22'); circle(5, -252, 1.3, '#3a2a22'); stroke([-3, -245, 3, -245], '#b8342b', 1.2);
    circle(0, -252, 34, 'rgba(255,230,160,0.16)');                                                                            // a soft halo
  });
}

/** Thiksey: a monastery stacked up its hill like a palace, whitewashed tiers with red bands, gold roofs and flags. */
export function drawMonastery(sx: number, sy: number, k: number) {
  if (k < 0.05) return;
  at(sx, sy, k, () => {
    hill(250, 150, '#a97b56', '#c99a70', '#7d573c');
    const tiers: [number, number, number, string][] = [[-118, -128, 236, '#efe6d2'], [-98, -156, 196, '#f6eedc'], [-76, -184, 152, '#efe6d2'], [-54, -212, 108, '#f6eedc'], [-32, -240, 64, '#efe6d2']];
    tiers.forEach(([x, y, w, col], t) => {
      box(x, y, w, 28, col); box(x + w * 0.62, y, w * 0.38, 28, 'rgba(60,36,20,0.1)'); box(x, y + 24, w, 5, '#b8342b');
      const n = Math.floor(w / 22);
      for (let i = 0; i < n; i++) box(x + 10 + i * (w - 20) / n, y + 6, 8, 11, '#3a2a22');
    });
    box(-46, -268, 92, 28, '#b8342b'); box(-46, -244, 92, 4, '#e8b923');                                                   // the red assembly hall at the top
    poly([-52, -268, 0, -296, 52, -268], '#d9a441'); poly([0, -296, 52, -268, 20, -268], '#f0c25a');
    for (const x of [-30, 30]) { box(x - 2, -286, 4, 14, '#d9a441'); circle(x, -290, 4, '#f4c95a'); }
    rrect(-16, -238, 32, 26, 2, '#7a2a20');                                                                                // the great door
    stroke([-52, -268, -150, -130], '#3a3028', 1.5); stroke([52, -268, 150, -130], '#3a3028', 1.5);
    flagString(-52, -268, -150, -130, 11, 1, 0.03); flagString(52, -268, 150, -130, 11, 3, 0.03);
  });
}

/** A gurdwara by the highway: a white hall with a gold dome and a tall saffron Nishan Sahib flag. */
export function drawGurdwara(sx: number, sy: number, k: number) {
  if (k < 0.16) return;
  at(sx, sy, k, () => {
    oval(0, 0, 76, 8, 'rgba(40,24,10,0.22)');
    box(-62, -50, 124, 50, '#f6f2e8'); box(28, -50, 34, 50, 'rgba(60,36,20,0.12)'); box(-66, -56, 132, 8, '#e0d8c4');
    for (const x of [-46, -22, 2, 26, 46]) { rrect(x - 5, -38, 11, 26, 4, '#3a4a58'); }
    box(-30, -80, 60, 26, '#f6f2e8'); box(-34, -84, 68, 6, '#e0d8c4');                                        // the upper hall
    oval(0, -98, 24, 20, hgrad(-24, 24, [[0, '#b8862a'], [0.5, '#f4c95a'], [1, '#c99a30']]));                  // the gold dome
    box(-2, -122, 4, 12, '#d9a441'); circle(0, -124, 3, '#f4c95a');
    for (const x of [-56, 56]) { box(x - 5, -78, 10, 28, '#f6f2e8'); poly([x - 6, -78, x, -90, x + 6, -78], '#f4c95a'); }   // corner kiosks
    const t = performance.now() / 1000;
    box(84, -150, 3.4, 150, '#f0ebe0'); circle(85.7, -152, 3, '#f4c95a');                                      // the flagpole
    poly([87, -146, 116 + Math.sin(t * 3) * 3, -140, 116 + Math.sin(t * 3 + 1) * 3, -124, 87, -120], '#e8891a');  // Nishan Sahib, saffron and rippling
    poly([87, -146, 100, -144, 100, -122, 87, -120], 'rgba(255,255,255,0.2)');
  });
}

/** An army check post at the foot of the pass: a booth, a red-and-white boom and a flag. */
export function drawCheckPost(sx: number, sy: number, k: number) {
  if (k < 0.16) return;
  at(sx, sy, k, () => {
    oval(0, 0, 44, 5, 'rgba(40,24,10,0.22)');
    box(-24, -52, 48, 52, '#8a8f6a'); box(10, -52, 14, 52, 'rgba(0,0,0,0.14)'); box(-28, -58, 56, 8, '#5a5f44');       // the booth in army green
    rrect(-16, -42, 18, 14, 2, '#33475a'); rrect(-16, -42, 18, 4, 1, 'rgba(255,255,255,0.18)'); box(8, -40, 10, 40, '#4a4d38');
    box(30, -6, 6, 6, '#3a3a3e');
    stroke([36, -4, 40, -56], '#e8e4d8', 4.6);                                                                          // the boom, raised
    for (let i = 0; i < 4; i++) stroke([36.8 + i * 0.9, -12 - i * 11, 37.6 + i * 0.9, -20 - i * 11], '#d8342b', 4.6);
    rrect(-20, -92, 44, 20, 3, '#f2c318'); rrect(-18, -90, 40, 16, 2, '#1b1712');
    box(-2, -72, 4, 14, '#5a4030');
    const t = performance.now() / 1000;
    box(-28, -120, 2.4, 62, '#e8e4d8'); poly([-26, -118, -4 + Math.sin(t * 3) * 2, -114, -4 + Math.sin(t * 3 + 1) * 2, -104, -26, -102], '#e8891a');
    poly([-26, -102, -4 + Math.sin(t * 3 + 1) * 2, -104, -4 + Math.sin(t * 3 + 2) * 2, -94, -26, -90], '#f4f2ea');
    poly([-26, -90, -4 + Math.sin(t * 3 + 2) * 2, -94, -4 + Math.sin(t * 3 + 3) * 2, -84, -26, -78], '#3c8a48');       // the tricolour
  });
}
