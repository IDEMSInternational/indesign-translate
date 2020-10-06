import { parse } from "fast-xml-parser";
import * as DomParser from "dom-parser";
import {Html5Entities} from "html-entities";
import * as fs from "fs";
import * as path from "path";

export type PSRType = "text" | "hyperlink";

export interface PSRSummary {
    content: string;
    type: PSRType;
    self?: string;
    name?: string;
}

export interface TranslationEntry {
    sourceText: string;
    text: string;
    storyId: string;
    note?: string;
    type?: "text" | "html";
}

export function removeForbiddenCharacters(str: string) {
    return str
        .replace("\u2028", "") // Remove Line Seperator character
        .replace("\u2029", "") // Remove Paragraph Seperator character
}

export function storyXMLNullCheck(storyXmlParsed): boolean {
    if (storyXmlParsed && storyXmlParsed["idPkg:Story"][0] && storyXmlParsed["idPkg:Story"][0]
        && storyXmlParsed["idPkg:Story"][0].Story[0] && storyXmlParsed["idPkg:Story"][0].Story[0].ParagraphStyleRange
        && storyXmlParsed["idPkg:Story"][0].Story[0].ParagraphStyleRange.length > 0) {
        return true;
    }
    return false;
}


export function extractStoryMap(storyFileContents: string): { [en: string]: string } {
    const storyXmlParsed = parse(storyFileContents, { arrayMode: true });
    let storyTranslateMap = {};
    let lastPsr;
    if (storyXMLNullCheck(storyXmlParsed)) {
        try {
            storyXmlParsed["idPkg:Story"][0].Story[0].ParagraphStyleRange.forEach((psr) => {
                lastPsr = psr;
                if (psr.CharacterStyleRange && psr.CharacterStyleRange.length > 0) {
                    psr.CharacterStyleRange.forEach((csr) => {
                        if (csr.HyperlinkTextSource && csr.HyperlinkTextSource[0] && csr.HyperlinkTextSource[0].Content
                            && typeof csr.HyperlinkTextSource[0].Content === "string") {
                            let str = removeForbiddenCharacters(csr.HyperlinkTextSource[0].Content + "");
                            storyTranslateMap[str] = str;
                        }
                        if (csr.Content) {
                            if (typeof csr.Content === "string" || typeof csr.Content === "number") {
                                let str = removeForbiddenCharacters(csr.Content + "");
                                storyTranslateMap[str] = str;
                            } else if (Array.isArray(csr.Content)) {
                                csr.Content.forEach((str) => {
                                    str = removeForbiddenCharacters(str);
                                    storyTranslateMap[str] = str;
                                });
                            }
                        }
                    });
                }
            });
        } catch (ex) {
            console.warn("Error parsing story at paragraph style range");
            console.warn(JSON.stringify(lastPsr, null, 4));
            console.debug(ex);
        }
        
    }
    return storyTranslateMap;
}

export function textToPSRSummary(text: string | number): PSRSummary {
    let str = removeForbiddenCharacters(text + "");
    return {
        content: str,
        type: "text"
    };
}

export function extractStoryPSRList(storyFileContents: string): PSRSummary[] {
    const storyXmlParsed = parse(storyFileContents, { arrayMode: true, ignoreAttributes: false });
    let psrSummaryList: PSRSummary[] = [];
    let lastPsr;
    if (storyXMLNullCheck(storyXmlParsed)) {
        try {
            storyXmlParsed["idPkg:Story"][0].Story[0].ParagraphStyleRange.forEach((psr) => {
                lastPsr = psr;
                if (psr.CharacterStyleRange && psr.CharacterStyleRange.length > 0) {
                    psr.CharacterStyleRange.forEach((csr) => {
                        if (csr.HyperlinkTextSource && csr.HyperlinkTextSource[0] && csr.HyperlinkTextSource[0].Content
                            && typeof csr.HyperlinkTextSource[0].Content === "string") {
                            let str = removeForbiddenCharacters(csr.HyperlinkTextSource[0].Content + "");
                            let psrSummary: PSRSummary = {
                                content: str,
                                type: "hyperlink",
                                name: csr.HyperlinkTextSource[0]["@_Name"],
                                self: csr.HyperlinkTextSource[0]["@_Self"],
                            };
                            psrSummaryList.push(psrSummary);
                        }
                        if (csr.Content) {
                            if (typeof csr.Content === "string" || typeof csr.Content === "number") {
                                psrSummaryList.push(textToPSRSummary(csr.Content));
                            } else if (Array.isArray(csr.Content)) {
                                for (let str of csr.Content) {
                                    psrSummaryList.push(textToPSRSummary(str));
                                }
                            }
                        }
                    });
                }
            });
        } catch (ex) {
            console.warn("Error parsing story at paragraph style range");
            console.warn(JSON.stringify(lastPsr, null, 4));
            console.debug(ex);
        }
    }
    return psrSummaryList;
}

export function psrListToHTML(psrList: PSRSummary[]): string {
    return psrList.map((psrSummary, index) => {
        let id = psrSummary.self;
        if (!id) {
            id = "item-" + index;
        }
        let title = psrSummary.name;
        if (!title) {
            title = "";
        }
        let text = Html5Entities.encode(psrSummary.content);
        if (psrSummary.type === "hyperlink") {
            return `<a id="${id}" title="${title}">${text}</a>`;
        } else {
            return `<span id="${id}">${text}</span>`;
        }
    }).join("");
}

export function htmlEntryToTextEntries(translateEntry: TranslationEntry): TranslationEntry[] {
    let textEntries: TranslationEntry[] = [];
    let domParser = new DomParser();
    let englishParsed = domParser.parseFromString("<html><body>" + translateEntry.sourceText + "</body></html>");
    let translationParsed = domParser.parseFromString("<html><body>" + translateEntry.text + "</body></html>");
    let englishLinkElements = englishParsed.getElementsByTagName("a");
    for (let i = 0; i < englishLinkElements.length; i++) {
        let id = englishLinkElements[i].getAttribute("id");
        let sourceText = Html5Entities.decode(englishLinkElements[i].textContent);
        let text = Html5Entities.decode(translationParsed.getElementById(id).textContent);
        let note = "";
        if (englishLinkElements[i].getAttribute("title")) {
            note = "" + englishLinkElements[i].getAttribute("title");
        }
        textEntries.push({
            sourceText: sourceText,
            storyId: translateEntry.storyId,
            text: text,
            note: note,
            type: "text"
        });
    }
    let englishSpanElements = englishParsed.getElementsByTagName("span");
    for (let i = 0; i < englishSpanElements.length; i++) {
        let id = englishSpanElements[i].getAttribute("id");
        let sourceText = Html5Entities.decode(englishSpanElements[i].textContent);
        let text = Html5Entities.decode(translationParsed.getElementById(id).textContent);
        textEntries.push({
            sourceText: sourceText,
            storyId: translateEntry.storyId,
            text: text,
            note: "",
            type: "text"
        });
    }
    return textEntries;
}

export function getSpreadIdsInOrder(tempPath: string) {
    const designMapFileContents = fs.readFileSync(path.join(tempPath, "designmap.xml")).toString();
    const designMapParsed = parse(designMapFileContents, { ignoreAttributes: false });
    const designMapSpreads: any[] = designMapParsed.Document["idPkg:Spread"];
    const spreadIdsInOrder = designMapSpreads.map((spread) => {
        const spreadFilePath: string = spread["@_src"];
        return spreadFilePath.replace("Spreads/Spread_", "").replace(".xml", "");
    });
    return spreadIdsInOrder;
}

export function pageFileNameForSpreadId(spreadIdsInOrder: string[], spreadId: string) {
    return `page-${spreadIdsInOrder.indexOf(spreadId) + 1}.json`;
}

export function getStoriesForSpread(spreadFileContents: string): string[] {
    let tagStartString = `<TextFrame Self="`;
    
    let storyIdMap = {};
    spreadFileContents.split("\n").forEach((line) => {
        let index = line.indexOf(tagStartString);
        if (index > -1 && line.indexOf(`ParentStory="`)) {
            let afterParentStoryIndex = line.indexOf(`ParentStory="`) + `ParentStory="`.length;
            let storyId = "";
            for (var i = afterParentStoryIndex; i < line.length && line[i] !== `"`; i++) {
                storyId += line[i];
            }
            storyIdMap[storyId] = "";
        }
    });
    return Object.keys(storyIdMap);
}

export function getIDMLFilePathForName(inputFolder: string, idmlName: string) {
    let inputFilePath = path.join(inputFolder, idmlName, idmlName + ".idml");
    if (!fs.existsSync(inputFilePath)) {
        try {
            var actualIDMLFilename = fs.readdirSync(path.join(inputFolder, idmlName)).filter((filename) => filename.endsWith(".idml"))[0];
            inputFilePath = path.join(inputFolder, idmlName, actualIDMLFilename);
        } catch (ex) {
            console.warn("Cannot find any IDML file for folder ", path.join(inputFolder, idmlName));
            inputFilePath = null;
        }
    }
    return inputFilePath;
}