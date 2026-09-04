# DaftPunKonsole

Play *Harder, Better, Faster, Stronger* on your keyboard — or your phone.

## Run it

It's a fully static site with no build step. Open `index.html` directly, or serve the folder:

    python3 -m http.server 8000
    # then visit http://localhost:8000

(Serving is recommended — some browsers restrict `fetch` of the sound files from `file://` URLs.)

## How to play

1. Pick a **pitch** (Low → Highest, seven levels). Each pitch has its own color.
2. Tap the **word keys** (or press the matching letters on your keyboard).
3. Hit **Instrumental** (space bar) or **Full beat** (enter) to jam over a backing track.

Not sure what to press when? Hit **"Guide me through the song"** and the konsole
highlights each key in order, line by line, through the real lyrics.

On desktop you can choose your keyboard layout (QWERTY / QWERTZ / AZERTY) — it only
changes the letters shown on the keys; keys are matched by physical position, so any
layout works. On touch devices the letters are hidden and you just tap the pads.

Note: the left-hand words (*Work it … Stronger*) were never recorded at the **Low**
pitch — in the song that pitch only appears on the second line — so those keys dim
when Low is selected.

## History

Originally built with Middleman 3, CoffeeScript, Sass and Bower. That toolchain can
no longer be installed (Middleman 3 doesn't run on modern Ruby, and Bower is
discontinued), so the app was rewritten as a dependency-free static page: vanilla
JS + Web Audio instead of jQuery/ion.sound/jPlayer. The missing pitch variants of
the sound files (4–7, powering the Pitch-2 through Highest levels) and the
**Full beat** backing track were restored from the revival at
[jkdos.com/daftpunkonsole](https://jkdos.com/daftpunkonsole/) by Joseph Kreifels II.

Made with ♥ by Malik Dellidj — [@Dathink](https://twitter.com/Dathink)

All sounds, samples, brands, trademarks, artworks, or any associated imagery are
trademarks and/or copyright material of their respective owners.
