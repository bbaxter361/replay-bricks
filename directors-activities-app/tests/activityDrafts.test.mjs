import test from 'node:test';
import assert from 'node:assert/strict';
import { approveActivityDraft, createActivityDraftFromSource } from '../src/utils/activityDrafts.js';

test('creates a review draft from a website source', () => {
  const draft = createActivityDraftFromSource({
    sourceType: 'website',
    sourceLabel: 'https://example.com/watercolor-flowers',
    title: 'Watercolor Flowers',
    category: 'art',
  });

  assert.equal(draft.status, 'draft');
  assert.equal(draft.source.type, 'website');
  assert.equal(draft.title, 'Watercolor Flowers');
});

test('approving a draft creates an official activity', () => {
  const draft = createActivityDraftFromSource({
    sourceType: 'file',
    sourceLabel: 'activity.pdf',
    title: 'Chair Yoga',
    category: 'exercise',
  });
  const activity = approveActivityDraft(draft, { approvedBy: 'Amanda' });

  assert.equal(activity.status, 'approved');
  assert.equal(activity.title, 'Chair Yoga');
  assert.equal(activity.approvedBy, 'Amanda');
});
