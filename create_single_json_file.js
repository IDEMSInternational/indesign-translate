var fs = require('fs');
var path = require("path");


var testFolder = "./jsons_for_single_json/1-6"
file_names = fs.readdirSync(testFolder)

/*
// option 1: key = name_of_tip_sheet & value = content_of_tip_sheet_json (array)
var list_of_jsons = {};

file_names.forEach( name =>{
    var input_path = path.join(__dirname, testFolder, name);
   
    var json_string = fs.readFileSync(input_path).toString();
    var obj = JSON.parse(json_string);
    list_of_jsons[name.replace(".json","")] = obj;
})

var final_file = JSON.stringify(list_of_jsons, null, 2);


var output_path = path.join(__dirname, "/tip_sheets_7to15_and_onepager.json");
    fs.writeFile(output_path, final_file, function (err, result) {
        if (err) console.log('error', err);
    });
*/

// option 2: single json with tag for identifying tip sheet
var single_json = [];

file_names.forEach( name =>{
    var input_path = path.join(__dirname, testFolder, name);
   
    var json_string = fs.readFileSync(input_path).toString();
    var obj = JSON.parse(json_string);
    obj.forEach(bit =>{
        var bit_with_tag = Object.assign({}, bit);
        bit_with_tag["TipSheetId"] = name.replace(".json","")
        single_json.push(bit_with_tag)
    })
    
})

var single_json = JSON.stringify(single_json, null, 2);


var output_path = path.join(__dirname, "./translate_json/tip_sheets/en/multiple_tipsheet_same_json/Oromo_tip_sheets_1to6.json");
    fs.writeFile(output_path, single_json, function (err, result) {
        if (err) console.log('error', err);
    });