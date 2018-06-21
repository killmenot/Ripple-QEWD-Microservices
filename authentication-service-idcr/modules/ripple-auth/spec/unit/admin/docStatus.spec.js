'use strict';

const handler = require('../../../admin/docStatus');
const Worker = require('../mocks/worker');

describe('ripple-auth/admin/docStatus', () => {
  let q;
  let finished;

  beforeEach(() => {
    q = new Worker();

    spyOn(q.db, 'use').and.callThrough();
    finished = jasmine.createSpy();
  });

  afterEach(() => {
    q.db.reset();
  });

  it('should return empty status', () => {

    const args = {};
    handler.call(q, args, finished);

    expect(q.db.use).toHaveBeenCalledWith('RippleAdmin');
    expect(finished).toHaveBeenCalledWith({
      status: 'docEmpty'
    });
  });

  it('should return initial status', () => {
    const rippleAdmin = new q.documentStore.DocumentNode('RippleAdmin');
    rippleAdmin.value = 'foo';

    const args = {};
    handler.call(q, args, finished);

    expect(q.db.use).toHaveBeenCalledWith('RippleAdmin');
    expect(finished).toHaveBeenCalledWith({
      status: 'initial'
    });
  });
});
