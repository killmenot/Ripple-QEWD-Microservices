/*

 ----------------------------------------------------------------------------
 | ripple-cdr-openehr: Ripple MicroServices for OpenEHR                     |
 |                                                                          |
 | Copyright (c) 2018 Ripple Foundation Community Interest Company          |
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

  29 December 2018

*/

'use strict';

const EhrRestService = require('../../lib2/services/ehrRestService');
const { lazyLoadAdapter } = require('../../lib2/shared/utils');

class OpenEhrRegistryMock {
  constructor() {
    this.freezed = false;
  }

  initialise(host) {
    if (this.freezed) return;

    const methods = Reflect
      .ownKeys(EhrRestService.prototype)
      .filter(x => x !== 'constructor');

    return jasmine.createSpyObj(host, methods);
  }

  freeze() {
    this.freezed = true;
  }

  static create() {
    return lazyLoadAdapter(new OpenEhrRegistryMock());
  }
}

module.exports = OpenEhrRegistryMock;
