/*

 ----------------------------------------------------------------------------
 | qewd-openid-connect: QEWD-enabled OpenId Connect Server                  |
 |                                                                          |
 | Copyright (c) 2018 M/Gateway Developments Ltd,                           |
 | Redhill, Surrey UK.                                                      |
 | All rights reserved.                                                     |
 |                                                                          |
 | http://www.mgateway.com                                                  |
 | Email: rtweed@mgateway.com                                               |
 |                                                                          |
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

  4 August 2018

*/

'use strict';

const logoutSource = require('../../lib/logoutSource');
const { stripWhitespaces } = require('../helpers/utils');

describe('qewd-openid-connect/lib/logoutSource', () => {
  it('should set logout page html', () => {
    const expected = stripWhitespaces(`
      <!DOCTYPE html>
      <head>
        <title>Logout</title>
      </head>
      <body>
        <form></form>
        <script>
          var form = document.forms[0];
          var input = document.createElement('input');
          input.type = 'hidden';
          input.name = 'logout';
          input.value = 'yes';

          form.appendChild(input);

          form.submit();
        </script>
      </body>
    </html>`
    );

    const ctx = {};
    const form = '<form></form>';

    logoutSource(ctx, form);

    const actual = stripWhitespaces(ctx.body);
    expect(actual).toBe(expected);
  });
});
