import { parse } from "fast-xml-parser";
import * as fs from "fs";
import * as path from "path";

export interface TranslationEntry {
    sourceText: string;
    text: string;
    note?: string;
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