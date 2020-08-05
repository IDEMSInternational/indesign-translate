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
    if (storyXMLNullCheck(storyXmlParsed)) {
        storyXmlParsed["idPkg:Story"][0].Story[0].ParagraphStyleRange.forEach((psr) => {
            if (psr.CharacterStyleRange && psr.CharacterStyleRange.length > 0) {
                psr.CharacterStyleRange.forEach((csr) => {
                    if (csr.Content) {
                        if (typeof csr.Content === "string") {
                            let str = removeForbiddenCharacters(csr.Content);
                            storyTranslateMap[str] = str;
                        } else {
                            csr.Content.forEach((str) => {
                                str = removeForbiddenCharacters(str);
                                storyTranslateMap[str] = str;
                            });
                        }
                    }
                });
            }
        });
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
    let tagStringToParentStory = `<TextFrame Self="u1234" ParentStory="`;
    let storyIdMap = {};
    spreadFileContents.split("\n").forEach((line) => {
        let index = line.indexOf(tagStartString);
        if (index > -1) {
            let storyId = "";
            for (var i = index + tagStringToParentStory.length; i < line.length && line[i] !== `"`; i++) {
                storyId += line[i];
            }
            storyIdMap[storyId] = "";
        }
    });
    return Object.keys(storyIdMap);
}