'use strict';

const DocumentStore = require('ewd-document-store');
const DbGlobals = require('ewd-memory-globals');

module.exports = function (config) {
  this.db = new DbGlobals();
  this.documentStore = new DocumentStore(this.db);

  this.jwt = {};
  this.userDefined = {
    config: config
  };

  this.db.reset = () => this.db.store.reset();
  this.db.use = (documentName, ...subscripts) => {
    if (subscripts.length === 1 && Array.isArray(subscripts[0])) {
      subscripts = subscripts[0];
    }

    return new this.documentStore.DocumentNode(documentName, subscripts);
  };
};
