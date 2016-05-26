module.exports = function (inphrase) {
  var search_abstraction_result = [];
  for (var i = 0; i < inphrase.length; i++ ) {
    var temp_json_obj = new Object();
    temp_json_obj.name = inphrase[i].name
    temp_json_obj.url = inphrase[i].url
    temp_json_obj.imageurl = inphrase[i].image_url
    temp_json_obj.id = inphrase[i].id

    search_abstraction_result.push ( temp_json_obj );
  }

  return search_abstraction_result
}
