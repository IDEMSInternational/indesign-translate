import { parse } from "fast-xml-parser";

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