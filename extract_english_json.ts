import * as fs from "fs";
import * as path from "path";
import { parse, j2xParser as JS2XMLParser } from "fast-xml-parser";
import * as AdmZip from "adm-zip";
import * as rimraf from "rimraf";
import { extractStoryMap } from "./shared_functions";

let inputFilePath = "./input/en.idml";
let translateJSONPath = "./translate_json";
let tempPath = "./temp";

rimraf(tempPath, (err) => {
    if (err) {
        console.error("Error removing temp directory");
    }
    console.log("Removed old temp directory");
    fs.mkdirSync(tempPath);
    generateEnglishJSON();
});

function generateEnglishJSON() {
    
    console.log("Extracting English IDML");
    const inputZip = new AdmZip(inputFilePath);
    const tempEnPath = path.join(tempPath, "en");
    if (!fs.existsSync(tempEnPath)) {
        fs.mkdirSync(tempEnPath);
    }
    inputZip.extractAllTo(tempEnPath);

    const docTranslateMap = {};
    const storiesPath = path.join(tempEnPath, "Stories");
    fs.readdirSync(storiesPath).forEach((storyFile) => {
        const storyFileContents = fs.readFileSync(path.join(storiesPath, storyFile)).toString();
        
        let storyTranslateMap = extractStoryMap(storyFileContents);
        // console.log(storyTranslateMap);
        Object.keys(storyTranslateMap).forEach((key, idx) => {
            console.log(storyFile + "\t" + idx + "\t" + key);
            docTranslateMap[key] = key;
        });
    });
    if (!fs.existsSync(translateJSONPath)) {
        fs.mkdirSync(translateJSONPath);
    }
    fs.writeFileSync(path.join(translateJSONPath, "en.json"), JSON.stringify(docTranslateMap, null, 4));
}