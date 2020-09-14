import * as xlsx from "xlsx";
import * as fs from "fs";
import * as path from "path";
import { compareTwoStrings } from "string-similarity";

const inputFolder = "./input";
const translateJSONFolder = "./translate_json";

const matchCloseStrings = true;
const matchTolerance = 0.9;

type TranslateEntry = { sourceText: string, text: string, note?: string };

function spreadsheetToJSONForAllInputFolders() {
    fs.readdirSync(inputFolder)
        .filter((inputFolderName) => {
            let statResult = fs.statSync(path.join(inputFolder, inputFolderName));
            return statResult.isDirectory();
        })
        .forEach((inputFolderName) => {
            spreadsheetToJSON(inputFolderName);
        });
}

function spreadsheetToJSON(inputFolderName: string) {
    let inputFolderPath = path.join(inputFolder, inputFolderName);
    try {
        let spreadsheetFiles = fs.readdirSync(inputFolderPath).filter((filename) => filename.endsWith(".xlsx"));
        if (spreadsheetFiles.length < 1) {
            console.warn("Could not find spreadsheet with translations for " + inputFolderName);
            return;
        }
        let spreadsheetFile = spreadsheetFiles.find((filename) => filename === inputFolderName + ".xlsx");
        if (!spreadsheetFile) {
            spreadsheetFile = spreadsheetFiles[0];
        }
        let workbook = xlsx.readFile(path.join(inputFolderPath, spreadsheetFile));
        for (var pageNumber = 1; pageNumber <= workbook.SheetNames.length; pageNumber++) {
            let sheetName = "page-" + pageNumber;
            let allMatches = [];
            /* Sheet names must be page-n, page-1, page-2, page-3 */
            if (workbook.Sheets[sheetName]) {
                let worksheet = workbook.Sheets[sheetName];
                let range = xlsx.utils.decode_range(worksheet["!ref"]);
                let englishJSONPath = path.join(translateJSONFolder, inputFolderName, "en", sheetName + ".json");
                let englishJSON: TranslateEntry[] = [];
                if (fs.existsSync(englishJSONPath)) {
                    englishJSON = JSON.parse(fs.readFileSync(englishJSONPath).toString());
                }
                getLanguageCodesInSheet(workbook.Sheets[sheetName]).forEach((langCode, langIndex) => {
                    let langJSONPath = path.join(translateJSONFolder, inputFolderName, langCode);
                    if (!fs.existsSync(langJSONPath)) {
                        fs.mkdirSync(langJSONPath);
                    }
                    let translateList: TranslateEntry[] = [];
                    for (var i = 3; i <= range.e.r; i++) {
                        let colLetter = xlsx.utils.encode_col(langIndex + 2);
                        let note = worksheet["A" + i] ? worksheet["A" + i].v : "";
                        let sourceText: string = worksheet["B" + i] ? worksheet["B" + i].v : "";
                        sourceText = sourceText.replace("\n", "").trim();
                        if (matchCloseStrings && englishJSON.length > 0) {
                            let bestMatch = englishJSON
                                .map((entry) => ({
                                    text: entry.sourceText,
                                    probMatch: compareTwoStrings(sourceText, entry.sourceText)
                                }))
                                .sort()[englishJSON.length - 1];
                            if (bestMatch.probMatch != 1 && bestMatch.probMatch > matchTolerance) {
                                console.log("Close match using extract from InDesign as source text");
                                console.log("IDML:", bestMatch.text);
                                console.log("XLSX:", sourceText);
                                sourceText = bestMatch.text;
                            }
                        }
                        let text: string = worksheet[colLetter + i] ? worksheet[colLetter + i].v : "";
                        if (text.trim().length > 0 && sourceText.trim().length > 0) {
                            translateList.push({
                                sourceText: sourceText,
                                text: text,
                                note: note
                            });
                        }
                    }
                    console.log(sheetName, "IDML Extract length: ", englishJSON.length, " - XLSX Extract length: ", translateList.length);
                    fs.writeFileSync(path.join(langJSONPath, sheetName + ".json"), JSON.stringify(translateList, null, 4));
                });
            }
        }
    }
    catch (ex) {
        console.warn("Could not open spreadsheet with translations for " + inputFolderName);
        console.error(ex);
    }
}

function getLanguageCodesInSheet(worksheet: xlsx.WorkSheet) {
    let range = xlsx.utils.decode_range(worksheet["!ref"]);
    let langCodes = [];
    for (var i = 2; i <= range.e.c; i++) {
        let letter = xlsx.utils.encode_col(i);
        let cell = worksheet[letter + "2"];
        if (cell && cell.v && cell.v.length < 4) {
            langCodes.push(cell.v);
        }
    }
    return langCodes;
}

function getWorksheetRange(worksheet: xlsx.WorkSheet): { left: number, right: number, top: number, bottom: number } {
    var cellRegex = /([a-zA-Z]+)([0-9]+)/;
    var topLeftCell = worksheet["!ref"].split(":")[0];
    var bottomRightCell = worksheet["!ref"].split(":")[1];
    var topLeftMatch = topLeftCell.match(cellRegex);
    var bottomRightMatch = bottomRightCell.match(cellRegex);
    return {
        left: xlsx.utils.decode_col(topLeftMatch[1]),
        right: xlsx.utils.decode_col(bottomRightMatch[1]),
        top: Number.parseInt(topLeftMatch[2]),
        bottom: Number.parseInt(bottomRightMatch[2])
    };
}

spreadsheetToJSONForAllInputFolders();