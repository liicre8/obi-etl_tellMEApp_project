// File: 13_tools/utils/wait-for-elements.js

const waitForElement = async (page, selector, options = {}) => {
  const { visible = false, timeout = 80000 } = options;

  try {
    await page.waitForSelector(selector, { state: visible ? 'visible' : 'attached', timeout });
    return true;
  } catch (error) {
    if (error.name === 'TimeoutError') {
      console.log(`⚠️ Selector not found within ${timeout}ms: ${selector}`);
      return false;
    } else {
      console.error(`❌ Unexpected error while waiting for selector ${selector}:`, error);
      return false;
    }
  }
};

export default waitForElement;
