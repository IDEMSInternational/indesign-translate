var fs = require('fs');
var path = require("path");

var input_path = path.join(__dirname, "./translate_json/tip_sheets/zu/Zulu_tip_sheets_7to12.json");
var json_string = fs.readFileSync(input_path).toString();
var tr_obj = JSON.parse(json_string);

var tip_sheets = [];

tr_obj.forEach(element => {
    if (!tip_sheets.includes(element.TipSheetId)){
        tip_sheets.push(element.TipSheetId)
    }
});

tip_sheets.forEach(sheet =>{
    var bits_in_sheet = tr_obj.filter(bit => bit.TipSheetId == sheet);
    var new_file = JSON.stringify(bits_in_sheet, null, 2)
    var output_path = path.join(__dirname, "./translate_json/tip_sheets/zu/" + sheet + ".json");
    fs.writeFile(output_path, new_file, function (err, result) {
         if (err) console.log('error', err);
        });
});