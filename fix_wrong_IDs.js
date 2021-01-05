var fs = require('fs');
var path = require("path");

const wrong_IDs_folder = "./translate_json/tip_sheets_NOTO/fa/wrong_IDs"

filenames = fs.readdirSync(wrong_IDs_folder)

filenames.forEach((tip_sheet_name) => {
    var json_string = fs.readFileSync(wrong_IDs_folder + "/" + tip_sheet_name).toString();
    var tr_tip_sheet_wrong_IDs = JSON.parse(json_string);
    
    var json_string_en = fs.readFileSync("./translate_json/tip_sheets_NOTO/en/" + tip_sheet_name).toString();
    var en_tip_sheet = JSON.parse(json_string_en);

    for(bit = 0; bit<tr_tip_sheet_wrong_IDs.length; bit++){
        var curr_string = tr_tip_sheet_wrong_IDs[bit].sourceText;
        var eng_bit = en_tip_sheet.filter(bit => bit.sourceText == curr_string);
        if (eng_bit.length !=1){
            console.log(eng_bit.length + "error tipsheet" + tip_sheet_name + curr_string)
            continue
        }
        eng_bit = eng_bit[0];
        if (tr_tip_sheet_wrong_IDs[bit].storyId != eng_bit.storyId){
            console.log("different id" + tip_sheet_name + tr_tip_sheet_wrong_IDs[bit].storyId)
        }
        tr_tip_sheet_wrong_IDs[bit].storyId = eng_bit.storyId;
        

    }
    var new_file = JSON.stringify(tr_tip_sheet_wrong_IDs, null, 2)
    var output_path = path.join(__dirname, "./translate_json/tip_sheets_NOTO/fa/" + tip_sheet_name);
    fs.writeFile(output_path, new_file, function (err, result) {
         if (err) console.log('error', err);
        });


})
