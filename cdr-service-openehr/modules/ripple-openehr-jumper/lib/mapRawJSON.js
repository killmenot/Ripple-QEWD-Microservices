/*

 ----------------------------------------------------------------------------
 | ripple-openehr-jumper: Automated OpenEHR Template Access                 |
 |                                                                          |
 | Copyright (c) 2016-18 Ripple Foundation Community Interest Company       |
 | All rights reserved.                                                     |
 |                                                                          |
 | http://rippleosi.org                                                     |
 | Email: code.custodian@rippleosi.org                                      |
 |                                                                          |
 | Author: Rob Tweed, M/Gateway Developments Ltd                            |
 |                                                                          |
 | Licensed under the Apache License, Version 2.0 (the "License");          |
 | you may not use this file except in compliance with the License.         |
 | You may obtain a copy of the License at                                  |
 |                                                                          |
 |     http://www.apache.org/licenses/LICENSE-2.0                           |
 |                                                                          |
 | Unless required by applicable law or agreed to in writing, software      |
 | distributed under the License is distributed on an "AS IS" BASIS,        |
 | WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. |
 | See the License for the specific language governing permissions and      |
 |  limitations under the License.                                          |
 ----------------------------------------------------------------------------

  20 July 2018

*/

var logging = {
  on: false,
  host: 'ethercis'
};

function log() {
  if (logging.on) console.log.apply(console, arguments)
}

function isEmpty(obj) {
  for (var index in obj) {
    return false;
  }
  return true;
}

function getByAQLPath(data, fieldInfo) {
  var subTree = data;
  var path;
  var fullPath;
  var found = true;
  var pathArr = fieldInfo.pathArr;
  var archetypeNodeId;

  for (var i = 0; i < pathArr.length; i++) {
      fullPath = pathArr[i];
      log('i = ' + i + '; fullPath = ' + fullPath);

      archetypeNodeId = false;

      var pieces;
      if (fullPath.indexOf('[') !== -1) {
        pieces = fullPath.split('[');
        archetypeNodeId = pieces[1].split(']')[0];
        path = pieces[0];
        log('** ' + path + ' : ' + archetypeNodeId);
      }
      else {
        path = fullPath;
      }

      subTree = subTree[path];

      if (subTree) {
        log('data found for path: ' + path);
        log('archetypeNodeId = ' + archetypeNodeId);

        if (archetypeNodeId) {
          if (Array.isArray(subTree)) {
            log('subTree is an array', JSON.stringify(subTree));
            var matching = [];
            subTree.forEach(function(tree) {
              log('tree.archetype_node_id = ' + tree.archetype_node_id);
              log('expecting ' + archetypeNodeId);
              if (tree.archetype_node_id === archetypeNodeId) {
                log('match found');
                matching.push(tree);
              }
            });
            if (matching.length === 0) {
              log('** no matching data found in array');
              found = false;
              break;
            }
            else {
              // just use first one for now
              log('** match found in array');
              subTree = matching[0];
            }
          }
          else {
           if (subTree.archetype_node_id !== archetypeNodeId) {
             log('archetype_node_id value of ' + archetypeNodeId + ' not found');
             found = false;
             break;
           }
          }
        }
        //if (logging.on) console.log('subTree now ' + JSON.stringify(subTree, null, 2));
      }
      else {
        log('no data found for path ' + path);
        found = false;
        break;
      }
  }

  if (found) {
    log(fieldInfo.id + '; type: ' + fieldInfo.type);
    log('subTree: ' + JSON.stringify(subTree, null, 2));

    return subTree;
  }

  return;
}

module.exports = function(params) {

  var rawjson = params.data;
  var metadata = params.metadata;
  //var documentName = params.documentName;
  var host = params.host;
  if (host === 'ethercis') logging.on = true;
  var patientId = params.patientId;

  //var templateDoc = this.db.use(documentName, 'templateMap', templateId);
  //var templateIndex = templateDoc.$('index');
  //var templateFields = templateDoc.$('field');
  //templateIndexSubs = templateDoc.$('indexSubs');

  var results = [];

  rawjson.resultSet.forEach(function(result, index) {

    if (index > 0 && host === 'ethercis') logging.on = false;

    var data = result.data;

    var hc_facility = {};
    var context = data.context;
    if (context) {
      var hcf = context.health_care_facility;
      if  (hcf) {
        if (hcf.name) hc_facility.name = hcf.name;
        var extref = hcf.external_ref;
        if (extref) {
          if (extref.id) {
            hc_facility.id = {};
            if (extref.id.value) hc_facility.id.value = extref.id.value;
            if (extref.id.scheme) hc_facility.id.scheme = extref.id.scheme;
          }
          if (extref.namespace) hc_facility.id.namespace = extref.namespace;
        }
      }
    }

    var output = {
      uid: data.uid.value,
      health_care_facility: hc_facility,
      patientId: patientId,
      host: host
    };

    metadata.forEach(function(fieldInfo) {
      var parsedData = output;
      var aqlPath = fieldInfo.aqlPath;

      log('\n' + aqlPath);
      log('\n' + JSON.stringify(fieldInfo));

      var fieldObj = getByAQLPath(data, fieldInfo);
      if (!fieldObj) return;

      log('** fieldObj = ' + JSON.stringify(fieldObj));

      var fieldData = {};

      if (fieldObj['@class'] === 'ELEMENT') {
        log('ELEMENT found');
        fieldObj = fieldObj.value;
        log('fieldObj = ' + JSON.stringify(fieldObj, null, 2));
      }

      if (typeof fieldObj === 'string') fieldData.value = fieldObj;

      if (fieldObj.value) fieldData.value = fieldObj.value;
      //if (fieldObj.value && fieldObj.value.value) fieldData.value = fieldObj.value.value;

      console.log('&&& type = ' + fieldInfo.type);

      if (fieldInfo.type === 'DV_CODED_TEXT' || fieldInfo.type === 'DV_TEXT') {
        if (fieldObj.value && fieldObj.value.value) fieldData.value = fieldObj.value.value;
        if (fieldObj.defining_code) {
          if (fieldObj.defining_code.code_string) fieldData.code = fieldObj.defining_code.code_string;
          if (fieldObj.defining_code.codeString) fieldData.code = fieldObj.defining_code.codeString;
          if (fieldObj.defining_code.terminology_id && fieldObj.defining_code.terminology_id.value) {
            fieldData.terminology = fieldObj.defining_code.terminology_id.value;
          }
        }
      }

      if (fieldInfo.type === 'CODE_PHRASE') {
        if (fieldObj.code_string) fieldData.value = fieldObj.code_string;
      }

      if (fieldInfo.type === 'CODE_PHRASE') {
        if (fieldObj.code_string) fieldData.value = fieldObj.code_string;
      }

      if (fieldInfo.type === 'PARTY_PROXY') {
        if (fieldObj.name) fieldData.value = fieldObj.name;
      }

      if (fieldInfo.type === 'DV_COUNT') {
        if (fieldObj.magnitude) fieldData.value = fieldObj.magnitude;
      }

      if (fieldInfo.type === 'DV_PARSABLE') {
        if (fieldObj.value && fieldObj.value.value) fieldData.value = fieldObj.value.value;
      }

      if (fieldInfo.type === 'DV_PROPORTION') {
        console.log('dv_proportion!');
        if (fieldObj.numerator && fieldObj.denominator) {
          console.log('yes!');
          if (fieldObj.type === 'PERCENT') {
            fieldData.value = fieldObj.numerator + '%';
          }
          else {
            fieldData.value = fieldObj.numerator + '/' + fieldObj.denominator;
          }
          console.log('&&& dv-proportion value: ' + fieldData.value);
        }
      }

      if (fieldInfo.type === 'DV_DATE_TIME') {
        if (fieldObj.value && fieldObj.value.value) fieldData.value = fieldObj.value.value;
      }

      if (fieldInfo.type === 'ISM_TRANSITION') {
        if (fieldObj.current_state) {
          if (fieldObj.current_state.value) fieldData.value = fieldObj.current_state.value;
          if (fieldObj.current_state.defining_code) {
            if (fieldObj.current_state.defining_code.code_string) fieldData.code = fieldObj.current_state.defining_code.code_string;
            if (fieldObj.current_state.defining_code.codeString) fieldData.code = fieldObj.current_state.defining_code.codeString;
            if (fieldObj.current_state.defining_code.terminology_id && fieldObj.current_state.defining_code.terminology_id.value) {
              fieldData.terminology = fieldObj.current_state.defining_code.terminology_id.value;
            }
          }
        }
      }

      if (isEmpty(fieldData)) return;

      var path;
      for (var i = 0; i < fieldInfo.path.length; i++) {
        path = fieldInfo.path[i];
        log('path = ' + path);
        if (!parsedData[path]) parsedData[path] = {};
        log('i = ' + i + '; max: ' + fieldInfo.path.length);
        if (i === (fieldInfo.path.length - 1)) {
          parsedData[path] = fieldData;
        }

        parsedData = parsedData[path];
      }
    });
    //if (logging.on) console.log('** output = ' + JSON.stringify(output, null, 2));
    results.push(output);
  });

  return results;
};
