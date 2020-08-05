import * as fs from "fs";
import * as path from "path";
import { parse, j2xParser as JS2XMLParser, getTraversalObj } from "fast-xml-parser";
import * as AdmZip from "adm-zip";
import * as rimraf from "rimraf";
import { removeForbiddenCharacters, extractStoryMap, getStoriesForSpread, getSpreadIdsInOrder, pageFileNameForSpreadId, TranslationEntry } from "./shared_functions";

let inputFilePath = "./input/en.idml";
let translateJSONPath = "./translate_json";
let tempPath = "./temp";
let languageCodes = ["es"];

rimraf(tempPath, (err) => {
    if (err) {
        console.error("Error removing temp directory");
    }
    console.log("Removed temp directory");
    fs.mkdirSync(tempPath);
    console.log("Created new temp directory");

    translateIDML();
});

function translateIDML() {
    let inputZip = new AdmZip(inputFilePath);
    for (let langCode of languageCodes) {
        const tempPathTranslated = path.join(tempPath, langCode);
        if (!fs.existsSync(tempPathTranslated)) {
            fs.mkdirSync(tempPathTranslated);
        }

        // Extract contents of input InDesign into temporary folder
        console.log("Extracting English IDML into temp folder for ", langCode);
        inputZip.extractAllTo(tempPathTranslated);

        // Do actual translation
        translateStoriesXML(tempPathTranslated, langCode);

        // Combine files back into ZIP file for output InDesign Markup file
        const outputZip = new AdmZip();
        fs.readdirSync(tempPathTranslated).forEach((file) => {
            try {
                var filePath = path.join(tempPathTranslated, file);
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
    const spreadsPath = path.join(folder, "Spreads");
    const spreadIdsInOrder = getSpreadIdsInOrder(folder);
    fs.readdirSync(spreadsPath).forEach((spreadFile) => {
        const spreadId = spreadFile.replace("Spread_", "").replace(".xml", "");
        const spreadFilePath = path.join(spreadsPath, spreadFile);
        const spreadFileContents = fs.readFileSync(spreadFilePath).toString();
        const storyIds = getStoriesForSpread(spreadFileContents);
        let spreadTranslateMap = {};
        try {
            const pageFileName = pageFileNameForSpreadId(spreadIdsInOrder, spreadId);
            const pageFilePath = path.join(translateJSONPath, langCode, pageFileName);
            const spreadTranslateFile: TranslationEntry[] = JSON.parse(fs.readFileSync(pageFilePath).toString());
            for (let entry of spreadTranslateFile) {
                spreadTranslateMap[entry.sourceText] = entry.text;
            }
        } catch (ex) {
            console.log("Missing translation file for spread id ", spreadId, "for language ", langCode);
            return;
        }
        storyIds.forEach((storyId) => {
            let storyFile = `Story_${storyId}.xml`;
            const storyFileContents = fs.readFileSync(path.join(storiesPath, storyFile)).toString();
            let modifiedXML = removeForbiddenCharacters(storyFileContents);
            let storyTranslateMap = extractStoryMap(storyFileContents);
            Object.keys(storyTranslateMap).forEach((key) => {
                if (spreadTranslateMap[key]) {
                    modifiedXML = modifiedXML.replace(key, spreadTranslateMap[key]);
                } else {
                    console.warn("Missing translation for ", key);
                }
            })
            fs.writeFileSync(path.join(storiesPath, storyFile), modifiedXML, { flag: "w+" });
        });
    });
}