# ActivityWatch Web UI - Custom Dashboard

This is a customized version of the ActivityWatch Web UI dashboard. It features a brand-new layout, optimized telemetry visualizations, and customized user interface elements for tracking your time.

ActivityWatch is a privacy-first, open-source automated time tracker.

---
## Email Your Ideas To MrPalande993@gmail.com

## 🚀 How to Apply This Custom UI (For Users)(btw if u using portable version just replace the files inside statics with new one)

If you just want to use this custom interface with your existing ActivityWatch application on Windows, you don’t need to compile anything. Follow these simple steps:

### Step 1: Download the UI Files
1. Click the green **Code** button at the top right of this GitHub page.
2. Select **Download ZIP**.
3. Extract the downloaded ZIP folder on your computer. You will see a folder named `dist` (containing `index.html`, a `css` folder, and a `js` folder).

### Step 2: Paste the Files Into ActivityWatch
1. Completely close ActivityWatch (right-click the icon in your Windows system tray and click **Quit**).
2. Open your Windows File Explorer, press `Win + R`, type `%LocalAppData%\activitywatch`, and hit **Enter**.
3. Inside this folder, create a brand-new folder named exactly **`static`**.
4. Open the extracted folder from Step 1, go inside the **`dist`** folder, and copy **all of its contents**.
5. Paste those files **directly inside** your newly created `static` folder.

> ⚠️ **Important:** Do not copy the main folder itself. The `index.html` file must sit directly inside the `static` directory (`.../activitywatch/static/index.html`).

### Step 3: Configure Your Windows Shortcut
Because the standard Windows installer hides the default UI inside the application files, you must tell Windows to look at your new `static` folder instead:

1. Right-click your desktop **ActivityWatch** shortcut and select **Properties**.
2. Locate the **Target** input field. It will look like this:
   `"C:\Users\<YourUsername>\AppData\Local\activitywatch\aw-qt.exe"`
3. Add a space at the very end of that line, and paste the custom flag outside of the quotation marks:
   `"C:\Users\<YourUsername>\AppData\Local\activitywatch\aw-qt.exe" --custom-static ./static`
4. Click **Apply** and then **OK**.

Launch ActivityWatch using that shortcut, open your browser to `http://localhost:5600/`, and enjoy your brand-new custom UI!

---

## 🛠️ Developer Setup (For Modifying the Code)

If you want to make further visual tweaks or changes to the source code:

1. Clone this repository and install the developer dependencies:
   ```bash
   npm install
   ```
2. Start your local background trackers in an isolated test environment:
   ```bash
   aw-qt --testing
   ```
3. Run the live-reload development server to preview your edits on `http://localhost:8080`:
   ```bash
   npm run serve
   ```
4. When done making changes, compile a new production build folder by running:
   ```bash
   npm run build
   ```

---

## 📄 License

This project is licensed under the same terms as the original ActivityWatch Web UI ([MPL-2.0]. See the `LICENSE` file for details.




