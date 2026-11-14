import test from 'node:test';
import assert from 'node:assert/strict';
import { badgeVariants } from '../badge-variants.ts';

test('badgeVariants generates default badge classes', () => {
  const cls = badgeVariants();
  assert.match(cls, /inline-flex items-center/);
  assert.match(cls, /bg-primary/);
});

test('badgeVariants correctly handles semantic application status variants', () => {
  const offerCls = badgeVariants({ variant: 'offer' });
  assert.match(offerCls, /emerald/);

  const interviewCls = badgeVariants({ variant: 'interview' });
  assert.match(interviewCls, /amber/);

  const appliedCls = badgeVariants({ variant: 'applied' });
  assert.match(appliedCls, /blue/);

  const rejectedCls = badgeVariants({ variant: 'rejected' });
  assert.match(rejectedCls, /rose/);
});

test('badgeVariants accepts custom className and merges properly', () => {
  const custom = badgeVariants({ variant: 'outline', className: 'uppercase tracking-wider' });
  assert.match(custom, /uppercase/);
  assert.match(custom, /tracking-wider/);
});
