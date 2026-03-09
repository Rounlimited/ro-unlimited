var doc = app.activeDocument;

// Export ALL art (no artboard clipping) at good resolution
var exportFile = new File("C:/websites/rounlimited/git/public/ro-unlimited-logo-transparent.png");
var opts = new ExportOptionsPNG24();
opts.transparency = true;
opts.artBoardClipping = false;
opts.horizontalScale = 72;   // ~800px wide for 1127pt artwork
opts.verticalScale = 72;
opts.antiAliasing = true;

doc.exportFile(exportFile, ExportType.PNG24, opts);

"Done";
