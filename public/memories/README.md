# Memories folder

Each sub-folder here becomes one card on the page, in name order.

```
public/memories/
  01-the-beginning/
    photo.jpg        <- first image in the folder (jpg, png, webp, gif, avif)
    memory.md        <- optional: title / date / emoji + your message
  02-road-trip/
    IMG_2041.png
    memory.md
  _draft-ideas/      <- folders starting with _ or . are ignored
```

## memory.md

```
---
title: Road trip
date: Summer 2023
emoji: 🚗
---
Remember this one? Still one of my favourite days.
```

- Everything is optional. With no `title`, the folder name is used ("02-road-trip" becomes "Road trip").
- No image? A pretty placeholder with your `emoji` is shown instead.
- No `memory.md`? The card shows just the photo and title.
- Use `01-`, `02-`, `10-` prefixes to control the order.

To add a memory: create a folder, drop in a photo and a `memory.md`, refresh. (In production, rebuild or redeploy.)
