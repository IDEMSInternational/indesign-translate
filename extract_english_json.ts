import * as fs from "fs";
import * as path from "path";
import { parse, j2xParser as JS2XMLParser } from "fast-xml-parser";
import * as AdmZip from "adm-zip";
import * as rimraf from "rimraf";
import { extractStoryMap, getStoriesForSpread, removeForbiddenCharacters, getSpreadIdsInOrder, pageFileNameForSpreadId, TranslationEntry, getIDMLFilePathForName, extractStoryPSRList, psrListToHTML } from "./shared_functions";
import { exit } from "process";

let inputFolder = "./input";
let translateJSONFolder = "./translate_json";
let tempFolder = "./temp";

rimraf(tempFolder, (err) => {
    if (err) {
        console.error("Error removing temp directory");
    }
    console.log("Removed old temp directory");
    fs.mkdirSync(tempFolder);
    fs.readdirSync(inputFolder).forEach((idmlName) => {
        let inputSubPath = path.join(inputFolder, idmlName);
        if (fs.statSync(inputSubPath).isDirectory()) {
            extractEnglishJSON(idmlName);
        }
    });
    ;
});

function extractEnglishJSON(idmlName: string) {

    const tempPath = path.join(tempFolder, idmlName);
    fs.mkdirSync(tempPath);

    let inputFilePath = getIDMLFilePathForName(inputFolder, idmlName);
    if (inputFilePath === null) {
        console.warn("Could not find IDML file for ", idmlName);
        return;
    }

    console.log("Extracting English text from " + inputFilePath);
    const inputZip = new AdmZip(inputFilePath);
    const tempEnPath = path.join(tempPath, idmlName);
    if (!fs.existsSync(tempEnPath)) {
        fs.mkdirSync(tempEnPath);
    }
    inputZip.extractAllTo(tempEnPath);

    const translateJSONPath = path.join(translateJSONFolder, idmlName);

    if (!fs.existsSync(translateJSONPath)) {
        fs.mkdirSync(translateJSONPath);
    }

    if (!fs.existsSync(path.join(translateJSONPath, "en"))) {
        fs.mkdirSync(path.join(translateJSONPath, "en"));
    }

    const spreadIdsInOrder = getSpreadIdsInOrder(tempEnPath);

    const spreadsPath = path.join(tempEnPath, "Spreads");
    const storiesPath = path.join(tempEnPath, "Stories");
    // const storyIdsBySpreadFile: { [ spreadFile: string]: string[] } = {};
    fs.readdirSync(spreadsPath).forEach((spreadFile) => {
        const spreadId = spreadFile.replace("Spread_", "").replace(".xml", "");
        const spreadFilePath = path.join(spreadsPath, spreadFile)
        const spreadFileContents = fs.readFileSync(spreadFilePath).toString();
        const storyIds = getStoriesForSpread(spreadFileContents);
        let spreadTranslateMap = {};
        const translateStructure: TranslationEntry[] = [];
        storyIds.forEach((storyId) => {
            let storyFile = `Story_${storyId}.xml`;
            const storyFileContents = fs.readFileSync(path.join(storiesPath, storyFile)).toString();
            const psrList = extractStoryPSRList(storyFileContents);
            const hasLinks = psrList.filter((psr) => psr.type === "hyperlink").length > 0;
            if (hasLinks) {
                let html = psrListToHTML(psrList);
                const entry: TranslationEntry = {
                    sourceText: removeForbiddenCharacters(html),
                    text: removeForbiddenCharacters(html),
                    note: "",
                    type: "html",
                    storyId: storyId
                };
                translateStructure.push(entry);
            } else {
                psrList.forEach((psr) => {
                    const entry: TranslationEntry = {
                        sourceText: removeForbiddenCharacters(psr.content),
                        text: removeForbiddenCharacters(psr.content),
                        note: "",
                        type: "text",
                        storyId: storyId
                    };
                    translateStructure.push(entry);
                });
            }
        });
        const pageFileName = pageFileNameForSpreadId(spreadIdsInOrder, spreadId);
        fs.writeFileSync(path.join(translateJSONPath, "en", pageFileName), JSON.stringify(translateStructure, null, 4)); 
    });
}