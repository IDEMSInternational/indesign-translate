import { parse } from "fast-xml-parser";
import * as fs from "fs";

export function removeForbiddenCharacters(str: string) {
    return str.replace("\u2028", "");  // Remove Line Seperator character
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