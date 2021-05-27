var XLSX = require('xlsx');
var fs = require('fs');
var path = require("path");
var parse5 = require('parse5');



var wb = XLSX.utils.book_new();


const transl_folder = "./translate_json/tip_sheets_NOTO/prs/wrong_IDs"

filenames = fs.readdirSync(transl_folder)

filenames.forEach((tip_sheet_name) => {
    console.log(tip_sheet_name)
    var json_string = fs.readFileSync(transl_folder + "/" + tip_sheet_name).toString();
    var tr_tip_sheet = JSON.parse(json_string);
    wb.SheetNames.push(tip_sheet_name.substring(0, tip_sheet_name.length - 5));
    var ws_data = [];
    tr_tip_sheet.forEach(bit => {
        if (!bit.sourceText.startsWith("<span id=\"item-0\">")) {
            ws_data.push([bit.sourceText, bit.text]);
        } else {
            /*
            console.log("------------------------------")
            console.log(bit.sourceText)
            var html_string_eng = parse5.parseFragment(bit.sourceText);
            var html_string_transl = parse5.parseFragment(bit.text);

            for (lk = 0; lk < html_string_eng.childNodes.length; lk++) {
                var link_eng = html_string_eng.childNodes[lk];
                var link_transl = html_string_transl.childNodes[lk];
                console.log("en" + link_eng.tagName)
                console.log(link_transl.tagName)
                if (link_eng.tagName == "span") {
                    ws_data.push([link_eng.childNodes[0].value, link_transl.childNodes[0].value]);

                } else if (link_eng.tagName == "a") {
                    ws_data.push(["HYPERLINK: " + link_eng.childNodes[0].value, link_transl.childNodes[0].value]);
                }
            }*/
            var html_vector_eng = bit.sourceText.split("><");
            var html_vector_transl = bit.text.split("><");
            for (lk = 0; lk < html_vector_eng.length; lk++) {
                ws_data.push([html_vector_eng[lk], html_vector_transl[lk]]);

            }




        }

    })
    var ws = XLSX.utils.aoa_to_sheet(ws_data);
    wb.Sheets[tip_sheet_name.substring(0, tip_sheet_name.length - 5)] = ws;

})


output_path = "./translate_json/tip_sheets_NOTO/prs/Dari_transalation_1to15_HYPER.xlsx";
XLSX.writeFile(wb, output_path);

/*



var sheet = workbook.Sheets["Translations"];
for (var z in sheet){

    if(z[0] === '!') continue;

    var col = z.substring(0,1);
    var row = parseInt(z.substring(1));
    if (row<6 || !(col=="G")) continue;
    console.log(row)
    curr_transl = transl_obj.filter(bit => bit.row == row);
    if (curr_transl.length != 1){
        console.log("error for row " + row)
        break
    } else{
        curr_transl = curr_transl[0];
    }

    sheet[z].v = curr_transl.text;


}
*/


/*
fs.writeFile(output_path, transl, function (err, result) {
    if (err) console.log('error', err);
});
*/


