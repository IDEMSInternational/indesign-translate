var fs = require('fs');
var path = require("path");
var AdmZip = require('adm-zip');
var parser = require('fast-xml-parser');
const { DOMParser } = require('xmldom')

var domParser = new DOMParser();


const outputZip = new AdmZip();
var unzipped_path = "./previous_outputs/tip_sheets_NOTO/debug_bn/bn_fixed"
//var unzipped_path = "./output/tip_sheets/lv"
//var unzipped_path = "./input/tip_sheets_NOTO/tip_sheets_sectioned"


// check that all xml files are valid
fs.readdirSync(unzipped_path  + "/Stories").forEach((xmlfile) => {
    let xmldata = fs.readFileSync(unzipped_path  + "/Stories/" + xmlfile).toString();
    var doc = new DOMParser().parseFromString(xmldata);
    if (!parser.validate(xmldata)){
        console.log(xmlfile)
    }
})




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

/*
const outputZipPath = path.join("./previous_outputs/tip_sheets_NOTO/bn_no4.idml");
//const outputZipPath = path.join("./output/tip_sheets/lv_fixed.idml");
outputZip.writeZip(outputZipPath);
        // rimraf(tempPath, (err) => {});
        */