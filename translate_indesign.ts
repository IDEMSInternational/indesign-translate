import * as fs from "fs";
import * as path from "path";
import { parse, j2xParser as JS2XMLParser, getTraversalObj } from "fast-xml-parser";
import * as AdmZip from "adm-zip";
import * as rimraf from "rimraf";
import { removeForbiddenCharacters, extractStoryMap, getStoriesForSpread, getSpreadIdsInOrder, pageFileNameForSpreadId, TranslationEntry, getIDMLFilePathForName } from "./shared_functions";
import * as ncp from "ncp";

let inputFolder = "./input";
let outputFolder = "./output";
let translateJSONPath = "./translate_json";
let tempFolder = "./temp";

rimraf(tempFolder, (err) => {
    if (err) {
        console.error("Error removing temp directory");
    }
    console.log("Removed temp directory");
    fs.mkdirSync(tempFolder);
    
    console.log("Created new temp directory");

    fs.readdirSync(inputFolder).forEach((idmlName) => {
        let inputSubPath = path.join(inputFolder, idmlName);
        if (fs.statSync(inputSubPath).isDirectory()) {
            const outputSubPath = path.join(outputFolder, idmlName);
            rimraf(outputSubPath, (err) => {
                ncp(path.join(inputFolder, idmlName), path.join(outputFolder, idmlName), (err) => {
                    translateIDML(idmlName);
                });
            });
        }
    });
});

function translateIDML(idmlName: string) {

    // Create temp path for extracted contents of this IDML file
    const tempPath = path.join(tempFolder, idmlName);
    if (!fs.existsSync(tempPath)) {
        fs.mkdirSync(tempPath);
    }

    // Create output folder for this IDML file
    const outputSubPath = path.join(outputFolder, idmlName);
    if (!fs.existsSync(outputSubPath)) {
        fs.mkdirSync(outputSubPath);
    }
    
    let inputFilePath = getIDMLFilePathForName(inputFolder, idmlName);
    if (inputFilePath === null) {
        console.warn("Could not find IDML file for ", idmlName);
        return;
    }
    let inputZip = new AdmZip(inputFilePath);

    let translateJSONSubPath = path.join(translateJSONPath, idmlName);
    let languageCodes = fs.readdirSync(translateJSONSubPath).filter((langCode) => langCode !== "en");

    for (let langCode of languageCodes) {

        const tempPathTranslated = path.join(tempPath, langCode);
        if (!fs.existsSync(tempPathTranslated)) {
            fs.mkdirSync(tempPathTranslated);
        }

        // Extract contents of input InDesign into temporary folder
        console.log("Extracting English IDML into temp folder for ", langCode);
        inputZip.extractAllTo(tempPathTranslated);

        // Do actual translation
        translateStoriesXML(tempPathTranslated, langCode, idmlName);

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
        
        const outputZipPath = path.join(outputSubPath, langCode + ".idml");
        console.log("Writing InDesign Markup File for ", idmlName, "for language code ", langCode);
        outputZip.writeZip(outputZipPath);
        // rimraf(tempPath, (err) => {});
    }
}

function translateStoriesXML(folder: string, langCode: string, idmlName: string) {
    const storiesPath = path.join(folder, "Stories");
    const spreadsPath = path.join(folder, "Spreads");
    const spreadIdsInOrder = getSpreadIdsInOrder(folder);
    fs.readdirSync(spreadsPath).forEach((spreadFile) => {
        const spreadId = spreadFile.replace("Spread_", "").replace(".xml", "");
        const spreadFilePath = path.join(spreadsPath, spreadFile);
        const spreadFileContents = fs.readFileSync(spreadFilePath).toString();
        const storyIds = getStoriesForSpread(spreadFileContents);
        let spreadTranslateMap = {};
        let pageFileName: string;
        try {
            pageFileName = pageFileNameForSpreadId(spreadIdsInOrder, spreadId);
            const pageFilePath = path.join(translateJSONPath, idmlName, langCode, pageFileName);
            const spreadTranslateFile: TranslationEntry[] = JSON.parse(fs.readFileSync(pageFilePath).toString());
            for (let entry of spreadTranslateFile) {
                spreadTranslateMap[entry.sourceText] = entry.text;
            }
        } catch (ex) {
            if (pageFileName) {
                console.log("In InDesign file ", idmlName, " Missing translation file for ", pageFileName, "for language ", langCode);
            } else {
                console.log("In InDesign file ", idmlName, " Missing translation file for spread id ", spreadId, "for language ", langCode);
            }
            
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
                    console.warn("In InDesign file ", idmlName, "Missing translation for ", key);
                }
            })
            fs.writeFileSync(path.join(storiesPath, storyFile), modifiedXML, { flag: "w+" });
        });
    });
}