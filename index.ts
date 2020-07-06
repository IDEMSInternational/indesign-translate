import * as fs from "fs";
import * as path from "path";
import { getTraversalObj } from "fast-xml-parser";
import * as AdmZip from "adm-zip";
import * as rimraf from "rimraf";

console.log("Extracting English IDML");
const inputZip = new AdmZip("./input/en.zip");

let languageCodes = ["es", "af", "sw"];

if (!fs.existsSync("./temp")) {
    fs.mkdirSync("./temp");
}

if (!fs.existsSync("./output")) {
    fs.mkdirSync("./output");
}

for (let langCode of languageCodes) {
    const outputZip = new AdmZip();
    if (!fs.existsSync(`./temp/${langCode}`)) {
        fs.mkdirSync(`./temp/${langCode}`);
    }
    inputZip.extractAllTo("./temp/" + langCode);
    outputZip.addLocalFolder("./temp/" + langCode);
    const outputPath = path.join("./output", langCode + ".idml");
    outputZip.writeZip(outputPath);
    rimraf("./temp", (err) => {});
    console.log("Writing InDesign Markup File for ", langCode);
}
