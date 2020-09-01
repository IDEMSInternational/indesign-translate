# Tip Sheet Translate Utility

This repository is for translating the InDesign files used to generated the Covid 19 parenting tip sheet PDFs.

Google Drive folder with the InDesign files in [here](https://drive.google.com/open?id=1EFOOVZn9UK_esJ6lVCko9sy-uxrEkLmY)

## What is the workflow for updating or translating the tip sheets?

The workflow for enabling the translation of tip sheets works like so:

1. The English version of the tip sheets are updated by designer in InDesign
2. Scripts are run to extract the English text for translation (in case any text has changed).
3. The extracted english is passed to translator partners who return files with the translated text.
4. The files with the translated text are used to generate an InDesign file for each language for which we have translations for.
5. These InDesign files must be opened in InDesign to check for any manual adjustments need. For example if a language is much longer than English, the font size may need to be reduced for a section.
6. Once the translated file has been reviewed in InDesign it is ready to be exported as a PDF.

Where InDesign is mentioned you'll need to ask a designer for them to do updates (with the translation process in mind). Next you'll need to make sure someone at IDEMS runs the scripts to extract the text for translation, and sends this to Translators Without Borders. Once the files with the extracted text are translated, IDEMS will run the scripts to generate InDesign files which a designer will do final edits and provide you with the translated PDF.

## How can I run the scripts?
Before you can run any of the scripts mentioned below you need to:
1. Download and install NodeJS. [Click here to download NodeJS](https://nodejs.org/en/download/).
2. Use git to checkout this repo
3. Use a command line to run the command ```npm install``` in this folder

## What do I need to keep in mind in InDesign to support translation?
- English is a relatively compact language. For short peices of text assume that other languages could be up to 300% more characters, and for longer sections up to 170% more characters.
- Expand text boxes as much as possible to support more characters than is in the English version.
- Each section of the tip sheet should be it's own story. This is to prevent a longer text translation for one section overflowing to the next section.
- For each story exapnd the story editor to take up the full width of the screen, and turn on the end of line symbol in the story editor. We want to make sure that each sentence that should be translated as one sentence does not have an unnecessary line break.
- Avoid adjusting the format of specific peices of text within a story as this causes that peice of text to have to be translated seperately to the rest of the sentence to maintain the formatting. 
- For the same reason DO NOT USE KERNING. Kerning results in each indivual letter needing translation.

## What to do if I want to make changes to the tip sheets?

1. Make the changes in InDesign. Keep in mind the things need to enable translation.
2. Save the tip sheets InDesign file as an IDML file, make sure it's called en.idml and save it in the input folder within this folder
3. Next up run the script to extract the English text as a JSON file for translation by either
    - Double clicking extract_english.bat (if on Windows)
    - Running ```npm run extract``` in a command line (if on MacOS, Linux or Windows)
4. Update this README to point to link to the Google Drive folder where the latest IDML file lives.
5. The contents of the versioned_english_json can be sent to translators. If you know how to do this, please push changes made to files in versioned_english_json to Github. This is used to track when English text is added or removed (and therefore required additional translation).

## What to do if I have received new translations and want to generate new PDFs?

1. Place the translations in the translate_json folder. The translations should be 15 JSON files (one per page) each in a folder with the 2 letter language code for the translated language.
    - e.g /tranlate_json/sw/page-1.json for tip sheet 1 in Kiswahili
2. Run the translate script by either
    - Double clicking generate_translated_indesign.bat (if on Windows)
    - Running ```npm run translate``` in a command line (if on MacOS, Linux or Windows)
3. The output folder will now have an InDesign file for every language witha translation.
4. Open each IDML file in InDesign and check for any manual adjustments that are needed.
5. Use InDesign to export the IDML files to PDF's.
6. You can use [this plugin](https://redokun.com/resources/batch-convert-pdf-file) to do this in bulk