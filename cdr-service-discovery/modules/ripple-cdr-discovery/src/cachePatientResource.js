/*

 ----------------------------------------------------------------------------
 | ripple-cdr-discovery: Ripple Discovery Interface                         |
 |                                                                          |
 | Copyright (c) 2017-18 Ripple Foundation Community Interest Company       |
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

  2 August 2018

*/

module.exports = function(nhsNumber, patientResource, session) {

  var cachedPatient = session.data.$(['Discovery', 'Patient']);

  patientResource.entry.forEach(function(record) {
    var patient = record.resource;
    var id = patient.id;

    if (!cachedPatient.$(['by_uuid', id, 'data']).exists) {
      cachedPatient.$(['by_uuid', id, 'data']).setDocument(patient);
      cachedPatient.$(['by_uuid', id, 'nhsNumber']).value = nhsNumber;
      cachedPatient.$(['by_nhsNumber', nhsNumber, 'Patient', id]).value = id;
      console.log('Saved ' + id);
    }
  });
};
