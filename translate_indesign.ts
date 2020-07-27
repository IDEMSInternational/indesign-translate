import * as fs from "fs";
import * as path from "path";
import { parse, j2xParser as JS2XMLParser, getTraversalObj } from "fast-xml-parser";
import * as AdmZip from "adm-zip";
import * as rimraf from "rimraf";
import { removeForbiddenCharacters, extractStoryMap } from "./shared_functions";

let languageCodes = ["es"];

rimraf("./temp", (err) => {
    if (err) {
        console.error("Error removing temp directory");
    }
    console.log("Removed temp directory");
    fs.mkdirSync("./temp");
    console.log("Created new temp directory");
    
    translateIDML();
});

function translateIDML() {
    let inputZip = new AdmZip("./input/en.idml");
    for (let langCode of languageCodes) {
        const tempPath = `./temp/${langCode}`;
        if (!fs.existsSync(tempPath)) {
            fs.mkdirSync(tempPath);
        }

        // Extract contents of input InDesign into temporary folder
        console.log("Extracting English IDML into temp folder for ", langCode);
        inputZip.extractAllTo(tempPath);

        // Do actual translation
        translateStoriesXML(tempPath, langCode);

        // Combine files back into ZIP file for output InDesign Markup file
        const outputZip = new AdmZip();
        fs.readdirSync(tempPath).forEach((file) => {
            try {
                var filePath = path.join(tempPath, file);
                if (fs.statSync(filePath).isDirectory()) {
                    outputZip.addLocalFolder(filePath, file);
                } else {
                    outputZip.addLocalFile(filePath);
                }
            } catch (ex) {
                console.warn("Error adding file to IDML", ex);
            }

        });
        const outputPath = path.join("./output", langCode + ".idml");
        console.log("Writing InDesign Markup File for ", langCode);
        outputZip.writeZip(outputPath);
        // rimraf(tempPath, (err) => {});
    }
}

function translateStoriesXML(folder: string, langCode: string) {
    const storiesPath = path.join(folder, "Stories");
    fs.readdirSync(storiesPath).forEach((storyFile) => {
        // console.log("Story file ", storyFile);
        const storyFileContents = fs.readFileSync(path.join(storiesPath, storyFile)).toString();
        let modifiedXML = removeForbiddenCharacters(storyFileContents);
        let translateMapString = fs.readFileSync(path.join("./translate_json", langCode + ".json")).toString();
        let translateMap: { [en: string]: string } = JSON.parse(translateMapString);
        let storyTranslateMap = extractStoryMap(storyFileContents);
        Object.keys(storyTranslateMap).forEach((key) => {
            if (translateMap[key]) {
                modifiedXML = modifiedXML.replace(key, translateMap[key]);
            } else {
                console.warn("Missing translation for ", key);
            }
        })
        fs.writeFileSync(path.join(storiesPath, storyFile), modifiedXML, { flag: "w+" });
    });
}