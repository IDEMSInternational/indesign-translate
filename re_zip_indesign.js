var fs = require('fs');
var path = require("path");
var AdmZip = require('adm-zip');

const outputZip = new AdmZip();
var unzipped_path = "./output/tip_sheets/sv"
//var unzipped_path = "./output/tip_sheets_NOTO/fa"
//var unzipped_path = "./input/tip_sheets_NOTO/tip_sheets_sectioned"


fs.readdirSync(unzipped_path).forEach((file) => {
    try {
        var filePath = path.join(unzipped_path, file);
        if (fs.statSync(filePath).isDirectory()) {
            outputZip.addLocalFolder(filePath, file);
        } else {
            outputZip.addLocalFile(filePath);
        }
    } catch (ex) {
        console.warn("Error adding file to IDML", ex);
    }

});

const outputZipPath = path.join("./output/tip_sheets/sv_fixed.idml");
outputZip.writeZip(outputZipPath);
        // rimraf(tempPath, (err) => {});