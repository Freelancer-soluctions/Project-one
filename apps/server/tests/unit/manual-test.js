import { extractMentionIds } from '../src/modules/notes/utils/mentionParser.js';

async function runTests() {
  console.log('Testing the extractMentionIds function');

  // Test with a mention
  const test1 = '<p><span data-type="mention" data-id="1">@User1</span></p>';
  console.log('Test 1 result:', await extractMentionIds(test1));

  // Test with multiple mentions
  const test2 = '<p><span data-type="mention" data-id="1">@User1</span> and <span data-type="mention" data-id="2">@User2</span></p>';
  console.log('Test 2 result:', await extractMentionIds(test2));

  // Test with no content
  const test3 = '';
  console.log('Test with no content:', await extractMentionIds(test3));

  console.log('Test with null:', await extractMentionIds(null));
}

runTests();