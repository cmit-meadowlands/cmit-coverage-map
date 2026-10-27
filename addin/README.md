# CMIT Live Web Page (PowerPoint add-in)

Shows a live, interactive web page inside a slide. It replaces Microsoft's retired Web Viewer add-in. By default it shows the coverage map in Live View.

| File | What it is |
|---|---|
| `manifest.xml` | The add-in definition. Upload or sideload this file. |
| `viewer.html` | The page that runs inside the slide, served by GitHub Pages. |
| `icon-*.png` | Add-in icons. |

## Install

**Fastest: load it from a shared folder on your PC (Windows desktop)**

1. Create a folder such as `C:\AddinManifests` and copy `manifest.xml` into it.
2. Share the folder: right-click it, choose Properties, then Sharing, then Share, and add yourself. Copy the network path, for example `\\YOUR-PC\AddinManifests`.
3. In PowerPoint, open File, then Options, then Trust Center, then Trust Center Settings, then Trusted Add-in Catalogs. Paste the path into Catalog Url, click Add catalog, tick Show in Menu, and click OK. Restart PowerPoint.
4. Go to Home, then Add-ins, then More Add-ins (Advanced). Open the **SHARED FOLDER** tab, select **CMIT Live Web Page**, and click Add.

**Permanent: deploy it from the Microsoft 365 admin center (works on every device you sign in to)**

1. In admin.microsoft.com, go to Settings, then Integrated apps, then Upload custom apps.
2. Choose Office Add-in, then upload `manifest.xml` (or give it the URL of `addin/manifest.xml` on GitHub Pages).
3. Assign it to yourself and deploy. It can take a few hours to appear in PowerPoint, under Add-ins, then Admin Managed.

## Use

- **Placing it:** the add-in drops the map onto the current slide. Drag and resize it like a picture.
- **Changing the page:** in normal editing view, hover over the add-in, paste an `https://` address into the bar at the top right, and click Show. Each slide keeps its own address. The bar is hidden during the slide show.
- **During the slide show:** the page is fully interactive. Click into it first so it takes the keyboard (hotkeys such as D for Live View).
- **Without the add-in:** on a computer where it isn't installed, the slide shows a static snapshot instead.
- **Pages that block embedding:** some sites refuse to load inside a frame. The coverage map is not one of them.
