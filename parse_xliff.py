from lxml import etree
import json
import re

#f_xlf = open("./translate_json/tip_sheets/zu/Zulu_tip_sheets_7to12.xlf", "r")
f_xlf_path = "./translate_json/tip_sheets/zu/Zulu_tip_sheets_7to12.xlf"
transl_xlf_tree = etree.iterparse(f_xlf_path)
#f_xlf.close()

f_original_json = open("./translate_json/tip_sheets/en/multiple_tipsheet_same_json/Zulu_tip_sheets_7to12.json", "r", encoding="utf8")
original_json = json.load(f_original_json)
f_original_json.close()



               
for action, elem in transl_xlf_tree:
   
    if elem.tag.endswith("trans-unit"):
        for child in elem:
            if child.tag.endswith("source"):
                source_hyper = []
                has_hyper = False
                source_text = child.text
                if not child.text:
                    has_hyper = True
                    for grandchild in child:
                        source_hyper.append(grandchild.text)
                    #print(source_hyper)
            elif child.tag.endswith("target"):
                transl_hyper = []
                transl_text = child.text
                if not child.text:
                    for grandchild in child:
                        transl_hyper.append(grandchild.text)
                    #print(transl_hyper)

        match = False
        if has_hyper:

            print(source_hyper)
            for bit in original_json:
                if bit["sourceText"].startswith("<span id=\"item-0\">"):
                    
                    find_test = []
                    source_replace_special = bit["sourceText"].replace("&rdquo;" , "”").replace("&ldquo;", "“").replace("&ndash;", "–").replace("&rsquo;" ,"’")
                    for atom in source_hyper: 
                        find_test.append(source_replace_special.find(atom))
    
                    print(find_test)
                    
                    if min(find_test)>=0:
                        print("match")
                        match = True
                        transl_text = source_replace_special
                        for i in range(len(source_hyper)):
                            transl_text = transl_text.replace(source_hyper[i],transl_hyper[i])
                            bit["text"] = transl_text
                            
                        
        else:
            for bit in original_json:
                if bit["sourceText"] == source_text:
                    bit["text"] = transl_text
                    
                    match = True
        
            if not match:
                print("no match for " + source_text)





translated_json = open("./translate_json/tip_sheets/zu/Zulu_tip_sheets_7to12.json", "w")
json.dump(original_json, translated_json, indent=2)   
translated_json.close()





