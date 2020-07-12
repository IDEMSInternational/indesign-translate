import * as fs from "fs";
import * as path from "path";
import { parse,  } from "fast-xml-parser";
import * as AdmZip from "adm-zip";
import * as rimraf from "rimraf";
import { StoryXML } from "./models/story-xml.model";

console.log("Extracting English IDML");
const inputZip = new AdmZip("./input/en.idml");

let languageCodes = ["es"];

if (!fs.existsSync("./temp")) {
    fs.mkdirSync("./temp");
}

if (!fs.existsSync("./output")) {
    fs.mkdirSync("./output");
}

for (let langCode of languageCodes) {
    const outputZip = new AdmZip();
    const tempPath = `./temp/${langCode}`;
    if (!fs.existsSync(tempPath)) {
        fs.mkdirSync(tempPath);
    }
    inputZip.extractAllTo(tempPath);

    translateStoriesXML(tempPath, langCode);

    fs.readdirSync(tempPath).forEach((file) => {
        try {
            var filePath = path.join(tempPath, file);
            if (fs.statSync(filePath).isDirectory()) {
                outputZip.addLocalFolder(filePath);
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

function storyXMLNullCheck(storyXmlParsed: StoryXML.RootObject): boolean {
    if (storyXmlParsed && storyXmlParsed["idPkg:Story"][0] && storyXmlParsed["idPkg:Story"][0]
        && storyXmlParsed["idPkg:Story"][0].Story[0] && storyXmlParsed["idPkg:Story"][0].Story[0].ParagraphStyleRange
        && storyXmlParsed["idPkg:Story"][0].Story[0].ParagraphStyleRange.length > 0) {
        return true;
    }
    return false;
}

function translateStoriesXML(folder: string, langCode: string) {
    const storiesPath = path.join(folder, "Stories");
    fs.readdirSync(storiesPath).forEach((storyFile) => {
        // console.log("Story file ", storyFile);
        const storyFileContents = fs.readFileSync(path.join(storiesPath, storyFile)).toString();
        const storyXmlParsed: StoryXML.RootObject = parse(storyFileContents, { arrayMode: true });
        if (storyXMLNullCheck(storyXmlParsed)) {
            // console.log(storyFile, JSON.stringify(storyXmlParsed, null, 4));
            storyXmlParsed["idPkg:Story"][0].Story[0].ParagraphStyleRange.forEach((psr) => {
                var storyString = "";
                if (psr.CharacterStyleRange && psr.CharacterStyleRange.length > 0) {
                    psr.CharacterStyleRange.forEach((csr) => {
                        if (csr.Content) {
                            if (typeof csr.Content === "string") {
                                storyString += csr.Content.replace("\u2028", "");
                            } else {
                                csr.Content.forEach((str) => {
                                    storyString += str.replace("\u2028", "");
                                });
                            }
                        }
                        if (csr.HyperlinkTextSource) {
                            storyString += csr.HyperlinkTextSource[0].Content;
                        }
                    });
                }
                console.log(storyString);
            });
        }
    })
}

function translateLine(line: string) {
    var line = line.replace("\u2028", ""); // Remove Line Seperator character
    console.log(line);
}