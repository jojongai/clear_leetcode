// Content script for Clear LeetCode
// Runs on LeetCode pages to clear code when toggle is enabled

console.log('Clear LeetCode content script loaded');

// Check if delete responses is enabled and clear code on page load
function checkAndClearCode() {
  chrome.storage.local.get(['deleteResponses'], (result) => {
    const isEnabled = result.deleteResponses || false;
    
    if (isEnabled) {
      console.log('Clear LeetCode: Delete responses is enabled, clearing code...');
      clearLeetCodeCode();
    } else {
      console.log('Clear LeetCode: Delete responses is disabled');
    }
  });
}

// Helper function to remove code after the docstring
// Keeps: class definition, function signature, and docstring
// Removes: everything after the closing """
function removeCodeAfterDocstring(code) {
  if (!code || typeof code !== 'string') {
    return code;
  }

  // Find the last """ in the code (closing docstring)
  const lastDocstringEnd = code.lastIndexOf('"""');
  
  if (lastDocstringEnd === -1) {
    // No docstring found - might not be a standard LeetCode question
    // Return original code unchanged to avoid accidentally clearing
    return code;
  }

  // Find the position after the closing """
  const endOfDocstring = lastDocstringEnd + 3; // 3 is length of """
  
  // Get the content up to and including the closing """
  const contentToKeep = code.substring(0, endOfDocstring);
  
  // Check if there's any content after the docstring
  const remainingContent = code.substring(endOfDocstring).trim();
  
  if (remainingContent.length === 0) {
    // No code to remove, return original
    return code;
  }

  // Return only the content up to and including the closing """
  // This removes all user code after the docstring
  return contentToKeep;
}

// Function to get editor content and set it with processed value
function getAndSetEditorValue(editor, getValueFn, setValueFn) {
  try {
    const currentValue = getValueFn();
    if (!currentValue || typeof currentValue !== 'string') {
      return false;
    }
    
    const processedValue = removeCodeAfterDocstring(currentValue);
    
    // Only update if there was actually content to remove
    if (processedValue !== currentValue) {
      setValueFn(processedValue);
      return true;
    }
    return false;
  } catch (e) {
    console.log('Clear LeetCode: Error processing editor content:', e);
    return false;
  }
}

// Function to clear LeetCode code editor content
function clearLeetCodeCode(retryCount = 0) {
  const maxRetries = 5;
  const tabsetContent = document.querySelector('.flexlayout__tabset_content');
  
  if (!tabsetContent) {
    if (retryCount < maxRetries) {
      // Retry after a delay if container not found yet
      console.log(`Clear LeetCode: flexlayout__tabset_content not found, retrying (${retryCount + 1}/${maxRetries})...`);
      setTimeout(() => clearLeetCodeCode(retryCount + 1), 500);
    } else {
      console.log('Clear LeetCode: flexlayout__tabset_content not found after retries');
    }
    return;
  }

  let cleared = false;

  // Approach 1: Try to find and clear Monaco Editor instance
  // Monaco Editor stores its instance in the DOM element's data attribute or window
  const monacoEditor = findMonacoEditor(tabsetContent);
  if (monacoEditor) {
    try {
      // Method 1: Use Monaco's getValue/setValue API
      if (monacoEditor.getValue && monacoEditor.setValue) {
        const success = getAndSetEditorValue(
          monacoEditor,
          () => monacoEditor.getValue(),
          (value) => monacoEditor.setValue(value)
        );
        if (success) {
          // Also update the model directly
          const model = monacoEditor.getModel();
          if (model && model.setValue) {
            model.setValue(removeCodeAfterDocstring(model.getValue()));
          }
          console.log('Clear LeetCode: Cleared via Monaco Editor API');
          cleared = true;
        }
      }
      // Method 2: Access the model directly
      else if (monacoEditor.getModel) {
        const model = monacoEditor.getModel();
        if (model && model.getValue && model.setValue) {
          const success = getAndSetEditorValue(
            model,
            () => model.getValue(),
            (value) => model.setValue(value)
          );
          if (success) {
            console.log('Clear LeetCode: Cleared via Monaco Model API');
            cleared = true;
          }
        }
      }
    } catch (e) {
      console.log('Clear LeetCode: Monaco API approach failed:', e);
    }
  }

  // Approach 2: Find textarea elements (Monaco often uses a hidden textarea)
  if (!cleared) {
    const textareas = tabsetContent.querySelectorAll('textarea');
    for (const textarea of textareas) {
      if (textarea.value && textarea.value.trim().length > 0) {
        const processedValue = removeCodeAfterDocstring(textarea.value);
        if (processedValue !== textarea.value) {
          textarea.value = processedValue;
          // Trigger events to notify the editor
          textarea.dispatchEvent(new Event('input', { bubbles: true }));
          textarea.dispatchEvent(new Event('change', { bubbles: true }));
          console.log('Clear LeetCode: Cleared via textarea');
          cleared = true;
          break;
        }
      }
    }
  }

  // Approach 3: Find contenteditable divs
  if (!cleared) {
    const contentEditables = tabsetContent.querySelectorAll('[contenteditable="true"]');
    for (const div of contentEditables) {
      if (div.textContent && div.textContent.trim().length > 0) {
        const processedValue = removeCodeAfterDocstring(div.textContent);
        if (processedValue !== div.textContent) {
          div.textContent = processedValue;
          // Trigger events
          div.dispatchEvent(new Event('input', { bubbles: true }));
          div.dispatchEvent(new Event('change', { bubbles: true }));
          console.log('Clear LeetCode: Cleared via contenteditable');
          cleared = true;
          break;
        }
      }
    }
  }

  // Approach 4: Look for CodeMirror or other editor instances
  if (!cleared) {
    // Try to find CodeMirror instances
    const codeMirrors = tabsetContent.querySelectorAll('.CodeMirror');
    for (const cm of codeMirrors) {
      if (cm.CodeMirror && cm.CodeMirror.getValue && cm.CodeMirror.setValue) {
        const success = getAndSetEditorValue(
          cm.CodeMirror,
          () => cm.CodeMirror.getValue(),
          (value) => cm.CodeMirror.setValue(value)
        );
        if (success) {
          console.log('Clear LeetCode: Cleared via CodeMirror');
          cleared = true;
          break;
        }
      }
    }
  }

  // Approach 5: Try to access Monaco via window object
  if (!cleared && window.monaco && window.monaco.editor) {
    // Monaco might be globally available
    const editors = tabsetContent.querySelectorAll('[data-monaco-editor]');
    for (const editorEl of editors) {
      // Try to get editor instance from element
      const editor = editorEl.__monacoEditor || editorEl._editorInstance;
      if (editor && editor.getValue && editor.setValue) {
        const success = getAndSetEditorValue(
          editor,
          () => editor.getValue(),
          (value) => editor.setValue(value)
        );
        if (success) {
          console.log('Clear LeetCode: Cleared via window.monaco');
          cleared = true;
          break;
        }
      }
    }
  }

  // Approach 6: Try to find and clear by common editor class names
  if (!cleared) {
    const editorSelectors = [
      '.monaco-editor',
      '.editor',
      '.code-editor',
      '[class*="editor"]',
      '[class*="monaco"]'
    ];

    for (const selector of editorSelectors) {
      const editors = tabsetContent.querySelectorAll(selector);
      for (const editor of editors) {
        // Try to find textarea or contenteditable within
        const textarea = editor.querySelector('textarea');
        if (textarea && textarea.value) {
          const processedValue = removeCodeAfterDocstring(textarea.value);
          if (processedValue !== textarea.value) {
            textarea.value = processedValue;
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
            console.log('Clear LeetCode: Cleared via editor textarea');
            cleared = true;
            break;
          }
        }
      }
      if (cleared) break;
    }
  }

  if (!cleared) {
    if (retryCount < maxRetries) {
      // Retry if editor not found yet (might still be loading)
      console.log(`Clear LeetCode: Editor not found, retrying (${retryCount + 1}/${maxRetries})...`);
      setTimeout(() => clearLeetCodeCode(retryCount + 1), 500);
    } else {
      console.log('Clear LeetCode: Could not find editor element to clear after retries');
    }
  } else {
    console.log('Clear LeetCode: Successfully cleared code editor');
  }
}

// Helper function to find Monaco Editor instance
function findMonacoEditor(container) {
  // Method 1: Check if Monaco editor is attached to DOM elements
  const monacoElements = container.querySelectorAll('.monaco-editor, [class*="monaco"]');
  
  for (const element of monacoElements) {
    // Monaco editor instance might be stored in various properties
    const possibleProps = [
      '__monacoEditor',
      '_editorInstance',
      'editor',
      'monacoEditor',
      'monaco'
    ];
    
    for (const prop of possibleProps) {
      if (element[prop] && typeof element[prop].setValue === 'function') {
        return element[prop];
      }
    }
    
    // Check parent elements
    let parent = element.parentElement;
    let depth = 0;
    while (parent && depth < 3) {
      for (const prop of possibleProps) {
        if (parent[prop] && typeof parent[prop].setValue === 'function') {
          return parent[prop];
        }
      }
      parent = parent.parentElement;
      depth++;
    }
  }

  // Method 2: Try to access via window.monaco.editor.getEditors()
  if (window.monaco && window.monaco.editor && window.monaco.editor.getEditors) {
    const editors = window.monaco.editor.getEditors();
    if (editors && editors.length > 0) {
      // Return the first editor found in our container
      for (const editor of editors) {
        const editorDom = editor.getContainerDomNode();
        if (container.contains(editorDom)) {
          return editor;
        }
      }
      // If we can't match by container, return the first one
      return editors[0];
    }
  }

  return null;
}

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for LeetCode's dynamic content to load
    setTimeout(() => {
      checkAndClearCode();
    }, 1000);
  });
} else {
  // DOM already loaded
  setTimeout(() => {
    checkAndClearCode();
  }, 1000);
}

// Listen for messages from popup when toggle changes
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateDeleteSetting') {
    const isEnabled = request.enabled;
    
    if (isEnabled) {
      console.log('Clear LeetCode: Toggle turned ON, clearing code...');
      clearLeetCodeCode();
    } else {
      console.log('Clear LeetCode: Toggle turned OFF');
    }
    
    sendResponse({ success: true });
  }
  
  return true; // Keep the message channel open for async response
});

